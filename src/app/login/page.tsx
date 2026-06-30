"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PackageOpen, ArrowRight, ArrowLeft, ShieldCheck, Activity, Cpu } from "lucide-react";
import { loginAction } from "./action";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email.trim());
      formData.append("password", password);
      
      try {
        const result = await loginAction(formData);
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          router.push("/dashboard");
          router.refresh();
        }
      } catch (err: any) {
        // Fallback for NEXT_REDIRECT error if it still gets thrown
        if (err.message && err.message.includes('NEXT_REDIRECT')) {
          router.push("/dashboard");
        } else {
          setError("An unexpected error occurred.");
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden font-sans">
      
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-text-secondary hover:text-white transition-colors px-4 py-2 rounded-lg bg-black/20 hover:bg-black/40 border border-white/5 backdrop-blur-md animate-fade-in group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Public Site</span>
      </Link>

      {/* 1. Deep Space Tech Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        {/* Animated Grid that slides down endlessly */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(245, 158, 11, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
            animation: 'slide-grid 15s linear infinite',
          }}
        />
      </div>

      {/* 2. Intense Glowing Orbs for Glass Refraction */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] bg-primary/30 rounded-full blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[30vw] h-[30vw] bg-info/20 rounded-full blur-[100px] mix-blend-screen animate-blob-reverse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] bg-danger/10 rounded-full blur-[150px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* 3. The Main Split Card Container */}
      <div className="w-full max-w-6xl mx-auto p-4 md:p-8 relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen lg:min-h-0 lg:h-[800px] animate-fade-in">
        
        {/* Left Side: Branding & Creative Visuals */}
        <div className="hidden lg:flex w-1/2 h-full flex-col justify-between p-12 relative rounded-l-3xl overflow-hidden border border-white/5 bg-black/40 backdrop-blur-md shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0" />
          
          <div className="relative z-10">
            <Link href="/" className="inline-block hover:scale-105 transition-transform duration-300">
              <Image 
                src="/logo.png" 
                alt="SecuLogix Logo" 
                width={200} 
                height={50} 
                className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                priority
              />
            </Link>
            <h1 className="text-4xl font-bold text-white mt-12 leading-tight">
              Next-Gen <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-warning">Stock Intelligence</span>
            </h1>
            <p className="text-text-secondary mt-4 text-lg max-w-md">
              Securely manage your inventory, track components in real-time, and automate your entire supply chain pipeline.
            </p>
          </div>

          {/* Animated Features List */}
          <div className="relative z-10 space-y-6 mt-12">
            <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Enterprise Security</h3>
                <p className="text-sm text-text-secondary">Bank-grade encryption & RBAC</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center border border-info/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Activity className="w-6 h-6 text-info" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Real-Time Analytics</h3>
                <p className="text-sm text-text-secondary">Live stock tracking & metrics</p>
              </div>
            </div>

            <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center border border-success/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Cpu className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Smart Automation</h3>
                <p className="text-sm text-text-secondary">Automated low-stock alerts</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-12">
            <p className="text-xs text-text-secondary/50 uppercase tracking-widest font-mono">System v2.4.0 • Operational</p>
          </div>
        </div>

        {/* Right Side: The Login Form */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center p-8 md:p-16 rounded-3xl lg:rounded-l-none lg:rounded-r-3xl bg-surface/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle right-side glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="lg:hidden mb-10 flex justify-center">
            <Link href="/" className="inline-block hover:scale-105 transition-transform duration-300">
              <Image 
                src="/logo.png" 
                alt="SecuLogix Logo" 
                width={250} 
                height={60} 
                className="drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              />
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-6 shadow-lg">
              <PackageOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
            <p className="text-text-secondary mt-2">Enter your credentials to access the portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-lg text-sm flex items-center animate-fade-in shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder-white/30 focus:border-primary focus:ring-1 focus:ring-primary focus:bg-black/40 transition-all duration-300"
                placeholder="admin@seculogix.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-primary hover:text-primary-dark transition-colors">Forgot Password?</a>
              </div>
              <input
                type="password"
                required
                className="w-full px-5 py-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder-white/30 focus:border-primary focus:ring-1 focus:ring-primary focus:bg-black/40 transition-all duration-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-lg flex items-center justify-center group hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isPending ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate Securely
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Inject custom CSS just for the grid animation to avoid polluting globals */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-grid {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
      `}} />
    </div>
  );
}
