# PsyRehab Architecture Documentation

Welcome to the PsyRehab system architecture documentation. This directory contains visual representations and detailed explanations of the system's technical architecture.

## 📁 Documentation Structure

### 1. [System Architecture](./SYSTEM_ARCHITECTURE.md)
Comprehensive overview of the PsyRehab system architecture including:
- High-level system architecture diagram
- Authentication flow
- AI recommendation workflow
- Data flow architecture
- Component architecture
- Security architecture
- Deployment architecture
- Technology stack summary

### 2. [Database ERD](./DATABASE_ERD.md)
Complete database schema visualization including:
- Entity Relationship Diagram (ERD)
- Table relationships
- Database views
- Key constraints and data types
- Deprecated tables reference

### 3. [User Permissions Matrix](./USER_PERMISSIONS_MATRIX.md)
Role-based access control (RBAC) system documentation:
- Role hierarchy visualization
- Detailed permissions matrix
- Permission flow diagrams
- Role-based UI access patterns
- Data access patterns
- Special permission rules

## 🔍 Quick Reference

### System Overview
PsyRehab is a mental health rehabilitation management platform built with:
- **Frontend**: React 19 + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI Integration**: N8N Webhook for goal recommendations
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui

### Key Features
1. **Multi-role User System**: Directors, managers, social workers, and patients
2. **Patient Management**: Registration, assignment, progress tracking
3. **Goal Setting**: Hierarchical goals with AI recommendations
4. **Assessment System**: Comprehensive patient assessments
5. **Real-time Updates**: Live data synchronization
6. **Role-based Security**: Granular permissions and data access control

### Architecture Principles
- **Security First**: Row Level Security (RLS) at database level
- **Type Safety**: Full TypeScript coverage
- **Component Reusability**: Shared UI components
- **Service Layer Pattern**: Centralized business logic
- **Real-time Capable**: WebSocket connections for live updates
- **Scalable Design**: Modular architecture for growth

## 🛠️ Viewing the Diagrams

The diagrams in these documents use Mermaid syntax, which can be viewed in:
- GitHub (renders automatically)
- VS Code (with Mermaid preview extension)
- Online Mermaid editors
- Any Markdown viewer with Mermaid support

## 📚 Related Documentation

For more information, see:
- [Main README](../../README.md) - Project overview
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [SECURITY_AUDIT.md](../../SECURITY_AUDIT.md) - Security analysis

## 🔄 Maintenance

These architecture documents should be updated when:
- New features are added
- Database schema changes
- Permission system updates
- Technology stack changes
- System architecture evolves

Last updated: 2025-01-08