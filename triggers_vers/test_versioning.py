import unittest
import os
from datetime import datetime, timezone
from versioning import VersionStore, ExperimentVersion, Parameter, FileReference
import uuid
import tempfile
import json
import psycopg2
from psycopg2 import sql
from unittest.mock import patch
from versioning import TelegramNotifier
import time

class TestVersioningSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db_host = "localhost"
        cls.db_port = 5432
        cls.db_name = "test_db"
        cls.db_user = "postgres"
        cls.db_password = "postgres"
        
        cls.db_url = f"postgresql://{cls.db_user}:{cls.db_password}@{cls.db_host}:{cls.db_port}/{cls.db_name}"
        
        try:
            admin_conn = psycopg2.connect(
                host=cls.db_host,
                port=cls.db_port,
                user=cls.db_user,
                password=cls.db_password,
                database="postgres"
            )
            admin_conn.autocommit = True
            admin_cur = admin_conn.cursor()
            
            try:
                admin_cur.execute(f"CREATE DATABASE {cls.db_name}")
            except psycopg2.errors.DuplicateDatabase:
                pass
            
            admin_cur.close()
            admin_conn.close()

            cls.store = VersionStore(
                db_url=cls.db_url,
                telegram_token="test_token",
                telegram_chat_id="test_chat_id"
            )
            cls.store.setup_trigger()  
            
        except Exception as e:
            raise ConnectionError(f"Ошибка подключения к PostgreSQL: {e}")

        cls.test_file_path = os.path.join(tempfile.gettempdir(), "test_experiment_data.xlsx")
        with open(cls.test_file_path, 'wb') as f:
            f.write(b"test data")  

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.test_file_path):
            os.remove(cls.test_file_path)

    def setUp(self):
        """Очистка базы перед каждым тестом"""
        with self.store._get_connection() as conn:
            with conn.cursor() as cur:
                tables = [
                    "parameters", "results", "metadata",
                    "file_references", "experiment_versions", "experiments",
                ]
                for table in tables:
                    cur.execute(sql.SQL("TRUNCATE TABLE {} CASCADE").format(sql.Identifier(table)))
                conn.commit()

        self.experiment_id = str(uuid.uuid4())
        self.version = ExperimentVersion(
            experiment_id=self.experiment_id,
            version_name="Test Version"
        )
        self.version.change_log = "Initial version for testing"
        self.version.add_parameter("param1", "100", "int", "units")

        self.file_ref = FileReference(
            source_type="excel",
            path_or_url=self.test_file_path,
            file_type="dataset"
        )

    def test_1_experiment_creation(self):
        """Тест создания версии эксперимента"""
        created = self.store.create_version(self.version)

        self.assertIsNotNone(created.id)
        self.assertEqual(created.version_number, 1)
        self.assertEqual(created.status, "draft")
        self.assertEqual(created.change_log, "Initial version for testing")

        with self.store._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM experiment_versions WHERE id = %s", (created.id,))
                self.assertTrue(cur.fetchone())

    def test_2_parameter_handling(self):
        """Тест работы с параметрами"""
        created = self.store.create_version(self.version)
        loaded = self.store.get_version(created.id)

        self.assertEqual(len(loaded.parameters), 1)
        param = loaded.parameters[0]
        self.assertEqual(param.name, "param1")
        self.assertEqual(param.value, "100")
        self.assertEqual(param.type, "int")
        self.assertEqual(param.unit, "units")

        with self.store._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT name, value, type, unit 
                FROM parameters 
                WHERE version_id = %s
                """, (created.id,))
                db_param = cur.fetchone()
                self.assertEqual(db_param[0], "param1")
                self.assertEqual(db_param[1], "100")

    def test_3_file_reference(self):
        """Тест работы с файлами"""
        self.assertTrue(os.path.exists(self.test_file_path))
        self.assertGreater(os.path.getsize(self.test_file_path), 0)

        self.assertEqual(len(self.file_ref.file_hash), 64) 
        self.assertGreater(self.file_ref.size_bytes, 0)

        self.version.add_file_reference(self.file_ref)
        created = self.store.create_version(self.version)

        loaded = self.store.get_version_with_files(created.id)
        self.assertEqual(len(loaded.file_references), 1)
        
        loaded_file = loaded.file_references[0]
        self.assertEqual(loaded_file.source_type, "excel")
        self.assertEqual(loaded_file.file_hash, self.file_ref.file_hash)

        with self.store._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT source_type, file_hash 
                FROM file_references 
                WHERE version_id = %s
                """, (created.id,))
                db_file = cur.fetchone()
                self.assertEqual(db_file[0], "excel")
                self.assertEqual(db_file[1], self.file_ref.file_hash)

    def test_4_metadata_operations(self):
        """Тест работы с метаданными"""
        created = self.store.create_version(self.version)

        self.store.add_metadata(created.id, "author", "test@example.com")
        self.store.add_metadata(created.id, "environment", "production")

        loaded = self.store.get_version_with_files(created.id)
        self.assertEqual(loaded.metadata["author"], "test@example.com")
        self.assertEqual(loaded.metadata["environment"], "production")

        self.store.add_metadata(created.id, "author", "new@example.com")
        updated = self.store.get_version_with_files(created.id)
        self.assertEqual(updated.metadata["author"], "new@example.com")

    def test_5_results_handling(self):
        """Тест работы с результатами"""
        created = self.store.create_version(self.version)

        test_results = {
            "accuracy": 0.95,
            "precision": 0.89,
            "recall": 0.91,
            "data": [1, 2, 3]
        }
        self.store.add_result(created.id, test_results, "initial metrics")

        loaded = self.store.get_version_with_files(created.id)
        self.assertEqual(len(loaded.results), 1)
        result = loaded.results[0]

        self.assertEqual(result["metrics"], "initial metrics")

        result_data = result["data"]
        if isinstance(result_data, str):
            result_data = json.loads(result_data)
        
        self.assertEqual(result_data["accuracy"], 0.95)
        self.assertEqual(result_data["data"], [1, 2, 3])

    def test_6_version_forking(self):
        """Тест ветвления версий"""
        original = self.store.create_version(self.version)

        forked_version = ExperimentVersion(
            experiment_id=self.experiment_id,
            version_name="Forked Version"
        )
        forked_version.change_log = f"Forked from version {original.id}"

        forked = self.store.fork_version(original.id, forked_version)

        self.assertEqual(forked.parent_version_id, original.id)
        self.assertEqual(forked.version_number, original.version_number + 1)

        self.assertEqual(len(forked.parameters), len(original.parameters))
        self.assertEqual(forked.parameters[0].name, original.parameters[0].name)

    def test_7_error_handling(self):
        """Тест обработки ошибок"""
        with self.assertRaises(ValueError):
            self.store.fork_version("invalid-uuid", self.version)

        with self.assertRaises(FileNotFoundError):
            invalid_file_ref = FileReference(
                source_type="excel",
                path_or_url="nonexistent.file",
                file_type="dataset"
            )

        with self.assertRaises(ValueError):
            FileReference(
                source_type="invalid",
                path_or_url=self.test_file_path,
                file_type="dataset"
            )

    def test_8_duplicate_parameter_prevention(self):
        """Тест предотвращения дублирования параметров"""
        created = self.store.create_version(self.version)

        with self.assertRaises(psycopg2.errors.RaiseException) as cm:
            with self.store._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                    INSERT INTO parameters (id, version_id, name, value, type, unit)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        str(uuid.uuid4()),
                        created.id,
                        "param1",  
                        "200",
                        "int",
                        "units"
                    ))
                    conn.commit()

        self.assertIn("Duplicate parameter", str(cm.exception))

    def test_9_status_change_workflow(self):
        """Тест workflow изменения статуса"""
        with patch.object(self.store.telegram_notifier, 'send_notification') as mock_send:
            mock_send.return_value = {"ok": True}
            
            version = self.store.create_version(self.version)
            version.status = "completed"  
            
            updated = self.store.update_version(version)
            
            time.sleep(2)
            
            self.assertTrue(mock_send.called)
            self.assertEqual(updated.status, "completed")

    def test_10_invalid_status_prevention(self):
        """Тест предотвращения невалидных статусов"""
        version = self.store.create_version(self.version)
        version.status = "invalid_status"
        
        with self.assertRaises(psycopg2.errors.RaiseException) as cm:
            self.store.update_version(version)
        
        self.assertIn("Invalid status", str(cm.exception))
        
        db_version = self.store.get_version(version.id)
        self.assertNotEqual(db_version.status, "invalid_status")

    def test_11_status_change_notification(self):
        """Тест уведомлений об изменении статуса"""
        with patch.object(self.store.telegram_notifier, 'send_notification') as mock_send:
            mock_send.return_value = {"ok": True}
            
            version = self.store.create_version(self.version)
            version.status = 'completed'  
            self.store.update_version(version)
            
            time.sleep(2)  
            
            self.assertTrue(mock_send.called)
            notification_text = mock_send.call_args[0][0]
            self.assertIn("completed", notification_text)

    def test_12_critical_parameters(self):
        """Тест критических параметров"""
        with patch.object(self.store.telegram_notifier, 'send_notification') as mock_send:
            mock_send.return_value = {"ok": True}
            
            version = ExperimentVersion(
                experiment_id=str(uuid.uuid4()),
                version_name="Critical Test"
            )
            version.add_parameter("Temperature", "50", "float", "°C")
            
            created = self.store.create_version(version)
            alerts = self.store.monitor.check_version(created.id)
            
            self.assertEqual(len(alerts), 1)
            self.assertEqual(alerts[0]['parameter'], "Temperature")
            self.assertTrue(mock_send.called)

if __name__ == '__main__':
    unittest.main(failfast=True)