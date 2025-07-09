# PsyRehab System Architecture

## Overview

PsyRehab is a mental health rehabilitation management platform built with modern web technologies. This document provides visual representations of the system architecture.

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph "Client Layer"
        UI[React 19 + TypeScript]
        UI --> Router[React Router]
        UI --> State[TanStack Query]
        UI --> Forms[React Hook Form + Zod]
        UI --> Components[shadcn/ui Components]
        UI --> Charts[Chart.js/Recharts]
    end

    subgraph "Service Layer"
        Auth[AuthService]
        Patient[PatientService]
        Social[SocialWorkerService]
        Assessment[AssessmentService]
        AI[AIRecommendationService]
        Goal[RehabilitationGoalService]
        Service[ServiceRecordService]
        User[UserManagementService]
        Role[RolePermissionsService]
    end

    subgraph "Backend Infrastructure"
        Supabase[Supabase Backend]
        SupaAuth[Supabase Auth]
        SupaDB[(PostgreSQL Database)]
        SupaRLS[Row Level Security]
        SupaRT[Realtime Subscriptions]
    end

    subgraph "External Services"
        N8N[N8N Webhook]
        AIModel[AI Model Pipeline]
    end

    UI --> Auth
    UI --> Patient
    UI --> Social
    UI --> Assessment
    UI --> AI
    UI --> Goal
    UI --> Service
    UI --> User
    UI --> Role

    Auth --> SupaAuth
    Patient --> Supabase
    Social --> Supabase
    Assessment --> Supabase
    AI --> N8N
    Goal --> Supabase
    Service --> Supabase
    User --> Supabase
    Role --> Supabase

    Supabase --> SupaDB
    Supabase --> SupaRLS
    Supabase --> SupaRT
    SupaAuth --> SupaDB

    N8N --> AIModel
    AIModel --> SupaDB

    style UI fill:#61DAFB
    style Supabase fill:#3ECF8E
    style N8N fill:#EA4B71
    style SupaDB fill:#336791
```

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant AuthContext
    participant AuthService
    participant Supabase
    participant Database

    User->>React: Login Request
    React->>AuthContext: Call login()
    AuthContext->>AuthService: signIn(email, password)
    AuthService->>Supabase: Auth PKCE Flow
    Supabase->>Database: Verify Credentials
    Database-->>Supabase: User Data
    Supabase-->>AuthService: Auth Session
    AuthService->>AuthService: Load Profile & Roles
    AuthService-->>AuthContext: User + Profile + Roles
    AuthContext->>React: Update UI State
    React-->>User: Dashboard Access
```

## 3. AI Recommendation Flow

```mermaid
flowchart LR
    subgraph "Frontend"
        A[Assessment Form]
        B[AIRecommendationService]
        C[Progress Polling]
    end

    subgraph "N8N Workflow"
        D[Webhook Endpoint]
        E[Data Processing]
        F[AI Model]
        G[Response Handler]
    end

    subgraph "Database"
        H[(ai_goal_recommendations)]
        I[(rehabilitation_goals)]
    end

    A -->|Submit Assessment| B
    B -->|POST Request| D
    D --> E
    E --> F
    F --> G
    G -->|Store Results| H
    B -->|Poll Status| C
    C -->|Check| H
    H -->|Recommendations| I
```

## 4. Data Flow Architecture

```mermaid
flowchart TD
    subgraph "React Components"
        Comp[Component]
        Hook[Custom Hook]
    end

    subgraph "State Management"
        TQ[TanStack Query]
        Cache[Query Cache]
    end

    subgraph "Service Layer"
        Service[Service Class]
        Error[Error Handler]
    end

    subgraph "Supabase"
        Client[Supabase Client]
        RLS[RLS Policies]
        RT[Realtime]
    end

    subgraph "PostgreSQL"
        Tables[(Tables)]
        Views[(Views)]
        Functions[(Functions)]
    end

    Comp --> Hook
    Hook --> TQ
    TQ --> Cache
    TQ --> Service
    Service --> Error
    Service --> Client
    Client --> RLS
    Client --> RT
    RLS --> Tables
    RLS --> Views
    RLS --> Functions
    RT -.->|Live Updates| TQ
```

## 5. Component Architecture

```mermaid
graph TD
    subgraph "Application Root"
        App[App.tsx]
        AuthProvider[AuthProvider]
        QueryProvider[QueryClientProvider]
        RouterProvider[RouterProvider]
    end

    subgraph "Routing"
        PublicRoutes[Public Routes]
        ProtectedRoutes[Protected Routes]
        RoleBasedRoutes[Role-Based Routes]
    end

    subgraph "Pages"
        Dashboard[Dashboard]
        PatientMgmt[Patient Management]
        AssessmentPage[Assessments]
        GoalTracking[Goal Tracking]
        Reports[Reports]
    end

    subgraph "Feature Components"
        PatientComps[Patient Components]
        AssessmentComps[Assessment Components]
        GoalComps[Goal Components]
        SharedComps[Shared Components]
    end

    subgraph "UI Components"
        UILib[shadcn/ui]
        CustomUI[Custom Components]
    end

    App --> AuthProvider
    AuthProvider --> QueryProvider
    QueryProvider --> RouterProvider
    RouterProvider --> PublicRoutes
    RouterProvider --> ProtectedRoutes
    ProtectedRoutes --> RoleBasedRoutes
    
    RoleBasedRoutes --> Dashboard
    RoleBasedRoutes --> PatientMgmt
    RoleBasedRoutes --> AssessmentPage
    RoleBasedRoutes --> GoalTracking
    RoleBasedRoutes --> Reports

    Dashboard --> PatientComps
    PatientMgmt --> PatientComps
    AssessmentPage --> AssessmentComps
    GoalTracking --> GoalComps
    
    PatientComps --> SharedComps
    AssessmentComps --> SharedComps
    GoalComps --> SharedComps
    
    SharedComps --> UILib
    SharedComps --> CustomUI
```

## 6. Security Architecture

```mermaid
flowchart TB
    subgraph "Client Security"
        Input[Input Validation]
        Sanitize[Data Sanitization]
        Token[Token Management]
    end

    subgraph "API Security"
        HTTPS[HTTPS Transport]
        Auth[Authentication]
        AuthZ[Authorization]
    end

    subgraph "Database Security"
        RLS[Row Level Security]
        Roles[Role-Based Access]
        Policies[RLS Policies]
    end

    subgraph "Application Security"
        Session[Session Management]
        RBAC[RBAC System]
        Audit[Audit Logging]
    end

    Input --> Sanitize
    Sanitize --> HTTPS
    HTTPS --> Auth
    Auth --> AuthZ
    AuthZ --> Session
    Session --> RBAC
    RBAC --> RLS
    RLS --> Roles
    Roles --> Policies
    RBAC --> Audit
```

## 7. Deployment Architecture

```mermaid
flowchart TD
    subgraph "Development"
        Dev[Local Development]
        DevDB[(Local Supabase)]
    end

    subgraph "CI/CD Pipeline"
        GitHub[GitHub Repository]
        Actions[GitHub Actions]
        Tests[Test Suite]
        Build[Build Process]
    end

    subgraph "Production"
        Vercel[Vercel Hosting]
        SupaProd[(Supabase Production)]
        N8NProd[N8N Production]
    end

    Dev --> GitHub
    GitHub --> Actions
    Actions --> Tests
    Tests --> Build
    Build --> Vercel
    Vercel --> SupaProd
    Vercel --> N8NProd

    DevDB -.->|Migration| SupaProd
```

## Technology Stack Summary

### Frontend
- **Framework**: React 19.1.0 with TypeScript 5.8.3
- **Build Tool**: Vite 6.3.5
- **Styling**: TailwindCSS 3.4.17 + shadcn/ui
- **State Management**: TanStack Query 5.80.5
- **Routing**: React Router DOM 7.6.2
- **Forms**: React Hook Form 7.58.1 + Zod 3.25.67
- **Charts**: Chart.js 3.10.1, Recharts 2.15.0

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (PKCE)
- **Real-time**: Supabase Realtime
- **Security**: Row Level Security (RLS)
- **AI Integration**: N8N Webhook

### Development
- **Package Manager**: npm 9+
- **Node Version**: 18.20.0
- **Testing**: Vitest 2.1.8
- **Linting**: ESLint
- **Formatting**: Prettier