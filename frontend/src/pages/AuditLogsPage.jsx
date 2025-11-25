// src/pages/AuditLogsPage.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiFilter,
  FiUser,
  FiActivity,
  FiTag,
  FiCalendar,
} from "react-icons/fi";

function AuditLogsPage() {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    userId: "",
    entityType: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // Number of logs per page

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [filters, page]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error(t("failed_to_fetch_users"));
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = new URLSearchParams();
      if (filters.userId) params.append("user_id", filters.userId);
      if (filters.entityType) params.append("entity_type", filters.entityType);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      params.append("page", page);
      params.append("limit", limit);

      // Fetch audit logs
      const auditResponse = await axios.get(
        `/audit-logs?${params.toString()}`,
        config
      );
      const auditLogsData = auditResponse.data || [];
      console.log("Audit logs data:", auditLogsData);

      // Fetch order audit logs
      const orderAuditLogsResponse = await axios.get(
        "/orders/order-audit-logs",
        config
      );
      const orderAuditLogs = orderAuditLogsResponse.data || [];
      console.log("Order audit logs data:", orderAuditLogs);

      // Combine and enrich logs
      const enrichedLogs = [
        ...auditLogsData.map((log) => {
          const isValidOrderId =
            log.entity_type === "order" &&
            log.entity_id &&
            /^\d+$/.test(log.entity_id.toString());

          const orderLog =
            isValidOrderId && log.action === "delete"
              ? orderAuditLogs.find(
                  (oLog) =>
                    oLog.order_id.toString() === log.entity_id.toString() &&
                    oLog.action === "delete"
                )
              : null;

          return {
            id: log.id,
            user_id: log.user_id,
            username:
              users.find((user) => user.id === log.user_id)?.username ||
              t("na"),
            action: log.action,
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            reason: orderLog ? orderLog.reason : log.details?.reason || null,
            details: log.details ? JSON.parse(log.details) : null,
            created_at: log.created_at,
          };
        }),
        ...orderAuditLogs
          .filter(
            (oLog) =>
              !auditLogsData.some(
                (log) =>
                  log.entity_type === "order" &&
                  log.entity_id.toString() === oLog.order_id.toString() &&
                  log.action === oLog.action
              )
          )
          .map((oLog) => ({
            id: oLog.id,
            user_id: oLog.user_id,
            username:
              users.find((user) => user.id === oLog.user_id)?.username ||
              t("na"),
            action: oLog.action,
            entity_type: "order",
            entity_id: oLog.order_id,
            reason: oLog.reason || null,
            details: null,
            created_at: oLog.created_at,
          })),
      ];

      // Apply filters and sort by created_at descending
      const filteredLogs = enrichedLogs
        .filter((log) => {
          if (filters.userId && log.user_id.toString() !== filters.userId) {
            return false;
          }
          if (filters.entityType && log.entity_type !== filters.entityType) {
            return false;
          }
          if (filters.startDate) {
            const logDate = new Date(log.created_at);
            const startDate = new Date(filters.startDate);
            if (logDate < startDate) return false;
          }
          if (filters.endDate) {
            const logDate = new Date(log.created_at);
            const endDate = new Date(filters.endDate);
            if (logDate > endDate) return false;
          }
          return true;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setAuditLogs(filteredLogs);
      setTotalPages(Math.ceil(filteredLogs.length / limit));
      const paginatedLogs = filteredLogs.slice(
        (page - 1) * limit,
        page * limit
      );

      if (filteredLogs.length === 0) {
        setError(
          filters.userId ||
            filters.entityType ||
            filters.startDate ||
            filters.endDate
            ? t("no_audit_logs_match_filters")
            : t("no_audit_logs_found")
        );
      } else {
        setError("");
      }
      setAuditLogs(paginatedLogs);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_fetch_audit_logs");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const entityTypes = [
    "order",
    "product",
    "customer",
    "promotion",
    "loyalty_tier",
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-6"
      >
        {t("audit_logs")}
      </motion.h1>

      {error && !auditLogs.length && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:space-x-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("filter_by_user")}
          </label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t("all_users")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 mt-4 sm:mt-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("filter_by_entity_type")}
          </label>
          <div className="relative">
            <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              name="entityType"
              value={filters.entityType}
              onChange={handleFilterChange}
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t("all_entity_types")}</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 mt-4 sm:mt-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("start_date")}
          </label>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 mt-4 sm:mt-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("end_date")}
          </label>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md disabled:bg-gray-300"
          >
            {t("previous")}
          </button>
          <span>
            {t("page")} {page} {t("of")} {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md disabled:bg-gray-300"
          >
            {t("next")}
          </button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("user")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("action")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("entity_type")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("entity_id")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("reason")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("details")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("created_at")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <FiUser className="mr-2 text-indigo-500" />
                    {log.username}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <FiActivity className="mr-2 text-indigo-500" />
                    {t(log.action)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {t(log.entity_type || "na")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {log.entity_id || t("na")}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {log.reason || t("na")}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {log.details ? (
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(
                        {
                          status: log.details.status,
                          reason: log.details.reason,
                          amount: log.details.amount,
                          refund_to_ewallet: log.details.refund_to_ewallet,
                          total: log.details.total,
                          customer_id: log.details.customer_id,
                          discount: log.details.discount,
                          store_id: log.details.store_id,
                          branch_id: log.details.branch_id,
                          is_online: log.details.is_online,
                        },
                        null,
                        2
                      )}
                    </pre>
                  ) : (
                    t("na")
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {auditLogs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("user")}
                </span>
                <span className="text-sm font-semibold text-gray-900 flex items-center">
                  <FiUser className="mr-1 text-indigo-500" />
                  {log.username}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("action")}
                </span>
                <span className="text-sm text-gray-900 flex items-center">
                  <FiActivity className="mr-1 text-indigo-500" />
                  {t(log.action)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("entity_type")}
                </span>
                <span className="text-sm text-gray-900">
                  {t(log.entity_type || "na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("entity_id")}
                </span>
                <span className="text-sm text-gray-900">
                  {log.entity_id || t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("reason")}
                </span>
                <span className="text-sm text-gray-900">
                  {log.reason || t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("details")}
                </span>
                <span className="text-sm text-gray-900">
                  {log.details ? (
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(
                        {
                          status: log.details.status,
                          reason: log.details.reason,
                          amount: log.details.amount,
                          refund_to_ewallet: log.details.refund_to_ewallet,
                          total: log.details.total,
                          customer_id: log.details.customer_id,
                          discount: log.details.discount,
                          store_id: log.details.store_id,
                          branch_id: log.details.branch_id,
                          is_online: log.details.is_online,
                        },
                        null,
                        2
                      )}
                    </pre>
                  ) : (
                    t("na")
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("created_at")}
                </span>
                <span className="text-sm text-gray-900">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default AuditLogsPage;
