import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getToken } from "../../storage/auth";
import { API_BASE } from "../../config/api";
import {
  Search,
  UserPlus,
  Shield,
  Ban,
  Trash2,
  MoreVertical,
} from "lucide-react";

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [page, search, filter]);

  const fetchUsers = async () => {
    const token = getToken();
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        search,
        role: filter,
      }).toString();
      const res = await fetch(`${API_BASE}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const promoteUser = async (userId) => {
    if (!confirm("Promote this user to admin?")) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/promote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchUsers();
        alert("User promoted to admin");
      }
    } catch (err) {
      console.error("Failed to promote user:", err);
    }
  };

  const demoteUser = async (userId) => {
    if (!confirm("Demote this admin to regular user?")) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/demote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchUsers();
        alert("Admin demoted to user");
      }
    } catch (err) {
      console.error("Failed to demote user:", err);
    }
  };

  const suspendUser = async (userId) => {
    const reason = prompt("Reason for suspension:");
    if (!reason) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        fetchUsers();
        alert("User suspended");
      }
    } catch (err) {
      console.error("Failed to suspend user:", err);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Management
        </h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-white/5 focus:border-blue-400/40 rounded-lg bg-white dark:bg-[#0f172a]/70 text-gray-900 dark:text-white transition-colors"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/5 focus:border-blue-400/40 rounded-lg bg-white dark:bg-[#0f172a]/70 transition-colors"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0f172a]/70 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/5 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/5">
          <thead className="bg-gray-50 dark:bg-blue-500/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/5">
            {users.map((user) => (
              <tr
                key={user._id}
                className="hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/20">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.username || "No username"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {user.email || "No email"}
                  </div>
                  <div className="text-sm text-gray-500">{user.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.suspended
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.suspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {user.role === "user" ? (
                      <button
                        onClick={() => promoteUser(user._id)}
                        className="text-blue-600 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 p-2 rounded-lg transition-colors"
                        title="Promote to Admin"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => demoteUser(user._id)}
                        disabled={
                          user._id === currentUser?._id ||
                          user._id === currentUser?.id
                        }
                        className="text-orange-600 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          user._id === currentUser?._id ||
                          user._id === currentUser?.id
                            ? "Cannot demote yourself"
                            : "Demote to User"
                        }
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => suspendUser(user._id)}
                      disabled={
                        user._id === currentUser?._id ||
                        user._id === currentUser?.id
                      }
                      className="text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        user._id === currentUser?._id ||
                        user._id === currentUser?.id
                          ? "Cannot suspend yourself"
                          : "Suspend User"
                      }
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {users.length} of {pagination.total} users
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-white/5 hover:border-blue-400/40 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pagination.pages}
            className="px-4 py-2 border border-gray-300 dark:border-white/5 hover:border-blue-400/40 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
