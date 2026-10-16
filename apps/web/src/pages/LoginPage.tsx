import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { authClient } from "../lib/authClient";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError(null);
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setServerError(error.message ?? "Sign in failed");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["me"] });
    navigate("/", { replace: true });
  }

  const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand";
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-card">
        <div>
          <div className="text-xl font-bold text-slate-900">NTCAS Accounting</div>
          <div className="text-sm text-slate-500">Sign in to continue</div>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Email</span>
          <input type="email" autoComplete="username" className={input} {...register("email")} />
          {errors.email && <span className="text-xs text-rose-600">{errors.email.message}</span>}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Password</span>
          <input type="password" autoComplete="current-password" className={input} {...register("password")} />
          {errors.password && <span className="text-xs text-rose-600">{errors.password.message}</span>}
        </label>
        {serverError && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</div>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
