import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export const UniversalProfile: React.FC = () => {
  const { user, login } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      await apiClient.put('/auth/profile', {
        name: name.trim(),
        phone: phone.trim() || null,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setProfileError(axiosErr.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      setIsChangingPassword(false);
      return;
    }

    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPasswordError(axiosErr.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-300">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <User className="w-7 h-7 text-coral-500" />
            <span>Account Profile</span>
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 font-medium">
            Manage your personal credentials, contact details, and platform security.
          </p>
        </div>

        <Badge variant="coral" size="md" className="capitalize self-start sm:self-auto">
          Role: {user?.role?.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info Form */}
        <Card variant="cream" className="p-6 sm:p-8 space-y-6 shadow-md border border-cream-300 rounded-3xl">
          <div className="flex items-center gap-3 pb-3 border-b border-cream-200">
            <div className="w-10 h-10 rounded-xl bg-navy-950 text-white flex items-center justify-center font-bold text-base">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-950">Basic Details</h3>
              <p className="text-xs text-navy-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Profile details successfully updated!</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{profileError}</span>
              </div>
            )}

            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Email cannot be changed."
            />

            <Input
              label="Phone Number (Optional)"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile
            </Button>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card variant="cream" className="p-6 sm:p-8 space-y-6 shadow-md border border-cream-300 rounded-3xl">
          <div className="flex items-center gap-3 pb-3 border-b border-cream-200">
            <div className="w-10 h-10 rounded-xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-950">Security & Credentials</h3>
              <p className="text-xs text-navy-500">Update your account login password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Password changed successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{passwordError}</span>
              </div>
            )}

            <Input
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              type="password"
              label="New Password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="outline"
              size="md"
              className="w-full"
              isLoading={isChangingPassword}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default UniversalProfile;
