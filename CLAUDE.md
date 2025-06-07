# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (port 5173)
- `npm run build` - Production build with TypeScript compilation
- `npm run preview` - Preview production build (port 4173)

### Code Quality
- `npm run lint` - ESLint check for src/ directory
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking without emit

### Testing
- `npm test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:ui` - Open Vitest UI for interactive testing

### Security & Auditing
- `npm run security:audit` - Run custom security audit script
- `npm run security:deps` - Check dependencies for vulnerabilities
- `npm run ci` - Full CI pipeline (type-check + lint + test + build)

### HTTPS Development
- `npm run dev:https` - Start dev server with SSL certificates
- `npm run setup-ssl` - Generate SSL certificates for local development

## Architecture Overview

### Authentication System
- **Multi-layer architecture**: Service → Context → Hooks → Components
- **Role-based access control**: Administrator, Social Worker, Patient roles
- **TanStack Query integration**: Auth state synchronized with query cache
- **Supabase auth**: PKCE flow with automatic token refresh
- **Permission system**: Granular permissions checked via `hasPermission()` function

### Data Management
- **TanStack Query**: All server state management with smart caching
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Query patterns**: Centralized query keys and cache invalidation
- **Type safety**: Generated Supabase types with TypeScript

### Component Architecture
- **Feature-based organization**: Components grouped by domain (auth/, patients/, assessments/)
- **UI components**: shadcn/ui base components in `components/ui/`
- **Path aliases**: Use `@/` imports for all src/ paths
- **Validation**: Built-in form validation with error handling

### Services Layer
- **Class-based services**: Domain-specific services (AuthService, PatientService)
- **Centralized export**: Import services from `@/services`
- **Error handling**: Consistent error handling across all services
- **AI integration**: AI recommendation services with n8n webhook

## Project-Specific Patterns

### Environment Variables
Required environment variables (create `.env` file):
```env
VITE_SUPABASE_URL=https://jsilzrsiieswiskzcriy.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url-here
```

### Authentication Integration
When adding new features requiring authentication:
1. Import auth from `@/contexts/AuthContext`
2. Use `useAuthQueries()` hook for TanStack Query integration
3. Check permissions with `hasPermission(userId, 'permission_name')`
4. Use `ProtectedRoute` component for route protection

### Data Fetching Patterns
- Use TanStack Query hooks from `@/hooks/` directories
- Follow query key factory pattern: `authQueryKeys.user(userId)`
- Implement optimistic updates for mutations
- Handle loading and error states consistently

### Component Development
- Use TypeScript for all components with proper prop interfaces
- Import UI components from `@/components/ui`
- Follow feature-based organization in `@/components/`
- Use Tailwind CSS with shadcn/ui variant patterns

### Testing Guidelines
- Test files use `.test.tsx` or `.test.ts` extensions
- Setup file: `src/test/setup.ts` includes global test configuration
- Use React Testing Library for component testing
- Mock Supabase client in tests with predefined environment variables

### Code Quality Requirements
- ESLint and Prettier are enforced
- TypeScript strict mode enabled
- Path aliases configured for clean imports
- Component props must be typed with interfaces

## Domain-Specific Information

### Korean Language Support
- This is a Korean rehabilitation management platform (정신장애인 재활 목표 관리 플랫폼)
- Korean text validation and formatting utilities in `@/lib/validations/`
- UI text may be in Korean - respect existing language conventions

### Healthcare Data Handling
- Patient data requires strict validation and sanitization
- Role-based access controls are critical for compliance
- Service records and assessments have specific data structures
- Goal hierarchy system with categorization

### Security Considerations
- User roles determine data access (social workers can only access assigned patients)
- All API calls go through Supabase with RLS (Row Level Security)
- Session management includes automatic cleanup on auth failure
- Rate limiting implemented in authentication service

## File Organization

### Import Patterns
```typescript
// UI components
import { Button } from '@/components/ui/button'

// Feature components  
import { PatientList } from '@/components/patients'

// Services
import { authService } from '@/services'

// Types
import type { UserProfile } from '@/types/auth'

// Hooks
import { useAuthQueries } from '@/hooks/auth'
```

### New Feature Development
1. Create types in `@/types/` if needed
2. Add service functions in `@/services/`
3. Create custom hooks in `@/hooks/`
4. Build components in appropriate `@/components/` subdirectory
5. Add pages in `@/pages/` if needed
6. Write tests alongside components