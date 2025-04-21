erDiagram
    EXPERIMENT ||--o{ EXPERIMENT_VERSION : has
    EXPERIMENT_VERSION ||--|{ PARAMETER : contains
    EXPERIMENT_VERSION ||--o{ RESULT : produces
    EXPERIMENT_VERSION ||--o{ METADATA : describes
    EXPERIMENT_VERSION ||--o{ FILE_REFERENCE : references
    
    EXPERIMENT {
        uuid experiment_id PK
        string name
        string description
        timestamp created_at
        uuid created_by
    }
    
    EXPERIMENT_VERSION {
        uuid version_id PK
        uuid experiment_id FK
        string version_name
        string change_description
        integer version_number
        timestamp created_at
        string status
        uuid parent_version_id NULL
    }
    
    PARAMETER {
        uuid parameter_id PK
        uuid version_id FK
        string name
        string value
        string type
        string unit
    }
    
    RESULT {
        uuid result_id PK
        uuid version_id FK
        json data
        string metrics
        boolean is_approved
    }
    
    METADATA {
        uuid metadata_id PK
        uuid version_id FK
        string key
        string value
    }
    
    FILE_REFERENCE {
        uuid file_id PK
        uuid version_id FK
        string source_type "excel|sql|cloud"
        string path_or_url
        string file_hash
    }