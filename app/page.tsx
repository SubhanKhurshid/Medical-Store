'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the /signin page
    router.push('/signin');
  }, [router]);

  return null; // Return nothing while redirecting
}
