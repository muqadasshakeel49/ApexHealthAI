'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/ui/ErrorState';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await register(email, password, name);
      sessionStorage.setItem('auth-flow', 'register');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 items-center justify-center text-white shadow-md shadow-indigo-100 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Create an account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Get started with AI-assisted appointment booking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/90 rounded-2xl space-y-6">
          {error && <ErrorState message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Must be at least 8 characters"
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
