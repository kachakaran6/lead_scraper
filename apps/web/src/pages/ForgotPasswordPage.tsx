import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { api } from "../lib/api";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setIsSubmitted(true);
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to process password reset request."
      );
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
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Enter your registered email to receive a secure password reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-surface py-8 px-4 sm:px-10 shadow-sm rounded-xl border border-border-subtle">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Password Reset Requested
              </h3>
              <p className="text-sm text-text-secondary">
                If an account exists for <span className="font-medium text-text-primary">{email}</span>, a secure password reset link has been dispatched.
              </p>

              {resetToken && (
                <div className="p-3 bg-bg-base rounded-lg border border-border-default text-left mt-4">
                  <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-1">
                    Development Quick-Link:
                  </div>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="text-xs text-accent hover:underline break-all"
                  >
                    Click here to reset password directly
                  </Link>
                </div>
              )}

              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full justify-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4 text-text-tertiary" />}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center h-10 text-sm font-medium"
                    isLoading={isLoading}
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-border-subtle text-center text-xs text-text-secondary">
                Remember your password?{" "}
                <Link to="/login" className="text-accent font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
