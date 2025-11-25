// src/components/OrderHistory.jsx

import { useState, useEffect, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiUser,
  FiFileText,
  FiX,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";

// Memoized OrderRow component to prevent unnecessary re-renders
const OrderRow = memo(({ order, openRefundModal, openDeleteModal, t }) => {
  const total = parseFloat(order.total);
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {order.id}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {order.customer_name || t("guest")}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {isNaN(total) ? t("na") : `${total.toFixed(2)} MMK`}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {order.currency_code}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {order.store_name}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {order.status}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
        <div className="flex justify-center space-x-2">
          {!order.is_refunded && order.status !== "cancelled" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openRefundModal(order.id)}
              className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
            >
              <FiDollarSign className="mr-1" />
              {t("refund")}
            </motion.button>
          )}
          {["pending", "preparing", "prepared", "cancelled"].includes(
            order.status
          ) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openDeleteModal(order.id)}
              className="flex items-center bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded-md text-sm transition-colors"
            >
              <FiTrash2 className="mr-1" />
              {t("delete")}
            </motion.button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
        <a
          href={`/receipt/${order.id}`}
          className="flex items-center justify-center text-indigo-600 hover:text-indigo-800"
        >
          <FiFileText className="mr-1" />
          {t("view")}
        </a>
      </td>
    </tr>
  );
});

// Memoized OrderCard component for mobile layout
const OrderCard = memo(({ order, openRefundModal, openDeleteModal, t }) => {
  const total = parseFloat(order.total);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("order_id")}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {order.id}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("customer")}
          </span>
          <span className="text-sm text-gray-900">
            {order.customer_name || t("guest")}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("total")}
          </span>
          <span className="text-sm text-gray-900">
            {isNaN(total) ? t("na") : `${total.toFixed(2)} MMK`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("currency")}
          </span>
          <span className="text-sm text-gray-900">{order.currency_code}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("store")}
          </span>
          <span className="text-sm text-gray-900">{order.store_name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("status")}
          </span>
          <span className="text-sm text-gray-900">{order.status}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("actions")}
          </span>
          <div className="flex space-x-2">
            {!order.is_refunded && order.status !== "cancelled" ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openRefundModal(order.id)}
                className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
              >
                <FiDollarSign className="mr-1" />
                {t("refund")}
              </motion.button>
            ) : (
              <span className="text-sm text-gray-500">{t("no_actions")}</span>
            )}
            {["pending", "preparing", "prepared"].includes(order.status) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openDeleteModal(order.id)}
                className="flex items-center bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded-md text-sm transition-colors"
              >
                <FiTrash2 className="mr-1" />
                {t("delete")}
              </motion.button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("receipt")}
          </span>
          <a
            href={`/receipt/${order.id}`}
            className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
          >
            <FiFileText className="mr-1" />
            {t("view")}
          </a>
        </div>
      </div>
    </motion.div>
  );
});

function OrderHistory() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [refundData, setRefundData] = useState({});
  const [deleteData, setDeleteData] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // Loading state for actions
  const [error, setError] = useState("");
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10; // Orders per page

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/orders/history?page=${page}&limit=${limit}`
      );
      setOrders(response.data.orders || []);
      setError(response.data.orders.length === 0 ? t("no_orders_found") : "");
    } catch (err) {
      console.error("Error fetching orders:", err);
      const errorMsg = err.response?.data?.error || t("failed_to_fetch_orders");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [t, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openRefundModal = useCallback((orderId) => {
    setSelectedOrderId(orderId);
    setIsRefundModalOpen(true);
  }, []);

  const closeRefundModal = useCallback(() => {
    setIsRefundModalOpen(false);
    setSelectedOrderId(null);
  }, []);

  const openDeleteModal = useCallback((orderId) => {
    setSelectedOrderId(orderId);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedOrderId(null);
  }, []);

  const handleRefund = useCallback(async () => {
    if (actionLoading) return; // Prevent multiple clicks
    const { amount, reason, refund_to_ewallet } =
      refundData[selectedOrderId] || {};
    if (!amount || amount <= 0 || !reason) {
      toast.error(t("invalid_refunded"));
      return;
    }
    try {
      setActionLoading(true);
      await axios.post("/orders/refund", {
        order_id: selectedOrderId,
        amount: parseFloat(amount),
        reason,
        refund_to_ewallet: !!refund_to_ewallet,
      });
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === selectedOrderId
            ? { ...o, is_refunded: true, status: "cancelled" }
            : o
        )
      );
      setRefundData((prev) => {
        const updated = { ...prev };
        delete updated[selectedOrderId];
        return updated;
      });
      toast.success(t("refund_success"));
      closeRefundModal();
    } catch (error) {
      console.error("Refund error:", error);
      const errorMsg = error.response?.data?.error || t("failed_to_refunded");
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, refundData, selectedOrderId, t, closeRefundModal]);

  const handleDelete = useCallback(async () => {
    if (actionLoading) return; // Prevent multiple clicks
    const { reason } = deleteData[selectedOrderId] || {};
    if (!reason) {
      toast.error(t("reason_required"));
      return;
    }
    try {
      setActionLoading(true);
      await axios.delete(`/orders/${selectedOrderId}`, {
        data: { reason },
      });
      setOrders((prevOrders) =>
        prevOrders.filter((o) => o.id !== selectedOrderId)
      );
      setDeleteData((prev) => {
        const updated = { ...prev };
        delete updated[selectedOrderId];
        return updated;
      });
      toast.success(t("delete_success"));
      closeDeleteModal();
    } catch (error) {
      console.error("Delete error:", error);
      const errorMsg = error.response?.data?.error || t("failed_to_delete");
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, deleteData, selectedOrderId, t, closeDeleteModal]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !orders.length) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }} // Reduced animation duration
        className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-6"
      >
        {t("order_history")}
      </motion.h2>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1 || actionLoading}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md disabled:bg-gray-300"
        >
          {t("previous")}
        </button>
        <span>
          {t("page")} {page}
        </span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={orders.length < limit || actionLoading}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md disabled:bg-gray-300"
        >
          {t("next")}
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("order_id")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("customer")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("total")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("currency")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("store")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("status")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("actions")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("receipt")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                openRefundModal={openRefundModal}
                openDeleteModal={openDeleteModal}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            openRefundModal={openRefundModal}
            openDeleteModal={openDeleteModal}
            t={t}
          />
        ))}
      </div>

      {/* Refund Modal */}
      <Dialog
        open={isRefundModalOpen}
        onClose={closeRefundModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-800 mb-4">
              {t("refund_order")} #{selectedOrderId}
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("refund_amount")}
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder={t("refund_amount")}
                    value={refundData[selectedOrderId]?.amount || ""}
                    onChange={(e) =>
                      setRefundData({
                        ...refundData,
                        [selectedOrderId]: {
                          ...refundData[selectedOrderId],
                          amount: e.target.value,
                        },
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                    max={orders.find((o) => o.id === selectedOrderId)?.total}
                    disabled={actionLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("reason")}
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("reason")}
                    value={refundData[selectedOrderId]?.reason || ""}
                    onChange={(e) =>
                      setRefundData({
                        ...refundData,
                        [selectedOrderId]: {
                          ...refundData[selectedOrderId],
                          reason: e.target.value,
                        },
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={actionLoading}
                    required
                  />
                </div>
              </div>

              {orders.find((o) => o.id === selectedOrderId)?.customer_id && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={
                      refundData[selectedOrderId]?.refund_to_ewallet || false
                    }
                    onChange={(e) =>
                      setRefundData({
                        ...refundData,
                        [selectedOrderId]: {
                          ...refundData[selectedOrderId],
                          refund_to_ewallet: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={actionLoading}
                  />
                  {t("refund_to_ewallet")}
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeRefundModal}
                className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                disabled={actionLoading}
              >
                <FiX className="mr-2" />
                {t("cancel")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefund}
                className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
                disabled={
                  actionLoading ||
                  !refundData[selectedOrderId]?.amount ||
                  !refundData[selectedOrderId]?.reason
                }
              >
                <FiCheck className="mr-2" />
                {t("refund")}
              </motion.button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-800 mb-4">
              {t("delete_order")} #{selectedOrderId}
            </Dialog.Title>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {t("delete_order_confirmation")}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("reason")}
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("reason")}
                    value={deleteData[selectedOrderId]?.reason || ""}
                    onChange={(e) =>
                      setDeleteData({
                        ...deleteData,
                        [selectedOrderId]: {
                          ...deleteData[selectedOrderId],
                          reason: e.target.value,
                        },
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={actionLoading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeDeleteModal}
                className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                disabled={actionLoading}
              >
                <FiX className="mr-2" />
                {t("cancel")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className="flex items-center bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md transition-colors"
                disabled={actionLoading || !deleteData[selectedOrderId]?.reason}
              >
                <FiTrash2 className="mr-2" />
                {t("delete")}
              </motion.button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default OrderHistory;
