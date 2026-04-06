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
      <div className="w-full max-w-[360px]">
        <div className="rounded-lg border border-border/50 bg-card p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-foreground/90 flex items-center justify-center">
              <span className="text-background font-bold text-lg">O</span>
            </div>
            <h1 className="text-sm font-mono tracking-widest font-semibold">OMNI_OKR</h1>
            <p className="text-muted-foreground text-[9px] font-mono tracking-widest mt-1">SIGN IN TO DASHBOARD</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-[10px] text-red-600 dark:text-red-400 font-mono">
                {error}
              </div>
            )}
            <div>
              <label className="text-[9px] font-mono tracking-widest block text-muted-foreground mb-2">EMAIL</label>
              <Input
                type="email"
                placeholder="you@omni.club"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest block text-muted-foreground mb-2">PASSWORD</label>
              <Input
                type="password"
                placeholder="--------"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </Button>
            <p className="text-[9px] text-muted-foreground/50 text-center font-mono tracking-wider">
              CONTACT ADMIN FOR ACCESS
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
