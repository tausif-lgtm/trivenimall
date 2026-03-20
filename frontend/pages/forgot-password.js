import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { BuildingOfficeIcon, EnvelopeIcon, KeyIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201/api';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address.');
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      toast.success('OTP sent! Check your email inbox.');
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error('Please enter the 6-digit OTP.');
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, { email, otp });
      toast.success('OTP verified! Now set your new password.');
      setStep(3);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, { email, otp, newPassword });
      toast.success('Password reset successfully! You can now log in.');
      router.push('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const stepInfo = [
    { num: 1, label: 'Enter Email' },
    { num: 2, label: 'Verify OTP' },
    { num: 3, label: 'New Password' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <BuildingOfficeIcon className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Alcove Triveni Mall</h1>
          <p className="text-slate-400 mt-2 text-sm">Reset your password</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {stepInfo.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors
                  ${step === s.num ? 'bg-blue-600 text-white' : step > s.num ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`ml-1.5 text-xs font-medium hidden sm:inline ${step === s.num ? 'text-blue-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                {i < stepInfo.length - 1 && (
                  <div className={`w-6 h-0.5 mx-2 ${step > s.num ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Forgot Password?</h2>
                <p className="text-sm text-gray-500 mb-4">Enter your registered email address and we'll send you an OTP.</p>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-9"
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sending OTP...</>
                ) : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Enter OTP</h2>
                <p className="text-sm text-gray-500 mb-4">
                  We sent a 6-digit OTP to <strong>{email}</strong>. Valid for 15 minutes.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">OTP Code</label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field pl-9 text-center tracking-widest text-lg font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Verifying...</>
                ) : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change email address
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Set New Password</h2>
                <p className="text-sm text-gray-500 mb-4">Choose a strong password (minimum 6 characters).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-9 pr-10"
                    placeholder="New password"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-9"
                    placeholder="Confirm password"
                    required
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Resetting...</>
                ) : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Login
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} Alcove Triveni Mall. All rights reserved.
        </p>
      </div>
    </div>
  );
}
