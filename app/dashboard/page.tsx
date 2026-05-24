import { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | Expense Tracker',
  description: 'Manage your daily expenses',
};

export default function DashboardPage() {
  return <Dashboard />;
}
