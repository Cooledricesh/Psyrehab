# Mental Health Rehabilitation Goal Management Platform

A web platform for mental health social workers to systematically manage patient rehabilitation goals. Provides AI-based goal recommendations and hierarchical goal management system.

## 🎯 Key Features

- **5-Step Assessment System**: Multi-dimensional evaluation of patient's current status
- **AI-Based Goal Recommendations**: Customized rehabilitation plan generation via N8N webhook
- **Hierarchical Goal Management**: Systematic management from 6-month → monthly → weekly goals
- **Real-time Progress Tracking**: Weekly goal achievement/non-achievement check system
- **Goal Completion Confirmation System**: User confirmation-based goal achievement processing
- **Dashboard Analytics**: Performance monitoring by patient and social worker
- **Smart Alert System**: Automatic detection of patients requiring urgent intervention

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Charts**: Chart.js + Recharts
- **Forms**: React Hook Form + Custom Components

### Backend (Serverless Architecture)
- **Database**: Supabase (PostgreSQL + Real-time subscriptions)
- **Authentication**: Supabase Auth (PKCE flow)
- **AI Processing**: Direct N8N Webhook Integration
- **Security**: Supabase Row Level Security (RLS)
- **Architecture**: Single frontend deployment (no separate backend server)

### Development Tools
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier
- **Build Tool**: Vite
- **Type Checking**: TypeScript
- **Package Manager**: npm

## 🚀 Getting Started

### 1. Clone Repository and Install Dependencies

```bash
git clone <repository-url>
cd PsyRehab
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
# Supabase Settings
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# N8N Webhook URL
VITE_N8N_WEBHOOK_URL=https://your-n8n-webhook-url
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## 📦 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking

### Testing
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### CI/CD
- `npm run ci` - Run all checks (type-check + lint + test + build)

## 🏗 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── auth/           # Authentication components
│   ├── patients/       # Patient management
│   ├── goals/          # Goal management
│   ├── assessments/    # Assessment related
│   └── dashboard/      # Dashboard components
├── pages/              # Page components (route endpoints)
├── services/           # Business logic and API calls
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── contexts/           # React contexts
└── constants/          # Constants and configurations
```

## 🔐 User Roles and Permissions

### 1. Administrator
- User management (approve/reject registrations)
- System configuration
- View all social workers and patients

### 2. Social Worker
- Patient registration and management
- Create/modify/delete rehabilitation goals
- Assessment evaluation
- Dashboard monitoring

### 3. Patient
- Complete weekly check-ins
- View own goals
- Track progress

## 🌟 Main Features Details

### Patient Management
- Register new patients with comprehensive personal information
- Manage assigned patients by social worker
- Track patient status (active/pending/discharged)

### Assessment System
1. **Daily Life Assessment** - Independence in daily activities
2. **Social Function** - Social skills and relationships
3. **Cognitive Function** - Thinking and understanding abilities
4. **Work Capability** - Employment-related capabilities
5. **Community Resources** - Community activity participation

### Goal Management
- **6-Month Goals**: Long-term rehabilitation direction
- **Monthly Goals**: Medium-term objectives
- **Weekly Goals**: Specific actionable tasks
- **Achievement Tracking**: Monitor completion status

### AI Integration
- Automatic goal recommendations based on assessment results
- Uses OpenAI GPT-4 via N8N workflow
- Generates personalized rehabilitation plans

## 🚨 Security

- HTTPS required for production
- Supabase Row Level Security (RLS) policies
- User authentication via Supabase Auth
- Role-based access control (RBAC)
- Client-side rate limiting for authentication

## 📱 Responsive Design

- Desktop-first design
- Responsive support for tablets and mobile devices
- Touch-friendly interface for patient use

## 🤝 Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📄 License

[Add license information]

## 📞 Support

For issues and questions:
- GitHub Issues: [Report bugs and feature requests]
- Documentation: [Link to detailed documentation]

## 🔄 Version History

- v1.0.0 - Initial release with core features
- [Add version history as needed]

---

Made with ❤️ for mental health rehabilitation support