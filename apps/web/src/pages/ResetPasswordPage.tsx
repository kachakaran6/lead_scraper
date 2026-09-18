import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layers, Lock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { api } from "../lib/api";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing or invalid reset token. Please request a new link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Password reset failed. The link may have expired."
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
          Set New Password
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Enter your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-surface py-8 px-4 sm:px-10 shadow-sm rounded-xl border border-border-subtle">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Password Reset Complete
              </h3>
              <p className="text-sm text-text-secondary">
                Your password has been securely updated. Redirecting to login...
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="primary" className="w-full justify-center">
                    Go to Login Now <ArrowRight className="w-4 h-4 ml-1.5" />
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
                  label="New Password (min. 8 characters)"
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-text-tertiary" />}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-text-tertiary" />}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center h-10 text-sm font-medium"
                    isLoading={isLoading}
                  >
                    Reset Password
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
