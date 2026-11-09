import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { AuthCard } from '../components/AuthCard.jsx'
import { SignupForm } from '../components/SignupForm.jsx'

export function SignupPage() {
  const navigate = useNavigate()
  return (
    <AuthLayout>
      <AuthCard
        description="Create an account to get started with your private document vault."
        title="Create your account"
      >
        <SignupForm
          onSuccess={() => navigate('/dashboard', { replace: true })}
        />
      </AuthCard>
    </AuthLayout>
  )
}
