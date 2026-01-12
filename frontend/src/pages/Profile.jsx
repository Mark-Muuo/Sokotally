import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../storage/auth';
import { API_BASE } from '../config/api';

const Profile = () => {
  const { user, refreshProfile, updateProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    firstName: '',
    lastName: '',
    town: '',
    gender: '',
    ageRange: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        town: user.town || '',
        gender: user.gender || '',
        ageRange: user.ageRange || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('avatar', file);
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE}/auth/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        await refreshProfile();
        setMessage('Photo updated');
      }
    } catch (err) {
      setMessage('Failed to upload photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile(form);
      setMessage('Saved successfully!');
    } catch (err) {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-gray-600 dark:text-gray-400">Please sign in</p>
      </div>
    );
  }

  const avatarUrl = user.avatar ? `${API_BASE}${user.avatar}` : null;
  const initials = (form.firstName?.[0] || user.name?.[0] || 'U') + (form.lastName?.[0] || '');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Profile Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white dark:bg-slate-200 flex items-center justify-center text-blue-600 text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials.toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-white">{form.firstName || user.name || 'User'} {form.lastName}</p>
                <p className="text-lg text-blue-100 mt-1">{form.phone || 'No phone number'}</p>
                <label className="inline-block mt-3 px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-600 text-base font-semibold cursor-pointer transition">
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6">

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Nickname</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Your business name"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-gray-100 dark:bg-slate-600 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white cursor-not-allowed"
                      placeholder="Phone number"
                      disabled
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phone number cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Location & Demographics Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
                  Location & About You
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Town/City</label>
                    <input
                      name="town"
                      value={form.town}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="e.g., Nairobi"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="">Choose your gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Age Range</label>
                    <select
                      name="ageRange"
                      value={form.ageRange}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="">Choose your age range</option>
                      <option value="<18">Under 18 years</option>
                      <option value="18-25">18 to 25 years</option>
                      <option value="26-35">26 to 35 years</option>
                      <option value="36-50">36 to 50 years</option>
                      <option value="50+">Above 50 years</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 text-base font-semibold ${message.includes('success') || message.includes('updated') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800'}`}>
                  {message}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 transition"
                >
                  Sign Out
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold transition"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
