import { Navigate, Outlet } from "react-router";
import { ApiError } from "../lib/api";
import { useMe } from "../lib/me";

export default function RequireAuth() {
  const { data, error, isLoading } = useMe();
  if (isLoading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (error instanceof ApiError && error.status === 401) return <Navigate to="/login" replace />;
  if (error) {
    return (
      <div className="p-8 text-sm text-rose-600">
        {error instanceof ApiError && error.status === 403 ? error.message : "Could not reach the server."}
      </div>
    );
  }
  return data ? <Outlet /> : null;
}
