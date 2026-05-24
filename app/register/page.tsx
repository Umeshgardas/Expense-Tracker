import { Metadata } from 'next';
import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = {
  title: 'Register | Expense Tracker',
  description: 'Create a new expense tracker account',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <RegisterForm />
    </main>
  );
}
