import { Navigate } from "react-router-dom";
import { hasValidToken } from "../utils/auth";

const ProtectedRoute = ({ children }) => {
  if (!hasValidToken()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
