// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loadingUser } = useAuth();

  if (loadingUser) return null; // o un spinner
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
