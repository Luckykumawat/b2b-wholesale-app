'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: '$0',
    features: ['10 Products Maximum', '3 Catalogues / Month', 'Standard Analytics', 'PDF Export & Share Links'],
    color: 'border-gray-200 hover:border-blue-500',
    badge: 'Best for beginners'
  },
  {
    id: 'base',
    name: 'Base',
    price: '$29',
    features: ['15 Products Maximum', '5 Catalogues / Month', 'Priority Analytics', 'Excel & PPT Export'],
    color: 'border-blue-200 hover:border-blue-500',
    badge: 'Growing Business'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$79',
    features: ['20 Products Maximum', '7 Catalogues / Month', 'Priority Support', 'Full Export Suite'],
    color: 'border-purple-200 hover:border-purple-500',
    badge: 'Most Popular'
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$199',
    features: ['Unlimited Products', 'Unlimited Catalogues', 'Dedicated Manager', 'API Access'],
    color: 'border-yellow-300 hover:border-yellow-500',
    badge: 'Enterprise'
  }
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState('free');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const register = useAuthStore((state) => state.register);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // Use email prefix as a default name since we're removing the name field
      const defaultName = email.split('@')[0];
      await register(defaultName, email, password, phone, plan);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9F9] p-4 lg:p-8">
      {step === 1 ? (
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Choose Your Subscription Plan</h1>
            <p className="text-lg text-gray-500">Pick the right plan for your wholesale business to get started.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {PLANS.map((p) => (
              <div 
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={`bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 border-2 relative flex flex-col ${
                  plan === p.id 
                    ? 'border-[#1B6F53] shadow-xl scale-105 z-10' 
                    : `${p.color} shadow-sm hover:shadow-md`
                }`}
              >
                {plan === p.id && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-6 h-6 text-[#1B6F53]" />
                  </div>
                )}
                
                <div className="text-xs font-bold uppercase tracking-widest text-[#1B6F53] mb-4">{p.badge}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-black text-gray-900">{p.price}</span>
                  <span className="text-gray-500 font-medium ml-2">/ month</span>
                </div>
                
                <div className="flex-1 space-y-4 mb-8">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mr-3 ${plan === p.id ? 'text-[#1B6F53]' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-700">{feat}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all mt-auto ${
                    plan === p.id 
                      ? 'bg-[#1B6F53] text-white shadow-lg shadow-green-900/20' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {plan === p.id ? 'Continue with Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-gray-500 font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1B6F53] hover:underline font-bold">
                Sign In Instead
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
          <button 
            onClick={() => setStep(1)}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </button>

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#1B6F53] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <UserPlus className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h2>
            <p className="text-gray-500 mt-2 font-medium">Selected Plan: <span className="text-[#1B6F53] font-bold uppercase">{plan}</span></p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium text-center shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B6F53] focus:border-transparent outline-none transition-all text-sm font-medium"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B6F53] focus:border-transparent outline-none transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B6F53] focus:border-transparent outline-none transition-all text-sm font-medium"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1B6F53] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 hover:bg-[#155a43] transition-all active:scale-[0.98] mt-8 flex items-center justify-center"
            >
              Complete Registration
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 font-medium mt-8">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      )}
    </div>
  );
}
