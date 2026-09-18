import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Layers, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../lib/auth";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        "Invalid email or password. Please check your credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 text-accent mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Sign in to Lead Scrapper
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Verified business discovery, intelligence & research platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-surface py-8 px-4 sm:px-10 shadow-sm rounded-xl border border-border-subtle">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-text-tertiary" />}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-text-primary">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-text-tertiary" />}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center h-10 text-sm font-medium"
                isLoading={isLoading}
              >
                Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-border-subtle text-center text-xs text-text-secondary">
            Don't have an account?{" "}
            <Link to="/register" className="text-accent font-medium hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-tertiary">
          <ShieldCheck className="w-4 h-4 text-success" />
          <span>Server-side encrypted authentication with Argon2id/bcrypt</span>
        </div>
      </div>
    </div>
  );
};
