"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/",
    });

    if (error) {
      setError(error.message ?? "Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] animate-fade-in-up">
        <div className="rounded-lg border border-border/50 bg-card p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-foreground/90 flex items-center justify-center animate-scale-in">
              <span className="text-background font-bold text-lg">O</span>
            </div>
            <h1 className="text-sm font-mono tracking-widest font-semibold">OMNI_OKR</h1>
            <p className="text-muted-foreground text-[9px] font-mono tracking-widest mt-1">SIGN IN TO DASHBOARD</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div role="alert" className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-[10px] text-red-600 dark:text-red-400 font-mono animate-fade-in">
                {error}
              </div>
            )}
            <div className="animate-fade-in-up stagger-1">
              <label htmlFor="login-email" className="text-[9px] font-mono tracking-widest block text-muted-foreground mb-2">EMAIL</label>
              <Input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@omni.club"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                spellCheck={false}
                className="transition-all duration-200"
              />
            </div>
            <div className="animate-fade-in-up stagger-2">
              <label htmlFor="login-password" className="text-[9px] font-mono tracking-widest block text-muted-foreground mb-2">PASSWORD</label>
              <Input
                id="login-password"
                type="password"
                name="password"
                placeholder="--------"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="transition-all duration-200"
              />
            </div>
            <Button
              type="submit"
              className={`w-full animate-fade-in-up stagger-3${loading ? " animate-pulse" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : "SIGN IN"}
            </Button>
            <p className="text-[9px] text-muted-foreground/50 text-center font-mono tracking-wider animate-fade-in-up stagger-4">
              CONTACT ADMIN FOR ACCESS
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
