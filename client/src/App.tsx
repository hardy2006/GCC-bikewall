import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import OperatorDashboard from "./pages/OperatorDashboard";

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "customer":
      return <CustomerDashboard />;
    case "technician":
      return <TechnicianDashboard />;
    case "operator":
      return <OperatorDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  const { isLoggedIn } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        <Route path="/dashboard/*" element={<DashboardRouter />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}