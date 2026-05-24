import { Metadata } from 'next';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = {
  title: 'Login | Expense Tracker',
  description: 'Sign in to your expense tracker account',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm />
    </main>
  );
}
