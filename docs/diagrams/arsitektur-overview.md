# Diagram Arsitektur StockTrackApp

## 1. High-Level Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React Components] --> B[Inertia.js]
        B --> C[React Router]
    end
    
    subgraph "Backend Layer"
        D[Laravel Routes] --> E[Controllers]
        E --> F[Services]
        F --> G[Repositories]
        G --> H[Models]
    end
    
    subgraph "Data Layer"
        H --> I[(MySQL Database)]
    end
    
    subgraph "Authentication & Authorization"
        J[Laravel Auth] --> K[Spatie Permissions]
        K --> L[Custom Middleware]
    end
    
    B --> D
    E --> J
    F --> K
```

## 2. MVC Architecture Pattern

```mermaid
graph LR
    subgraph "Model Layer"
        A1[User Model] --> A2[Role Model]
        A2 --> A3[Permission Model]
    end
    
    subgraph "View Layer"
        B1[React Pages] --> B2[React Components]
        B2 --> B3[UI Components]
    end
    
    subgraph "Controller Layer"
        C1[User Controller] --> C2[Auth Controller]
        C2 --> C3[Dashboard Controller]
    end
    
    A1 --> C1
    C1 --> B1
    B1 --> A1
```

## 3. Repository & Service Pattern

```mermaid
graph TD
    A[Controller] --> B[Service Interface]
    B --> C[Service Implementation]
    C --> D[Repository Interface]
    D --> E[Repository Implementation]
    E --> F[Model]
    F --> G[Database]
    
    H[Service Provider] --> B
    H --> D
```

## 4. Role-Based Access Control Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React Frontend
    participant I as Inertia.js
    participant L as Laravel
    participant M as Permission Middleware
    participant C as Controller
    participant S as Service
    participant DB as Database
    
    U->>R: Access Protected Resource
    R->>I: Request Page
    I->>L: HTTP Request
    L->>M: Check Permission
    M->>DB: Query User Permissions
    DB-->>M: Return Permissions
    M-->>L: Permission Validated
    L->>C: Call Controller Method
    C->>S: Execute Business Logic
    S->>DB: Data Operations
    DB-->>S: Return Data
    S-->>C: Return Result
    C-->>L: Return Response
    L-->>I: Inertia Response
    I-->>R: Render Component
    R-->>U: Display Protected Content
```

## 5. Frontend Component Hierarchy

```mermaid
graph TD
    A[App.jsx] --> B[AuthProvider]
    B --> C[AppLayout]
    C --> D[AuthenticatedLayout]
    D --> E[Pages]
    
    E --> F[Users/Index.jsx]
    E --> G[Dashboard/Index.jsx]
    E --> H[Profile/Edit.jsx]
    
    F --> I[UserTable]
    F --> J[MobileUserTable]
    I --> K[UI Components]
    J --> K
    
    G --> L[StatCard]
    G --> M[RecentActivity]
    L --> K
    M --> K
```

## 6. Database Schema for User Management

```mermaid
erDiagram
    users {
        uuid id PK
        string name
        string email
        string password
        uuid current_role_id FK
        boolean is_active
        timestamp last_login_at
        timestamp email_verified_at
        timestamps
    }
    
    roles {
        uuid id PK
        string name
        string guard_name
        timestamps
    }
    
    permissions {
        uuid id PK
        string name
        string guard_name
        timestamps
    }
    
    model_has_roles {
        uuid role_id FK
        string model_type
        uuid model_id FK
    }
    
    model_has_permissions {
        uuid permission_id FK
        string model_type
        uuid model_id FK
    }
    
    role_has_permissions {
        uuid permission_id FK
        uuid role_id FK
    }
    
    users ||--o{ model_has_roles : "has"
    roles ||--o{ model_has_roles : "belongs to"
    users ||--o{ model_has_permissions : "has"
    permissions ||--o{ model_has_permissions : "belongs to"
    roles ||--o{ role_has_permissions : "has"
    permissions ||--o{ role_has_permissions : "belongs to"
    users }o--|| roles : "current_role"
```

## 7. Request Flow for User Management

```mermaid
flowchart TD
    A[User Action] --> B{Authentication Check}
    B -->|Failed| C[Redirect to Login]
    B -->|Success| D{Permission Check}
    D -->|Failed| E[403 Forbidden]
    D -->|Success| F[Controller Method]
    F --> G[Service Layer]
    G --> H[Repository Layer]
    H --> I[Database Operations]
    I --> J[Response Data]
    J --> K[Service Processing]
    K --> L[Controller Response]
    L --> M[Inertia Response]
    M --> N[React Component]
    N --> O[UI Update]
```

## 8. Mobile-First Responsive Architecture

```mermaid
graph LR
    A[Mobile Detection Hook] --> B{Device Type}
    B -->|Mobile| C[Mobile Components]
    B -->|Desktop| D[Desktop Components]
    C --> E[Mobile Layout]
    D --> F[Desktop Layout]
    E --> G[Optimized Mobile UI]
    F --> H[Full Desktop UI]
```

## 9. Performance Optimization Flow

```mermaid
graph TD
    A[Page Load] --> B[Asset Optimization]
    B --> C[Lazy Loading]
    C --> D[Component Rendering]
    D --> E[Network Monitoring]
    E --> F[Performance Metrics]
    F --> G[Mobile Detection]
    G --> H[Optimization Strategy]
    H --> I[Component Preloading]
    I --> J[Cached Rendering]
```

## 10. Security Architecture

```mermaid
graph TD
    A[User Request] --> B[CSRF Protection]
    B --> C[Authentication Middleware]
    C --> D[Session Validation]
    D --> E[Permission Middleware]
    E --> F[Input Validation]
    F --> G[Business Logic]
    G --> H[Authorization Check]
    H --> I[Data Access]
    I --> J[Audit Logging]
    J --> K[Response]
