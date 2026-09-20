import React from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: "danger" | "success" | "warning" | "primary";
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  confirmVariant = "danger",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case "danger":
        return "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30";
      case "warning":
        return "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30";
      case "primary":
      default:
        return "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30";
    }
  };

  const getIcon = () => {
    switch (confirmVariant) {
      case "danger":
        return <ShieldAlert className="w-6 h-6 text-rose-400" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg shadow-lg transition flex items-center gap-2 ${getVariantStyles()}`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
