// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthContext, { AuthProvider } from "./context/AuthContext";
import { useContext } from "react";
import LoginPage from "./pages/LoginPage";
import CashierPosPage from "./pages/CashierPosPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import Receipt from "./components/Receipt";
import SettingsPage from "./pages/SettingsPage";
import UserManagementPage from "./components/UserManagement";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import PreparationPage from "./pages/PreparationPage";
import UserProfilePage from "./pages/UserProfilePage";
import ReportsPage from "./pages/ReportsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import PromotionsPage from "./pages/PromotionsPage";
import LoyaltyTiersPage from "./pages/LoyaltyTiersPage";
import EmployeeAttendancePage from "./pages/EmployeeAttendancePage";
import AuditLogsPage from "./pages/AuditLogsPage";
import StockTransfersPage from "./pages/StockTransfersPage";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role))
    return (
      <Navigate
        to={
          user.role === "admin" || user.role === "shop_owner"
            ? "/dashboard"
            : "/"
        }
      />
    );
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["cashier"]}>
                <CashierPosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "shop_owner"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipt/:orderId"
            element={
              <ProtectedRoute allowedRoles={["cashier", "admin"]}>
                <Receipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={["cashier", "admin"]}>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preparation"
            element={
              <ProtectedRoute allowedRoles={["cashier", "admin"]}>
                <PreparationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["cashier", "admin"]}>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotions"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PromotionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty-tiers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <LoyaltyTiersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EmployeeAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-transfers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StockTransfersPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
