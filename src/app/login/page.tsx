"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const loginEmail = email.trim() || "admin@seculogix.com";
    const loginPassword = password || "admin123";

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-surface p-8 rounded-lg border border-border w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-wider mb-2">SECULOGIX</h1>
          <h2 className="text-xl text-text-primary font-medium">InStock Login</h2>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-bg border border-border rounded focus:outline-none focus:border-primary text-text-primary"
              placeholder="admin@seculogix.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-bg border border-border rounded focus:outline-none focus:border-primary text-text-primary"
              placeholder="admin123"
            />
          </div>

          <div className="text-xs text-text-secondary text-center bg-bg/40 py-2 rounded border border-border">
            Press <strong className="text-primary">Sign In</strong> with empty fields to auto-login as admin
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-bg font-bold py-2 px-4 rounded transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
