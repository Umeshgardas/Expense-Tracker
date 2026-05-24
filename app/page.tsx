'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth(); // If your hook provides an isLoading flag, use it here

  useEffect(() => {
    // Wait until the auth state has initialized to avoid flash redirects
    if (isLoading) return;

    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Render a clean background layout while the redirect evaluation runs
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-sm text-muted-foreground animate-pulse">
        Verifying session state...
      </div>
    </div>
  );
}