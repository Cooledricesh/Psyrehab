# PsyRehab User Permissions Matrix

## Overview

This document visualizes the role-based access control (RBAC) system in PsyRehab, showing which roles have access to which features and data.

## 1. Role Hierarchy

```mermaid
graph TD
    DIR[원장/Director] --> VD[부원장/Vice Director]
    VD --> DH[부장/Department Head]
    DH --> MGR[과장/Manager]
    MGR --> SC[계장/Section Chief]
    SC --> AM[주임/Assistant Manager]
    AM --> STAFF[사원/Staff]
    
    ADMIN[Administrator] --> SYSTEM[System Management]
    
    AP[주치의/Attending Physician] --> MEDICAL[Medical View]
    
    PATIENT[환자/Patient] --> SELF[Self Service]

    style DIR fill:#ff6b6b
    style VD fill:#ff8787
    style DH fill:#ffa8a8
    style MGR fill:#ffc9c9
    style SC fill:#ffd8d8
    style AM fill:#ffe8e8
    style STAFF fill:#fff5f5
    style ADMIN fill:#4ecdc4
    style AP fill:#95e1d3
    style PATIENT fill:#f6e58d
```

## 2. Permission Matrix

```mermaid
heatmap x="Permissions" y="Roles"
    "Director" : [100, 100, 100, 100, 100, 100, 100, 100, 100]
    "Vice Director" : [90, 90, 90, 90, 90, 90, 90, 90, 80]
    "Department Head" : [80, 80, 80, 80, 80, 80, 70, 70, 60]
    "Manager" : [70, 70, 70, 70, 70, 60, 60, 50, 40]
    "Section Chief" : [60, 60, 60, 60, 50, 50, 40, 30, 20]
    "Assistant Manager" : [50, 50, 50, 40, 40, 30, 20, 20, 10]
    "Staff" : [40, 40, 30, 30, 20, 20, 10, 10, 0]
    "Administrator" : [100, 100, 0, 0, 0, 100, 100, 100, 100]
    "Attending Physician" : [0, 50, 100, 50, 50, 0, 0, 0, 0]
    "Patient" : [0, 0, 10, 0, 10, 0, 0, 0, 0]
```

## 3. Detailed Permissions Table

| Permission Category | Director | Vice Director | Dept Head | Manager | Section Chief | Asst Manager | Staff | Administrator | Physician | Patient |
|-------------------|----------|---------------|-----------|----------|---------------|--------------|-------|---------------|-----------|---------|
| **User Management** |
| Create Users | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Update Users | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View All Users | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Patient Management** |
| Create Patients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update Patients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Delete Patients | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Patients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Own Patients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Assessment Management** |
| Create Assessments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update Assessments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Assessments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Goal Management** |
| Create Goals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update Goals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Evaluate Goals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Goals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Service Records** |
| Create Records | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update Records | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Records | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **System Configuration** |
| Manage Roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| System Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Reports** |
| Generate Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View All Reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Announcements** |
| Create Announcements | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Edit Announcements | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View Announcements | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 4. Permission Flow Diagram

```mermaid
flowchart TD
    subgraph "User Actions"
        Login[User Login]
        Request[Request Action]
    end

    subgraph "Authorization Layer"
        AuthCheck{Authentication Check}
        RoleCheck{Role Check}
        PermCheck{Permission Check}
        RLSCheck{RLS Policy Check}
    end

    subgraph "Data Access"
        Allow[Allow Access]
        Deny[Deny Access]
    end

    Login --> AuthCheck
    Request --> AuthCheck
    AuthCheck -->|Authenticated| RoleCheck
    AuthCheck -->|Not Authenticated| Deny
    RoleCheck -->|Has Role| PermCheck
    RoleCheck -->|No Role| Deny
    PermCheck -->|Has Permission| RLSCheck
    PermCheck -->|No Permission| Deny
    RLSCheck -->|RLS Pass| Allow
    RLSCheck -->|RLS Fail| Deny

    style Allow fill:#2ecc71
    style Deny fill:#e74c3c
```

## 5. Role-Based UI Access

```mermaid
graph LR
    subgraph "Director/Vice Director"
        D1[Full Dashboard]
        D2[All Patients]
        D3[User Management]
        D4[System Settings]
        D5[All Reports]
    end

    subgraph "Department Head/Manager"
        M1[Team Dashboard]
        M2[Team Patients]
        M3[Team Management]
        M4[Team Reports]
    end

    subgraph "Staff Roles"
        S1[Personal Dashboard]
        S2[Assigned Patients]
        S3[Create Assessments]
        S4[Manage Goals]
    end

    subgraph "Administrator"
        A1[System Dashboard]
        A2[User Management]
        A3[System Configuration]
        A4[Audit Logs]
    end

    subgraph "Patient"
        P1[Personal Progress]
        P2[Own Goals]
        P3[View Records]
    end

    style D1 fill:#ff6b6b
    style M1 fill:#4ecdc4
    style S1 fill:#95e1d3
    style A1 fill:#f6e58d
    style P1 fill:#dfe6e9
```

## 6. Data Access Patterns

```mermaid
flowchart TD
    subgraph "Role-Based Data Access"
        DIR[Director]
        MGR[Manager/Staff]
        PAT[Patient]
    end

    subgraph "Data Scope"
        ALL[All Organization Data]
        TEAM[Team/Department Data]
        OWN[Own Data Only]
    end

    subgraph "Database Tables"
        USERS[(users)]
        PATIENTS[(patients)]
        GOALS[(rehabilitation_goals)]
        RECORDS[(service_records)]
    end

    DIR --> ALL
    MGR --> TEAM
    PAT --> OWN

    ALL --> USERS
    ALL --> PATIENTS
    ALL --> GOALS
    ALL --> RECORDS

    TEAM --> PATIENTS
    TEAM --> GOALS
    TEAM --> RECORDS

    OWN --> GOALS
    OWN --> RECORDS
```

## 7. Special Permission Rules

### Hierarchical Access
- Higher roles inherit all permissions of lower roles
- Director (원장) has full system access
- Vice Director (부원장) has near-full access except some system configurations

### Cross-Role Permissions
- **Administrator**: Full technical access but no patient data access
- **Attending Physician**: Read-only access to patient medical data
- **Patient**: Can only view their own data and progress

### Data Ownership Rules
1. **Social Workers** can only access patients assigned to them
2. **Managers** can access all patients in their department
3. **Directors** can access all patients in the organization
4. **Patients** can only see their own information

### Time-Based Restrictions
- Some actions may be restricted based on business hours
- Audit logs track all permission-based actions
- Session timeouts enforce security

## 8. Permission Implementation

```typescript
// Example permission check
hasPermission(userId: string, permission: string): boolean

// Common permissions:
- 'users.create'
- 'users.update'
- 'users.delete'
- 'patients.create'
- 'patients.view_all'
- 'goals.evaluate'
- 'reports.generate'
- 'system.configure'
```

## Security Notes

1. **Least Privilege Principle**: Users only get permissions necessary for their role
2. **Separation of Duties**: Administrative and clinical permissions are separated
3. **Audit Trail**: All permission-based actions are logged
4. **Regular Reviews**: Permissions should be reviewed quarterly
5. **Emergency Access**: Break-glass procedures for emergency patient access