"use client";

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success('Login successful!');
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password, or your email is not confirmed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="space-y-4 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...':'Log in'}
        </button>
        <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-500 hover:text-blue-600">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
} 