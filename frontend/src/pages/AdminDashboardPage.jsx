// src/pages/AdminDashboardPage.jsx

import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import AuthContext from "../context/AuthContext";
import AdminNavbar from "../components/AdminNavbar";
import OrderHistory from "../components/OrderHistory";
import CustomerManagement from "../components/CustomerManagement";
import ProductManagement from "../components/ProductManagement";
import PreparationOrders from "../components/PreparationOrders";
import UserManagement from "../components/UserManagement";
import ShopManagement from "../components/ShopManagement";
import BranchManagementPage from "../components/BranchManagement";
import PromotionsPage from "./PromotionsPage";
import LoyaltyTiersPage from "./LoyaltyTiersPage";
import EmployeeAttendancePage from "./EmployeeAttendancePage";
import AuditLogsPage from "./AuditLogsPage";
import StockTransfersPage from "./StockTransfersPage";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FiHome,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiClipboard,
  FiSettings,
  FiUser,
  FiTruck,
  FiAward,
  FiClock,
  FiFileText,
  FiRepeat,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiAlertTriangle,
  FiMenu,
  FiX,
  FiBarChart,
} from "react-icons/fi";
import SalesReport from "../components/SalesReport";
import { Navigate, NavLink, useNavigate } from "react-router-dom";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    orderCount: 0,
    salesData: [],
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [period, setPeriod] = useState("day");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw (
            new Error(t("no_auth_token")) && window.location.replace("/login")
          );
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `/orders/stats?period=${period}`,
          config
        );
        setDashboardData({
          totalSales: parseFloat(response.data.totalSales) || 0,
          orderCount: parseInt(response.data.orderCount, 10) || 0,
          salesData: response.data.salesData || [],
        });
        setError("");
      } catch (err) {
        const errorMessage =
          err.response?.status === 404
            ? t("dashboard_endpoint_not_found")
            : err.response?.status === 401
            ? t("unauthorized_access")
            : err.response?.status === 403
            ? t("no_access_to_shop_data")
            : !err.response?.data || response.data.salesData?.length === 0
            ? t("no_data_available")
            : err.message || t("failed_to_fetch_dashboard");
        setError(errorMessage);
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [t, period]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 sm:mx-6 rounded-lg">
        {error}
      </div>
    );
  }

  const tabs = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: <FiHome className="mr-2" />,
      component: (
        <DashboardContent
          data={dashboardData}
          period={period}
          setPeriod={setPeriod}
        />
      ),
      roles: ["admin", "shop_owner"],
    },
    {
      id: "sale_report",
      label: t("sale_report"),
      icon: <FiBarChart className="mr-2" />,
      component: <SalesReport />,
      roles: ["admin", "shop_owner"],
    },
    {
      id: "orders",
      label: t("order_history"),
      icon: <FiShoppingCart className="mr-2" />,
      component: <OrderHistory />,
      roles: ["admin", "shop_owner"],
    },
    {
      id: "customers",
      label: t("customer_management"),
      icon: <FiUsers className="mr-2" />,
      component: <CustomerManagement />,
      roles: ["admin", "shop_owner"],
    },
    {
      id: "products",
      label: t("product_management"),
      icon: <FiPackage className="mr-2" />,
      component: <ProductManagement />,
      roles: ["admin", "shop_owner"],
    },
    {
      id: "preparation",
      label: t("preparation_orders"),
      icon: <FiClipboard className="mr-2" />,
      component: <PreparationOrders />,
      roles: ["admin", "shop_owner"],
    },
    {
      id: "users",
      label: t("user_management"),
      icon: <FiUser className="mr-2" />,
      component: <UserManagement />,
      roles: ["admin"], // Restrict to admin role only
    },
    {
      id: "shops",
      label: t("shop_management"),
      icon: <FiSettings className="mr-2" />,
      component: <ShopManagement />,
      roles: ["admin"],
    },
    {
      id: "branches",
      label: t("branches"),
      icon: <FiTruck className="mr-2" />,
      component: <BranchManagementPage />,
      roles: ["admin"],
    },
    {
      id: "promotions",
      label: t("manage_promotions"),
      icon: <FiAward className="mr-2" />,
      component: <PromotionsPage />,
      roles: ["admin", "shop_owner"],
    },
    {
      id: "loyalty",
      label: t("manage_loyalty_tiers"),
      icon: <FiRepeat className="mr-2" />,
      component: <LoyaltyTiersPage />,
      roles: ["admin", "shop_owner"],
    },
    {
      id: "attendance",
      label: t("manage_attendance"),
      icon: <FiClock className="mr-2" />,
      component: <EmployeeAttendancePage />,
      roles: ["admin", "shop_owner"],
    },
    {
      id: "audit_logs",
      label: t("audit_logs"),
      icon: <FiFileText className="mr-2" />,
      component: <AuditLogsPage />,
      roles: ["admin"],
    },
    {
      id: "stock_transfers",
      label: t("manage_stock_transfers"),
      icon: <FiRepeat className="mr-2" />,
      component: <StockTransfersPage />,
      roles: ["admin"],
    },
  ].filter((tab) => tab.roles.includes(user?.role || "shop_owner"));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden md:block w-64 bg-gradient-to-b from-indigo-700 to-purple-800 shadow-lg p-4 fixed h-full z-20 overflow-y-auto"
        role="navigation"
        aria-label={t("sidebar_navigation")}
      >
        <h2 className="text-xl font-bold mb-6 text-white">
          {t("admin_panel")}
        </h2>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </nav>
      </motion.aside>

      <header className="md:hidden bg-white dark:bg-gray-800 shadow fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {t("admin_panel")}
          </h2>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            aria-label={t("open_menu")}
          >
            <FiMenu className="text-2xl" />
          </button>
        </div>
      </header>

      <Dialog
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        className="relative z-40 md:hidden"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex">
          <Dialog.Panel className="w-3/4 max-w-xs bg-gradient-to-b from-indigo-700 to-purple-800 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {t("admin_panel")}
              </h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-gray-300"
                aria-label={t("close_menu")}
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-white hover:bg-white/10"
                  }`}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </nav>
          </Dialog.Panel>
        </div>
      </Dialog>

      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-4">
        <AdminNavbar
          role={user?.role || "shop_owner"}
          name={user?.username || "null"}
        />
        <div className="p-4 sm:p-6">
          {tabs.find((tab) => tab.id === activeTab)?.component}
        </div>
      </main>
    </div>
  );
}

function DashboardContent({ data, period, setPeriod }) {
  const { t } = useTranslation();

  const today = new Date().toISOString().split("T")[0];
  const todaySales =
    data.salesData.find((row) => row.salesDate === today)?.totalSales || 0;

  const lowStock = 0;

  const totalSales = typeof data.totalSales === "number" ? data.totalSales : 0;
  const orderCount = typeof data.orderCount === "number" ? data.orderCount : 0;

  const chartConfig = {
    data: {
      labels: data.salesData.map((row) => row.salesDate),
      datasets: [
        {
          label: t("sales"),
          data: data.salesData.map((row) =>
            typeof row.totalSales === "number" ? row.totalSales : 0
          ),
          backgroundColor: "#6366f1",
          borderColor: "#4f46e5",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: t("amount"),
            font: { size: 12 },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: { size: 10 },
            callback: (value) => `$${value.toFixed(2)}`,
          },
        },
        x: {
          title: {
            display: true,
            text: t("date"),
            font: { size: 12 },
          },
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 10 },
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { size: 12 },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { size: 12 },
          bodyFont: { size: 10 },
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`,
          },
        },
      },
    },
  };

  return (
    <div className="p-4 sm:p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6"
      >
        {t("dashboard")}
      </motion.h1>

      <div className="mb-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="p-2 border rounded text-gray-800 dark:text-white"
        >
          <option value="day">{t("daily")}</option>
          <option value="week">{t("weekly")}</option>
          <option value="month">{t("monthly")}</option>
        </select>
      </div>

      {data.salesData.length === 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg">
          {t("no_data_available")}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300 border-l-4 border-indigo-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
              <FiDollarSign className="text-lg sm:text-xl" />
            </div>
            <div className="ml-3">
              <h2 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300">
                {t("total_sales")}
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {totalSales.toFixed(2)} MMK
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300 border-l-4 border-green-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <FiTrendingUp className="text-lg sm:text-xl" />
            </div>
            <div className="ml-3">
              <h2 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300">
                {t("order_count")}
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {orderCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300 border-l-4 border-yellow-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
              <FiCalendar className="text-lg sm:text-xl" />
            </div>
            <div className="ml-3">
              <h2 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300">
                {t("today_sales")}
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {todaySales.toFixed(2)} MMK
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300 border-l-4 border-red-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <FiAlertTriangle className="text-lg sm:text-xl" />
            </div>
            <div className="ml-3">
              <h2 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300">
                {t("low_stock")}
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {lowStock} {t("items")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {t("sales_trend")}
        </h2>
        <div className="h-48 sm:h-64 md:h-80">
          <Bar data={chartConfig.data} options={chartConfig.options} />
        </div>
      </motion.div>
    </div>
  );
}

export default AdminDashboardPage;
