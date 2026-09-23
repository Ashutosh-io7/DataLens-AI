import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DataLensLogo from "./DataLensLogo";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md animate-pulse">
            <DataLensLogo size={28} />
          </div>
          <p className="text-xs font-medium text-slate-400">Loading DataLens AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
