import { AuthLayout } from '../components/AuthLayout.jsx'
import { AuthCard } from '../components/AuthCard.jsx'
import { LoginForm } from '../components/LoginForm.jsx'

export function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard
        description="Sign in to securely access your Document Vault."
        title="Welcome back"
      >
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  )
}
