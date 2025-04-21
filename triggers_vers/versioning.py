import uuid
from datetime import datetime,timezone
from typing import List,Optional,Dict,Any
import psycopg2
from psycopg2 import sql,extras
import logging
import json
import hashlib
import os
import requests
import threading
from functools import lru_cache
import queue

logging.basicConfig(level=logging.INFO)
logger=logging.getLogger(__name__)

class BioDataUpdater:
    def __init__(self):
        self.base_url="https://www.uniprot.org/uniprot"
    
    @lru_cache(maxsize=100)
    def fetch_protein_data(self,protein_id:str)->Dict[str,Any]:
        try:
            if not protein_id or not isinstance(protein_id,str):
                raise ValueError("Protein ID must be a non-empty string")
            
            url=f"{self.base_url}/{protein_id}.json"
            response=requests.get(url,timeout=10)
            response.raise_for_status()
            data=response.json()
            
            if not all(key in data for key in['proteinDescription','sequence']):
                raise ValueError("Invalid protein data structure received")
            
            return{
                'name':data['proteinDescription']['recommendedName']['fullName']['value'],
                'sequence':data['sequence']['value'],
                'length':data['sequence']['length']
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error fetching protein data:{str(e)}")
            raise
        except(KeyError,ValueError)as e:
            logger.error(f"Invalid protein data received:{str(e)}")
            raise

class CriticalParametersMonitor:
    def __init__(self,store:'VersionStore'):
        self.store=store
        self.rules={
            'Temperature':{'check':lambda v:float(v)>40 or float(v)<10,'message':"Temperature out of safe range(10-40°C)"},
            'Pressure':{'check':lambda v:float(v)>1100 or float(v)<900,'message':"Pressure out of safe range(900-1100hPa)"},
            'pH':{'check':lambda v:float(v)>9 or float(v)<5,'message':"pH out of safe range(5-9)"},
            'Sequence Length':{'check':lambda v:int(v)>5000 or int(v)<50,'message':"Sequence length out of safe range(50-5000)"}
        }
        
    def check_version(self,version_id:str)->List[Dict[str,str]]:
        version=self.store.get_version_with_files(version_id)
        alerts=[]
        for param in version.parameters:
            if param.name in self.rules:
                rule=self.rules[param.name]
                
                try:
                    if rule['check'](param.value):
                        alerts.append({
                            'parameter':param.name,
                            'value':f"{param.value}{param.unit}",
                            'message':rule['message']
                        })
                except(ValueError,TypeError)as e:
                    logger.warning(f"Invalid parameter value for {param.name}:{param.value}")
                    
        if alerts and self.store.telegram_notifier:
            message="⚠️*Critical Parameters Alert*\n"+"\n".join(
                f"•{alert['parameter']}:{alert['value']}-{alert['message']}"
                for alert in alerts)
            self.store.telegram_notifier.send_notification(message)
        return alerts

class TelegramNotifier:
    def __init__(self,token:str,chat_id:str):
        self.base_url=f"https://api.telegram.org/bot{token}"
        self.chat_id=str(chat_id)
        
    def send_notification(self,message:str):
        try:
            url=f"{self.base_url}/sendMessage"
            params={
                "chat_id":self.chat_id,
                "text":message,
                "parse_mode":"Markdown"
            }
            response=requests.post(url,json=params,timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Telegram send error:{str(e)}")
            raise

class WeatherUpdater:
    def __init__(self,api_key:str):
        self.api_key=api_key
        
    def get_current_weather(self,location:str):
        url="https://api.openweathermap.org/data/2.5/weather"
        params={
            'q':location,
            'appid':self.api_key,
            'units':'metric'
        }
        try:
            response=requests.get(url,params=params,timeout=10)
            response.raise_for_status()
            data=response.json()
            
            if'main'not in data:
                raise ValueError("Invalid weather data structure")
            return{
                'temperature':data['main'].get('temp',0),
                'humidity':data['main'].get('humidity',0),
                'pressure':data['main'].get('pressure',0)
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Weather API error:{str(e)}")
            raise

class Parameter:
    def __init__(self,name:str,value:str,type:str,unit:str=""):
        if not name or not isinstance(name,str):
            raise ValueError("Parameter name must be a non-empty string")
        
        valid_types=['string','int','float','text','bool']
        
        if type not in valid_types:
            raise ValueError(f"Invalid type. Allowed:{valid_types}")
        
        self.id=str(uuid.uuid4())
        self.name=name
        self.value=value
        self.type=type
        self.unit=unit
        self._validate_value()
        
    def _validate_value(self):
        try:
            if self.type=='int':
                int(self.value)
            elif self.type=='float':
                float(self.value)
            elif self.type=='bool':
                if self.value.lower()not in('true','false','1','0'):
                    raise ValueError
        except ValueError:
            raise ValueError(f"Invalid value'{self.value}'for type'{self.type}'")

class FileReference:
    MAX_FILE_SIZE=100*1024*1024
    def __init__(self,source_type:str,path_or_url:str,file_type:str=None):
        if source_type.lower()not in('excel','sql','cloud','api'):
            raise ValueError(f"Invalid source type:{source_type}")
        
        self.id=str(uuid.uuid4())
        self.source_type=source_type.lower()
        self.path_or_url=path_or_url
        
        if not any(path_or_url.startswith(proto)for proto in('http://','https://','ftp://')):
            if not os.path.exists(path_or_url):
                raise FileNotFoundError(f"File not found:{path_or_url}")
            if os.path.getsize(path_or_url)>self.MAX_FILE_SIZE:
                raise ValueError(f"File too large(>{self.MAX_FILE_SIZE/1024/1024}MB)")
            
        self.file_hash=self._calculate_file_hash()if not any(
            path_or_url.startswith(proto)
            for proto in('http://','https://','ftp://')) else""
        
        if file_type and file_type.lower()not in('dataset','model','config','other'):
            raise ValueError(f"Invalid file type:{file_type}")
        
        self.file_type=file_type.lower()if file_type else None
        self.size_bytes=self._get_file_size()if self.file_hash else 0
        self.uploaded_at=datetime.now(timezone.utc)
        
    def _calculate_file_hash(self)->str:
        try:
            file_path=os.path.abspath(os.path.normpath(self.path_or_url))
            
            if not os.path.exists(file_path):
                logger.error(f"File not found:{file_path}")
                return""
            if os.path.getsize(file_path)==0:
                logger.error(f"Empty file:{file_path}")
                return""
            
            sha256=hashlib.sha256()
            
            with open(file_path,'rb')as f:
                while chunk:=f.read(4096):
                    sha256.update(chunk)
            return sha256.hexdigest()
        
        except Exception as e:
            logger.error(f"Hash calculation error for {self.path_or_url}:{str(e)}")
            return""
        
    def _get_file_size(self)->int:
        try:
            return os.path.getsize(self.path_or_url)
        except OSError as e:
            logger.error(f"File size error:{str(e)}")
            return 0
        
    def to_dict(self)->Dict[str,Any]:
        return{
            "id":self.id,
            "source_type":self.source_type,
            "path_or_url":self.path_or_url,
            "file_hash":self.file_hash,
            "file_type":self.file_type,
            "size_bytes":self.size_bytes,
            "uploaded_at":self.uploaded_at.isoformat()
        }

class ExperimentVersion:
    VALID_STATUSES=['draft','active','completed','archived']
    
    def __init__(self,experiment_id:str,version_name:str,description:str=""):
        if not experiment_id:
            raise ValueError("Experiment ID is required")
        if not version_name:
            raise ValueError("Version name is required")
        
        self.id=str(uuid.uuid4())
        self.experiment_id=experiment_id
        self.version_number=0
        self.version_name=version_name
        self.description=description
        self.created_at=datetime.now(timezone.utc)
        self.status="draft"
        self.parent_version_id=None
        self.change_log=""
        self.parameters:List[Parameter]=[]
        self.results=[]
        self.metadata:Dict[str,str]={}
        self.file_references:List[FileReference]=[]
        
    def add_parameter(self,name:str,value:str,type:str,unit:str=""):
        if any(p.name==name for p in self.parameters):
            raise ValueError(f"Parameter'{name}'already exists")
        self.parameters.append(Parameter(name,value,type,unit))
        
    def add_file_reference(self,file_ref:FileReference):
        if not isinstance(file_ref,FileReference):
            raise ValueError("Expected FileReference object")
        self.file_references.append(file_ref)
        
    def validate(self):
        if self.status not in self.VALID_STATUSES:
            raise ValueError(f"Invalid status:{self.status}")
        
    def to_dict(self)->Dict[str,Any]:
        return{
            "id":self.id,
            "experiment_id":self.experiment_id,
            "version_number":self.version_number,
            "version_name":self.version_name,
            "description":self.description,
            "status":self.status,
            "parameters":[p.to_dict()for p in self.parameters],
            "file_references":[f.to_dict()for f in self.file_references],
            "metadata":self.metadata,
            "created_at":self.created_at.isoformat(),
            "parent_version_id":self.parent_version_id,
            "change_log":self.change_log
        }

class VersionStore:
    def __init__(self, db_url: str, telegram_token: str = None, telegram_chat_id: str = None):
        self.db_url = db_url
        self._notification_queue = queue.Queue()
        self.telegram_notifier = TelegramNotifier(telegram_token, telegram_chat_id) if telegram_token and telegram_chat_id else None
        self.monitor = CriticalParametersMonitor(self)
        self._setup_listeners()
        
    def _setup_listeners(self):
        """Setup PostgreSQL LISTEN/NOTIFY listeners with queue"""
        def listener():
            conn = self._get_connection()
            conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            cursor.execute("LISTEN status_change")
            
            while True:
                if conn.poll():
                    while conn.notifies:
                        notify = conn.notifies.pop(0)
                        self._notification_queue.put(notify)

        self._listener_thread = threading.Thread(target=listener, daemon=True)
        self._listener_thread.start()
        
        # Start notification processor
        threading.Thread(target=self._process_notifications, daemon=True).start()
        
    def _process_notifications(self):
        """Process notifications from queue"""
        while True:
            notify = self._notification_queue.get()
            try:
                data = json.loads(notify.payload)
                self._handle_status_change(data)
            except Exception as e:
                logger.error(f"Error processing notification: {str(e)}")
            finally:
                self._notification_queue.task_done()
        
    def _handle_status_change(self, data: dict):
        """Handle status change notification"""
        try:
            logger.info(f"Received status change: {data}")
            if not isinstance(data, dict):
                raise ValueError("Invalid notification format")
                
            message = (
                f"🔔 Status Update\n"
                f"Experiment: {data.get('experiment_id')}\n"
                f"Version: {data.get('version_id')}\n"
                f"Status changed to: {data.get('new_status')}"
            )
            
            if self.telegram_notifier:
                logger.info(f"Sending notification: {message}")
                self.telegram_notifier.send_notification(message)
        except Exception as e:
            logger.error(f"Error handling status change: {str(e)}")
            
    def _get_connection(self):
        return psycopg2.connect(self.db_url)
    
    def _create_tables(self):
        with self._get_connection()as conn:
            with conn.cursor()as cur:
                try:
                    cur.execute("""
                    DROP TABLE IF EXISTS 
                        parameters,
                        results,
                        metadata,
                        file_references,
                        experiment_versions,
                        experiments CASCADE;
                    """)
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS experiments(
                        id UUID PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        created_by UUID,
                        tab_id UUID
                    )""")
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS experiment_versions(
                        id UUID PRIMARY KEY,
                        experiment_id UUID REFERENCES experiments(id),
                        version_number INTEGER NOT NULL,
                        version_name TEXT NOT NULL,
                        description TEXT,
                        status TEXT NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        parent_version_id UUID REFERENCES experiment_versions(id),
                        change_log TEXT
                    )""")
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS parameters(
                        id UUID PRIMARY KEY,
                        version_id UUID REFERENCES experiment_versions(id),
                        name TEXT NOT NULL,
                        value TEXT NOT NULL,
                        type TEXT NOT NULL,
                        unit TEXT
                    )""")
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS results(
                        id UUID PRIMARY KEY,
                        version_id UUID REFERENCES experiment_versions(id),
                        data JSONB NOT NULL,
                        metrics TEXT,
                        is_approved BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )""")
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS metadata(
                        id UUID PRIMARY KEY,
                        version_id UUID REFERENCES experiment_versions(id),
                        key TEXT NOT NULL,
                        value TEXT NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        UNIQUE(version_id,key)
                    )""")
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS file_references(
                        id UUID PRIMARY KEY,
                        version_id UUID REFERENCES experiment_versions(id),
                        source_type TEXT NOT NULL CHECK(source_type IN('excel','sql','cloud','api')),
                        path_or_url TEXT NOT NULL,
                        file_hash TEXT NOT NULL,
                        file_type TEXT CHECK(file_type IN('dataset','model','config','other')),
                        size_bytes INTEGER,
                        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        description TEXT
                    )""")
                    cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_parameters_version_id ON parameters(version_id);
                    CREATE INDEX IF NOT EXISTS idx_parameters_name ON parameters(name);
                    CREATE INDEX IF NOT EXISTS idx_experiment_versions_experiment_id ON experiment_versions(experiment_id);
                    """)
                    conn.commit()
                    logger.info("Tables created successfully")
                    
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS experiment_stats(
                        experiment_id UUID,
                        param_name TEXT,
                        median_value NUMERIC,
                        PRIMARY KEY(experiment_id, param_name)
                    )
                    """)
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS experiment_stats(
                        experiment_id UUID,
                        param_name TEXT,
                        median_value NUMERIC,
                        PRIMARY KEY(experiment_id, param_name)
                    )
                    """)
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Table creation error:{str(e)}")
                    raise
                
    def create_version(self,version:ExperimentVersion)->ExperimentVersion:
        if not isinstance(version,ExperimentVersion):
            raise ValueError("Expected ExperimentVersion object")
        version.validate()
        
        with self._get_connection()as conn:
            with conn.cursor()as cur:
                try:
                    logger.info(f"Creating version for experiment{version.experiment_id}")
                    cur.execute("""
                    SELECT COALESCE(MAX(version_number),0)+1 
                    FROM experiment_versions 
                    WHERE experiment_id=%s
                    """,(version.experiment_id,))
                    version.version_number=cur.fetchone()[0]or 1
                    cur.execute("""
                    INSERT INTO experiments(id,name,description)
                    VALUES(%s,%s,%s)
                    ON CONFLICT(id)DO NOTHING
                    """,(
                        version.experiment_id,
                        "New experiment",
                        "Automatically created experiment"
                    ))
                    cur.execute("""
                    INSERT INTO experiment_versions
                    (id,experiment_id,version_number,version_name,
                     description,status,created_at,parent_version_id,change_log)
                    VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    RETURNING id
                    """,(
                        version.id,
                        version.experiment_id,
                        version.version_number,
                        version.version_name,
                        version.description,
                        version.status,
                        version.created_at,
                        version.parent_version_id,
                        version.change_log
                    ))
                    version.id=cur.fetchone()[0]
                    if version.parameters:
                        extras.execute_batch(cur,
                            """
                            INSERT INTO parameters
                            (id,version_id,name,value,type,unit)
                            VALUES(%s,%s,%s,%s,%s,%s)
                            """,
                            [(p.id,version.id,p.name,p.value,p.type,p.unit)
                             for p in version.parameters]
                        )
                    if version.file_references:
                        for file_ref in version.file_references:
                            self._add_file_reference(cur,version.id,file_ref)
                    conn.commit()
                    logger.info(f"Version{version.id}created successfully")
                    return version
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Version creation error:{str(e)}")
                    raise RuntimeError(f"Failed to create version:{str(e)}")
                
    def _add_file_reference(self,cur,version_id:str,file_ref:FileReference):
        if not isinstance(file_ref,FileReference):
            raise ValueError("Expected FileReference object")
        
        cur.execute("""
        INSERT INTO file_references
        (id,version_id,source_type,path_or_url,
         file_hash,file_type,size_bytes,uploaded_at)
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s)
        """,(
            file_ref.id,
            version_id,
            file_ref.source_type,
            file_ref.path_or_url,
            file_ref.file_hash,
            file_ref.file_type,
            file_ref.size_bytes,
            file_ref.uploaded_at
        ))
        
    def fork_version(self,parent_id:str,new_version:ExperimentVersion)->ExperimentVersion:
        try:
            if not parent_id:
                raise ValueError("Parent version ID is required")
            logger.info(f"Forking version{parent_id}")
            
            try:
                uuid.UUID(parent_id)
            except ValueError:
                raise ValueError(f"Invalid version ID format:{parent_id}")
            
            parent=self.get_version(parent_id)
            if not parent:
                raise ValueError(f"Parent version{parent_id}not found")
            
            new_version.parameters=[
                Parameter(p.name,p.value,p.type,p.unit)
                for p in parent.parameters
            ]
            
            new_version.parent_version_id=parent.id
            new_version.version_number=parent.version_number+1
            with self._get_connection()as conn:
                with conn.cursor()as cur:
                    cur.execute("SELECT 1 FROM experiments WHERE id=%s",(new_version.experiment_id,))
                    if not cur.fetchone():
                        cur.execute("""
                        INSERT INTO experiments(id,name,description)
                        VALUES(%s,'Forked Experiment','Automatically created')
                        """,(new_version.experiment_id,))
                        conn.commit()
            return self.create_version(new_version)
        except Exception as e:
            logger.error(f"Forking error:{str(e)}")
            raise
        
    def get_version(self,version_id:str)->Optional[ExperimentVersion]:
        if not version_id:
            raise ValueError("Version ID is required")
        
        with self._get_connection()as conn:
            with conn.cursor()as cur:
                try:
                    cur.execute("""
                    SELECT id,experiment_id,version_number,version_name,
                           description,status,created_at,parent_version_id,change_log
                    FROM experiment_versions
                    WHERE id=%s
                    """,(version_id,))
                    row=cur.fetchone()
                    if not row:
                        logger.warning(f"Version{version_id}not found")
                        return None
                    version=ExperimentVersion(
                        experiment_id=row[1],
                        version_name=row[3],
                        description=row[4]or""
                    )
                    version.id=row[0]
                    version.version_number=row[2]
                    version.status=row[5]
                    version.created_at=row[6]
                    version.parent_version_id=row[7]
                    version.change_log=row[8]or""
                    cur.execute("""
                    SELECT id,name,value,type,unit
                    FROM parameters
                    WHERE version_id=%s
                    """,(version.id,))
                    for p_row in cur.fetchall():
                        version.parameters.append(Parameter(
                            name=p_row[1],
                            value=p_row[2],
                            type=p_row[3],
                            unit=p_row[4]
                        ))
                    logger.info(f"Version{version_id}loaded successfully")
                    return version
                except Exception as e:
                    logger.error(f"Version load error:{str(e)}")
                    raise
                
    def get_version_with_files(self,version_id:str)->Optional[ExperimentVersion]:
        version=self.get_version(version_id)
        
        if not version:
            return None
        
        with self._get_connection()as conn:
            with conn.cursor()as cur:
                cur.execute("""
                SELECT id,source_type,path_or_url,file_hash,
                       file_type,size_bytes,uploaded_at
                FROM file_references
                WHERE version_id=%s
                """,(version_id,))
                
                for row in cur.fetchall():
                    file_ref=FileReference(
                        source_type=row[1],
                        path_or_url=row[2],
                        file_type=row[4]
                    )
                    file_ref.id=row[0]
                    file_ref.file_hash=row[3]
                    file_ref.size_bytes=row[5]
                    file_ref.uploaded_at=row[6]
                    version.add_file_reference(file_ref)
                    
                cur.execute("""
                SELECT key,value FROM metadata
                WHERE version_id=%s
                """,(version_id,))
                version.metadata={row[0]:row[1]for row in cur.fetchall()}
                cur.execute("""
                SELECT data,metrics FROM results
                WHERE version_id=%s
                """,(version_id,))
                version.results=[{
                    "data":json.loads(row[0])if isinstance(row[0],str)else row[0],
                    "metrics":row[1]
                }for row in cur.fetchall()]
        return version
    
    def get_version_history(self, experiment_id: str) -> List[ExperimentVersion]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                WITH RECURSIVE version_tree AS (
                    SELECT * FROM experiment_versions 
                    WHERE experiment_id = %s AND parent_version_id IS NULL
                    
                    UNION ALL
                    
                    SELECT v.* FROM experiment_versions v
                    JOIN version_tree t ON v.parent_version_id = t.id
                )
                SELECT * FROM version_tree ORDER BY version_number;
                """, (experiment_id,))
                
                return [self._row_to_version(row) for row in cur.fetchall()]
            
    def add_result(self,version_id:str,data:dict,metrics:str=None):
        
        if not version_id:
            raise ValueError("Version ID is required")
        if not data:
            raise ValueError("Data is required")
        
        with self._get_connection()as conn:
            with conn.cursor()as cur:
                try:
                    cur.execute("""
                    INSERT INTO results(id,version_id,data,metrics)
                    VALUES(%s,%s,%s,%s)
                    """,(str(uuid.uuid4()),version_id,json.dumps(data),metrics))
                    conn.commit()
                    logger.info(f"Results added for version{version_id}")
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Results addition error:{str(e)}")
                    raise
                
    def add_metadata(self,version_id:str,key:str,value:str):
        if not version_id:
            raise ValueError("Version ID is required")
        if not key:
            raise ValueError("Key is required")
        
        with self._get_connection()as conn:
            with conn.cursor()as cur:
                try:
                    cur.execute("""
                        INSERT INTO metadata(id,version_id,key,value)
                        VALUES(%s,%s,%s,%s)
                        ON CONFLICT(version_id,key)DO UPDATE 
                        SET value=EXCLUDED.value,
                            updated_at=NOW()
                        """,(str(uuid.uuid4()),version_id,key,value))
                    conn.commit()
                    logger.info(f"Metadata added for version{version_id}")
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Metadata addition error:{str(e)}")
                    raise
                
    def add_file_to_version(self,version_id:str,file_ref:FileReference):
        if not version_id:
            raise ValueError("Version ID is required")
        if not isinstance(file_ref,FileReference):
            raise ValueError("Expected FileReference object")
        if not any(file_ref.path_or_url.startswith(proto)for proto in('http://','https://','ftp://')):
            if not os.path.exists(file_ref.path_or_url):
                raise FileNotFoundError(f"File not found:{file_ref.path_or_url}")
            
        with self._get_connection()as conn:
            with conn.cursor()as cur:
                try:
                    if not self.get_version(version_id):
                        raise ValueError(f"Version{version_id}not found")
                    self._add_file_reference(cur,version_id,file_ref)
                    conn.commit()
                    logger.info(f"File{file_ref.path_or_url}added to version{version_id}")
                except Exception as e:
                    conn.rollback()
                    logger.error(f"File addition error:{str(e)}")
                    raise
                
    def setup_trigger(self):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                CREATE OR REPLACE FUNCTION calculate_experiment_stats(exp_id UUID)
                RETURNS VOID AS $$
                BEGIN
                    -- Удаляем старые данные статистики для этого эксперимента
                    DELETE FROM experiment_stats WHERE experiment_id = exp_id;
                    
                    -- Вставляем новые рассчитанные значения
                    INSERT INTO experiment_stats (experiment_id, param_name, median_value)
                    SELECT 
                        exp_id,
                        p.name,
                        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY p.value::numeric) AS median
                    FROM parameters p
                    JOIN experiment_versions ev ON p.version_id = ev.id
                    WHERE ev.experiment_id = exp_id 
                    AND p.value ~ '^[0-9\\.]+$'  -- Только числовые параметры
                    GROUP BY p.name;
                END;
                $$ LANGUAGE plpgsql;
                """)
                # 1. Триггер для проверки дублирования параметров
                cur.execute("""
                CREATE OR REPLACE FUNCTION check_duplicate_params()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF EXISTS(
                        SELECT 1 FROM parameters 
                        WHERE version_id = NEW.version_id 
                        AND LOWER(name) = LOWER(NEW.name)  -- Регистронезависимая проверка
                        AND id != NEW.id
                    ) THEN
                        RAISE EXCEPTION 'Duplicate parameter "%" for version %', NEW.name, NEW.version_id;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS check_duplicate_params_trigger ON parameters;
                CREATE TRIGGER check_duplicate_params_trigger
                BEFORE INSERT OR UPDATE ON parameters
                FOR EACH ROW EXECUTE FUNCTION check_duplicate_params();
                """)

                # 2. Триггер для завершения эксперимента
                cur.execute("""
                CREATE OR REPLACE FUNCTION on_experiment_status_change()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Only notify on status change to completed
                    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
                        -- More explicit notification
                        PERFORM pg_notify('status_change', json_build_object(
                            'event_type', 'status_change',
                            'experiment_id', NEW.experiment_id,
                            'version_id', NEW.id,
                            'old_status', OLD.status,
                            'new_status', NEW.status,
                            'changed_at', NOW()
                        )::text);
                        
                        -- Add logging for debugging
                        RAISE NOTICE 'Status change notification sent for version %', NEW.id;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                
                DROP TRIGGER IF EXISTS trigger_experiment_status_change ON experiment_versions;
                CREATE TRIGGER trigger_experiment_status_change
                AFTER UPDATE OF status ON experiment_versions  -- Срабатывает только при изменении status
                FOR EACH ROW
                EXECUTE FUNCTION on_experiment_status_change();
                """)

                # 3. Дополнительный триггер для проверки допустимых статусов
                cur.execute("""
                CREATE OR REPLACE FUNCTION validate_experiment_status()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.status NOT IN ('draft', 'active', 'completed', 'archived') THEN
                        RAISE EXCEPTION 'Invalid status: %. Valid statuses are: draft, active, completed, archived', NEW.status;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS trigger_validate_status ON experiment_versions;
                CREATE TRIGGER trigger_validate_status
                BEFORE INSERT OR UPDATE OF status ON experiment_versions
                FOR EACH ROW EXECUTE FUNCTION validate_experiment_status();
                """)

                conn.commit()
            
    def calculate_experiment_stats(self,experiment_id:str):
        with self._get_connection()as conn:
            with conn.cursor()as cur:
                try:
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS experiment_stats(
                        experiment_id UUID,
                        param_name TEXT,
                        median_value NUMERIC,
                        PRIMARY KEY(experiment_id,param_name)
                    )""")
                    cur.execute("""
                    SELECT p.name,p.value::numeric 
                    FROM parameters p
                    JOIN experiment_versions ev ON p.version_id=ev.id
                    WHERE ev.experiment_id=%s AND p.value~'^[0-9\\.]+$'
                    """,(experiment_id,))
                    params={}
                    for name,value in cur.fetchall():
                        if name not in params:
                            params[name]=[]
                        params[name].append(float(value))
                    for name,values in params.items():
                        median=sorted(values)[len(values)//2]
                        cur.execute("""
                            INSERT INTO experiment_stats(experiment_id,param_name,median_value)
                            VALUES(%s,%s,%s)
                            ON CONFLICT(experiment_id,param_name)DO UPDATE
                            SET median_value=EXCLUDED.median_value
                            """,(experiment_id,name,median))
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Experiment stats error:{str(e)}")
                    raise
                
    def add_weather_parameters(self,version_id:str,location:str):
        if not self.weather_updater:
            raise ValueError("Weather updater not initialized-provide API key")
        
        weather=self.weather_updater.get_current_weather(location)
        version=self.get_version(version_id)
        version.add_parameter("Temperature",str(weather['temperature']),"float","°C")
        version.add_parameter("Humidity",str(weather['humidity']),"float","%")
        version.add_parameter("Pressure",str(weather['pressure']),"float","hPa")
        self.update_version(version)
        self.monitor.check_version(version_id)
        
    def add_protein_parameters(self,version_id:str,protein_id:str):
        protein_data=self.bio_updater.fetch_protein_data(protein_id)
        version=self.get_version(version_id)
        version.add_parameter("Protein Name",protein_data['name'],"string","")
        version.add_parameter("Sequence Length",str(protein_data['length']),"int","")
        version.add_parameter("Protein Sequence",protein_data['sequence'],"text","")
        self.update_version(version)
        
    def update_version(self, version: ExperimentVersion) -> ExperimentVersion:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                    UPDATE experiment_versions
                    SET version_name=%s, description=%s,
                        status=%s, change_log=%s
                    WHERE id=%s
                    """, (
                        version.version_name,
                        version.description,
                        version.status,
                        version.change_log,
                        version.id
                    ))
                    cur.execute("DELETE FROM parameters WHERE version_id=%s", (version.id,))
                    
                    if version.parameters:
                        extras.execute_batch(cur,
                            """
                            INSERT INTO parameters
                            (id,version_id,name,value,type,unit)
                            VALUES(%s,%s,%s,%s,%s,%s)
                            """,
                            [(p.id,version.id,p.name,p.value,p.type,p.unit)
                            for p in version.parameters]
                        )
                    conn.commit()
                    logger.info(f"Version {version.id} updated successfully")
                    self.monitor.check_version(version.id)
                    return self.get_version(version.id)  # Возвращаем обновленную версию
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Version update error: {str(e)}")
                    raise

def main():
    config={
        "db_url":"postgresql://user:password@localhost/experiment_db",
        "telegram_token":"7702521918:AAEqKPhpXfI10GgeS_re1ZYk0F60xU9XCdc",
        "telegram_chat_id":"1018497673",
        "weather_api_key":"your_openweather_api_key"
    }
    
    def check_telegram_bot(token):
        url=f"https://api.telegram.org/bot{token}/getMe"
        try:
            response=requests.get(url,timeout=5).json()
            if not response.get('ok'):
                raise ValueError(f"Bot token invalid:{response}")
            print(f"Bot @{response['result']['username']} is ready!")
        except Exception as e:
            logger.error(f"Telegram bot check failed:{str(e)}")
            raise
        
    check_telegram_bot(config["telegram_token"])
    store=VersionStore(
        db_url=config["db_url"],
        telegram_token=config["telegram_token"],
        telegram_chat_id=config["telegram_chat_id"],
        weather_api_key=config.get("weather_api_key")
    )
    
    try:
        store.telegram_notifier.send_notification("🔔*System started*")
    except Exception as e:
        logger.error(f"Test notification error:{str(e)}")
    experiment_id=str(uuid.uuid4())
    version=ExperimentVersion(
        experiment_id=experiment_id,
        version_name="Integrated Biology Experiment",
        description="Combining protein data with environmental factors"
    )
    
    try:
        store.add_protein_parameters(version.id,"P12345")
        store.add_weather_parameters(version.id,"London,UK")
        version.add_parameter("pH","7.4","float","")
        version.add_parameter("Reaction Time","360","int","seconds")
        store.create_version(version)
        version.status="completed"
        store.update_version(version)
        print("Experiment completed successfully!")
    except Exception as e:
        print(f"Experiment failed:{str(e)}")
        if store.telegram_notifier:
            store.telegram_notifier.send_notification(
                f"Experiment failed:{str(e)}")

if __name__=="__main__":
    main()