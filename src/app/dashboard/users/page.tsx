"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Users, Plus, Loader2, AlertCircle, Shield, UserX, UserCheck, Trash2 } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Failed to load user list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    } else if (session) {
      setLoading(false);
    }
  }, [isSuperAdmin, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create user");
      }

      // Reset Form
      setName("");
      setEmail("");
      setPassword("");
      setRole("VIEWER");
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getSuperAdminCount = () => users.filter(u => u.role === "SUPER_ADMIN" && u.is_active).length;

  const toggleStatus = async (user: UserItem) => {
    if (user.role === "SUPER_ADMIN" && user.is_active && getSuperAdminCount() <= 1) {
      alert("You must have at least one active SUPER_ADMIN.");
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      fetchUsers();
    } catch (err) {
      alert("Failed to toggle status.");
    }
  };

  const changeRole = async (user: UserItem, newRole: string) => {
    if (user.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN" && getSuperAdminCount() <= 1) {
      alert("You must have at least one SUPER_ADMIN.");
      fetchUsers(); // Re-fetch to reset the dropdown UI
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        throw new Error("Failed to update role");
      }

      fetchUsers();

      // If user demotes themselves, log them out for security so they receive their new token on next login
      if (user.email === session?.user?.email && newRole !== "SUPER_ADMIN") {
        signOut({ callbackUrl: "/login" });
      }
    } catch (err) {
      alert("Failed to update role.");
    }
  };

  const deleteUser = async (user: UserItem) => {
    if (user.role === "SUPER_ADMIN" && getSuperAdminCount() <= 1) {
      alert("You must have at least one SUPER_ADMIN.");
      return;
    }

    const confirmMsg = `WARNING: The user '${user.name}' (${user.email}) will be removed. The details of the user and access of the user will also be removed completely. \n\nIf you click OK, remove the user permanently. If you click Cancel, you can cancel the process.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }

      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
    }
  };

  if (session && !isSuperAdmin) {
    return (
      <div className="bg-surface border border-border p-8 rounded-lg max-w-xl mx-auto mt-12 text-center space-y-4">
        <Shield className="w-16 h-16 text-danger mx-auto" />
        <h2 className="text-xl font-bold text-text-primary">Access Denied</h2>
        <p className="text-sm text-text-secondary">
          You do not have permission to access the User Management panel. This module is restricted to super administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">User Management</h2>
        <p className="text-sm text-text-secondary">Configure staff accounts, access roles, and status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Active Users
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger text-danger p-4 rounded text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-text-secondary py-6 text-center">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-sm font-medium">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-4 font-medium">{u.name}</td>
                      <td className="py-3 px-4 text-text-secondary font-mono text-xs">{u.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="bg-bg border border-border rounded text-xs px-2 py-1 text-text-primary focus:outline-none focus:border-primary"
                        >
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          u.is_active ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        }`}>
                          {u.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(u)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors text-xs font-semibold ${
                              u.is_active ? "bg-warning/10 text-warning hover:bg-warning/20" : "bg-success/10 text-success hover:bg-success/20"
                            }`}
                            disabled={u.email === session?.user?.email} // Cannot disable self
                            title={u.is_active ? "Deny Access" : "Grant Access"}
                          >
                            {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {u.is_active ? "Deny Access" : "Grant Access"}
                          </button>

                          <button
                            onClick={() => deleteUser(u)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-danger/10 text-danger hover:bg-danger/20 rounded transition-colors text-xs font-semibold"
                            disabled={u.email === session?.user?.email} // Cannot delete self
                            title="Remove User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Form */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-primary" />
            Create User Account
          </h3>

          {formError && (
            <div className="bg-danger/10 border border-danger text-danger p-3 rounded text-sm mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Staff name"
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@seculogix.com"
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Initial Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
              >
                <option value="VIEWER">VIEWER (Read-only)</option>
                <option value="ADMIN">ADMIN (Manage stock and orders)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full access + administration)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-dark text-bg font-bold py-2 px-4 rounded text-sm flex justify-center items-center transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create User Account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
