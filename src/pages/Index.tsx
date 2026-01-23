import { Navigate } from "react-router-dom";

const Index = () => {
  // Mangochase is an admin-style app; start on the dashboard.
  return <Navigate to="/dashboard" replace />;
};

export default Index;
