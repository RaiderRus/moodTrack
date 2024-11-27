"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { AuthChangeEvent } from '@supabase/supabase-js';

export default function Login() {
  const router = useRouter();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.aud === 'authenticated') {
        router.push('/');
      }
    };
    checkUser();

    // Слушаем события аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            router.push('/');
          }
          break;
        case 'SIGNED_UP' as AuthChangeEvent:
          setShowEmailConfirmation(true);
          toast.info('Please check your email to confirm your account');
          break;
        case 'USER_UPDATED':
          if (session?.user.email_confirmed_at) {
            router.push('/');
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Mood Tracker</h1>
        
        {showEmailConfirmation && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
            <p className="text-center">
              Please check your email to confirm your account.
              <br />
              You need to verify your email before you can sign in.
            </p>
          </div>
        )}

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#000000',
                  brandAccent: '#333333',
                }
              }
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
                button_label: 'Sign in',
                loading_button_label: 'Signing in...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: "Already have an account? Sign in",
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a password',
                button_label: 'Sign up',
                loading_button_label: 'Signing up...',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: "Don't have an account? Sign up",
                confirmation_text: 'Check your email for the confirmation link'
              },
              forgotten_password: {
                email_label: 'Email address',
                button_label: 'Send reset instructions',
                loading_button_label: 'Sending reset instructions...',
                link_text: 'Forgot your password?'
              }
            },
          }}
          theme="dark"
          providers={[]}
          redirectTo={`${window.location.origin}/auth/callback`}
        />
      </Card>
    </div>
  );
} 