import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getValidToken, refreshToken } from "../storage/auth";
import { API_BASE } from "../config/api";

const Profile = () => {
  const { user, refreshProfile, updateProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    firstName: "",
    lastName: "",
    town: "",
    gender: "",
    ageRange: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        town: user.town || "",
        gender: user.gender || "",
        ageRange: user.ageRange || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage("");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow selecting the same file again after upload
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be 5MB or less.");
      return;
    }

    const fd = new FormData();
    fd.append("avatar", file);

    let token = getValidToken();
    if (!token) {
      setMessage("Session expired. Please sign in again.");
      return;
    }

    setUploadingAvatar(true);
    setMessage("");

    const sendRequest = async (authToken) =>
      fetch(`${API_BASE}/auth/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: fd,
      });

    try {
      let res = await sendRequest(token);
      if (res.status === 401 || res.status === 403) {
        try {
          token = await refreshToken();
          res = await sendRequest(token);
        } catch {
          setMessage("Session expired. Please sign in again.");
          return;
        }
      }

      if (res.ok) {
        await res.json().catch(() => ({}));
        await refreshProfile();
        setMessage("Photo updated successfully!");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage(errorData.error || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      setMessage("Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await updateProfile(form);
      setMessage("Saved successfully!");
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setMessage("Please type DELETE to confirm");
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const token = getValidToken();
      if (!token) {
        setMessage("Session expired. Please sign in again.");
        return;
      }
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Sign out and redirect
        await signOut();
        window.location.href = "/welcome";
      } else {
        setMessage("Failed to delete account");
      }
    } catch {
      setMessage("Error deleting account");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-gray-600 dark:text-gray-400">Please sign in</p>
      </div>
    );
  }

  // Cloudinary returns full URLs, so don't prepend API_BASE
  const avatarUrl = user.avatar || null;
  const initials =
    (form.firstName?.[0] || user.name?.[0] || "U") + (form.lastName?.[0] || "");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
          {/* Profile Header Section */}
          <div className="bg-gray-900 dark:bg-slate-800 p-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 flex items-center justify-center text-gray-900 dark:text-white text-3xl font-bold overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials.toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-semibold text-white">
                  {form.firstName || user.name || "User"} {form.lastName}
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  {form.phone || "No phone number"}
                </p>
                <label
                  className={`inline-block mt-3 px-5 py-2 text-gray-900 text-sm font-semibold cursor-pointer transition ${
                    uploadingAvatar
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {uploadingAvatar ? "Uploading..." : "Change Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
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
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition rounded-lg"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition rounded-lg"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nickname
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition rounded-lg"
                      placeholder="Your business name"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-gray-100 dark:bg-slate-600 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white cursor-not-allowed rounded-lg"
                      placeholder="Phone number"
                      disabled
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Phone number cannot be changed
                    </p>
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
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Your Town/City
                    </label>
                    <input
                      name="town"
                      value={form.town}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition rounded-lg"
                      placeholder="e.g., Nairobi"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition rounded-lg"
                    >
                      <option value="">Choose your gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Age Range
                    </label>
                    <select
                      name="ageRange"
                      value={form.ageRange}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-base bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition rounded-lg"
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
                <div
                  className={`p-4 text-base font-semibold rounded-lg ${
                    message.includes("success") || message.includes("updated")
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 transition rounded-lg shadow-sm hover:shadow-md"
                >
                  Sign Out
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold transition rounded-lg shadow-sm hover:shadow-md"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-slate-800 border-2 border-red-200 dark:border-red-900 overflow-hidden rounded-xl shadow-sm">
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-900">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
              Danger Zone
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Account
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Permanently delete your account and ALL associated data
                including:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 mb-4 ml-4">
                <li>All chat messages and conversations</li>
                <li>All transactions and financial records</li>
                <li>All items and inventory</li>
                <li>All debts and customer information</li>
                <li>Profile information and settings</li>
              </ul>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">
                WARNING: This action cannot be undone. Your data will be
                permanently deleted.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold transition rounded-lg shadow-sm hover:shadow-md"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 max-w-md w-full p-6 shadow-2xl border-2 border-red-500 rounded-xl">
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Delete Account?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This will permanently delete ALL your data including chats,
                transactions, items, debts, and customer information.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4 font-semibold">
                This action CANNOT be undone.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Type{" "}
                  <span className="text-red-600 dark:text-red-400">DELETE</span>{" "}
                  to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold transition disabled:opacity-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== "DELETE"}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  {deleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
