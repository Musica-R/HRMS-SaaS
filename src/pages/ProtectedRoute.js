import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/" replace />;
  }

  if (user?.role !== "company") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;