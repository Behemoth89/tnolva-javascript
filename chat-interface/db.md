> **Note:** This is a developer design document for future planned features (projects, files, tools). It does NOT reflect the current database schema. For the current schema, see the OpenSpec specs in `openspec/specs/` (specifically `user-management`, `llm-provider-api`, `chat-api`) and the implementation in `backend/src/db/index.ts`.

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ CHAT : has

    PROJECT ||--o{ FILE : contains
    PROJECT ||--o{ PROJECT_TOOL : has
    TOOL ||--o{ PROJECT_TOOL : has
    PROJECT ||--o{ CHAT : contains

    CHAT ||--o{ CHAT_MESSAGES : contains
    CHAT_MESSAGES ||--o{ FILE : attaches

    LLM_PROVIDER ||--o{ PROVIDER_MODEL : has

    PROJECT }o--|| PROVIDER_MODEL : "default model"
    PROVIDER_MODEL }o--|| CHAT : "used in"

    USER {
        uuid id PK
    }
    PROJECT {
        uuid id PK
        uuid user_id FK
        uuid provider_model_id FK
    }
    FILE {
        uuid id PK
        uuid project_id FK
        uuid chat_message_id FK "nullable"
    }
    TOOL {
        uuid id PK
    }
    PROJECT_TOOL {
        uuid project_id FK
        uuid tool_id FK
    }
    LLM_PROVIDER {
        uuid id PK
    }
    PROVIDER_MODEL {
        uuid id PK
        uuid provider_id FK
    }
    CHAT {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        uuid provider_model_id FK
    }
    CHAT_MESSAGES {
        uuid id PK
        uuid chat_id FK
    }
```
