# Components Directory

This directory contains all React components organized by feature and functionality.

## Structure

- **ui/**: Reusable UI components (shadcn/ui based)
- **auth/**: Authentication-related components (login, register, profile)
- **dashboard/**: Dashboard and overview components
- **patients/**: Patient management components (list, profile, search)
- **goals/**: Goal management components (create, edit, progress tracking)
- **assessments/**: Assessment components (forms, results, history)
- **reports/**: Reporting and analytics components
- **layout/**: Layout components (header, sidebar, navigation)
- **forms/**: Reusable form components and form elements
- **common/**: Shared/common components used across features

## Guidelines

- Each feature folder should have its own index.ts for exports
- Components should be self-contained with their own styles/tests
- Use TypeScript for all components with proper prop typing
- Follow the established naming conventions (PascalCase for components) 