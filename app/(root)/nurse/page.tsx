'use client'
import { useAuth } from '@/app/providers/AuthProvider';
import React from 'react'
import Unauthorized from '../unauthorized/page';

const NursePage = () => {
  const { user } = useAuth();
  if (user?.role !== "nurse") {
    return <Unauthorized />;
  }
  return (
    <div>NursePage</div>
  )
}

export default NursePage