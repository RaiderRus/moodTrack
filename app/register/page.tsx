"use client";

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must contain at least 6 characters';
    }
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check password before submission
    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        if (error.message.includes('weak password')) {
          setPasswordError('Password is too weak. Use at least 6 characters');
          return;
        }
        throw error;
      }
      
      toast.success('Registration successful!');
      router.push('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different registration errors
      if (error.message.includes('email')) {
        toast.error('Invalid email address');
      } else if (error.message.includes('already registered')) {
        toast.error('This email is already registered');
      } else {
        toast.error('Registration error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleRegister} className="space-y-4 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Registration</h1>
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
            onChange={handlePasswordChange}
            className={`w-full p-2 border rounded ${
              passwordError ? 'border-red-500' : ''
            }`}
            required
            minLength={6}
          />
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            At least 6 characters
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading || !!passwordError}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
} 