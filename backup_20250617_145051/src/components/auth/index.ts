// Authentication Forms
export { 
  SignInForm, 
  MinimalSignInForm, 
  InlineSignInForm 
} from './SignInForm'

export { 
  SignUpForm, 
  SimpleSignUpForm, 
  PatientSignUpForm, 
  SocialWorkerSignUpForm, 
  AdminSignUpForm 
} from './SignUpForm'

export { 
  PasswordResetForm, 
  NewPasswordForm 
} from './PasswordResetForm'

export {
  EmailVerificationForm,
  EmailVerificationNotice
} from './EmailVerificationForm'

// Session Management
export {
  SessionTimeoutWarning,
  SessionTimeoutNotice
} from './SessionTimeoutWarning'

export {
  LogoutConfirmation,
  LogoutButton,
  LogoutMenuItem
} from './LogoutConfirmation'

// Loading States
// AuthLoadingSpinner temporarily disabled due to build issues

// Access Control Components
export {
  RoleGuard,
  AdminOnly,
  SocialWorkerOnly,
  PatientOnly,
  StaffOnly,
  RoleSwitch,
  PermissionGuard,
  AuthGuard,
  withRoleGuard,
  withPermission
} from './RoleGuard'

export {
  AccessDenied,
  AdminAccessDenied,
  SocialWorkerAccessDenied,
  PatientAccessDenied,
  InlineAccessDenied
} from './AccessDenied'

export {
  RoleBasedMenu,
  AdminMenu,
  SocialWorkerMenu,
  PatientMenu
} from './RoleBasedMenu'

// Route Protection
export {
  ProtectedRoute,
  AdminRoute,
  SocialWorkerRoute,
  PatientRoute,
  StaffRoute,
  PublicRoute,
  GuestRoute,
  withProtectedRoute,
  RouteGuard,
  ConditionalRoute,
  DevRoute,
  MaintenanceRoute
} from './ProtectedRoute'

export {
  AuthRouter,
  AdminAuthRouter,
  SocialWorkerAuthRouter,
  PatientAuthRouter,
  AuthRedirectHandler,
  RootRedirect
} from './AuthRouter' 