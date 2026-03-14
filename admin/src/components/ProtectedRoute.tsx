import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/api";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
