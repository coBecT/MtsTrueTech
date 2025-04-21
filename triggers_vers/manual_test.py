from versioning import VersionStore, ExperimentVersion
from datetime import datetime
import logging
import uuid

def main():
    try:
        store = VersionStore("postgresql://postgres:postgres@localhost/test_db")
        print("Подключение к базе данных успешно установлено")

        experiment_uuid = str(uuid.uuid4())

        with store._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO experiments (id, name, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                """, (
                    experiment_uuid,
                    "Тестовый эксперимент",
                    "Описание тестового эксперимента"
                ))
                conn.commit()

        first_version = ExperimentVersion(
            experiment_id=experiment_uuid, 
            version_name="Первая версия",
            description="Тестовая версия для проверки"
        )
        first_version.add_parameter("Температура", "36.6", "float", "°C")
        first_version.add_parameter("Давление", "760", "int", "мм рт.ст.")

        with store._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM experiments WHERE id = %s", 
                          (first_version.experiment_id,))
                if not cur.fetchone():
                    print("Предупреждение: эксперимент не существует в БД")
                    cur.execute("""
                    INSERT INTO experiments (id, name, description)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """, (
                        first_version.experiment_id,
                        "Тестовый эксперимент",
                        "Описание тестового эксперимента"
                    ))
                    conn.commit()

        print(f"Attributes: {vars(first_version)}")  
        created = store.create_version(first_version)
        print(f"Создана версия: {created.id} (v{created.version_number})")

        forked_version = ExperimentVersion(
            experiment_id=str(uuid.uuid4()), 
            version_name="Форкнутая версия"
        )
        
        forked = store.fork_version(created.id, forked_version)
        print(f"Форкнутая версия: {forked.id} (v{forked.version_number})")

        print("\nПараметры форкнутой версии:")
        for param in forked.parameters:
            print(f"{param.name}: {param.value} {param.unit}")

        print("\nЗагрузка из БД:")
        loaded = store.get_version(forked.id)
        if loaded:
            print(f"Загружена версия: {loaded.version_name}")
            print(f"Статус: {loaded.status}")
            print(f"Параметров: {len(loaded.parameters)}")

        try:
            store.fork_version("несуществующий-id", forked_version)
        except Exception as e:
            print(f"\nОшибка при форкинге (ожидаемо): {type(e).__name__}: {e}")

        with store._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT v.id, v.version_name, v.version_number, p.name, p.value 
                FROM experiment_versions v
                JOIN parameters p ON v.id = p.version_id
                ORDER BY v.version_number;
                """)
                print("\nДанные в БД:")
                for row in cur.fetchall():
                    print(f"Версия {row[2]}: {row[1]} | Параметр: {row[3]}={row[4]}")

    except Exception as e:
        logging.error(f"Ошибка в основном потоке: {type(e).__name__}: {e}")

if __name__ == "__main__":
    main()