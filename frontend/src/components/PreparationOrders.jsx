import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiShoppingCart,
  FiUser,
  FiClock,
  FiX,
  FiCheck,
  FiEye,
  FiArrowRight,
  FiAlertCircle,
  FiShoppingBag,
} from "react-icons/fi";

function PreparationOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderPayments, setOrderPayments] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [storesRes, ordersRes] = await Promise.all([
          axios.get("/stores", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          axios.get("/orders/preparation", {
            params: { store_id: selectedStore, status: selectedStatus },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);
        setStores(storesRes.data);
        setOrders(ordersRes.data);
        if (ordersRes.data.length === 0) {
          setError(t("no_orders_found"));
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        const errorMsg =
          err.response?.data?.error || t("failed_to_fetch_orders");
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedStore, selectedStatus, t]);

  const fetchOrderDetails = async (orderId) => {
    setIsLoading(true);
    setError(null);
    try {
      const [itemsRes, paymentsRes] = await Promise.all([
        axios.get(`/orders/${orderId}/items`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get(`/orders/${orderId}/payments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);
      setOrderItems(itemsRes.data);
      setOrderPayments(paymentsRes.data);
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      const errorMsg =
        err.response?.data?.error || t("failed_to_fetch_details");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId, action) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let res;
      if (action === "cancel") {
        if (!cancelReason) {
          toast.error(t("cancel_reason_required"));
          setIsLoading(false);
          return;
        }
        res = await axios.post(
          `/orders/${orderId}/cancel`,
          { reason: cancelReason },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        res = await axios.post(
          `/orders/${orderId}/${action}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }
      setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
      if (action === "complete" || action === "cancel" || action === "pickup") {
        setOrders(orders.filter((o) => o.id !== orderId));
      }
      const successMsg = t(`order_${action}_success`, {
        defaultValue: `Order ${
          action === "complete"
            ? "prepared"
            : action === "pickup"
            ? "picked up"
            : "cancelled"
        } successfully.`,
      });
      setSuccess(successMsg);
      toast.success(successMsg);
      setIsCancelOpen(false);
      setCancelReason("");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        t(`failed_to_${action}_order`, {
          defaultValue: `Failed to ${
            action === "pickup" ? "mark order as picked up" : action
          } order.`,
        });
      console.error(`Failed to ${action} order ${orderId}:`, err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.id);
    setIsDetailsOpen(true);
  };

  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    preparing: "bg-blue-100 text-blue-800",
    prepared: "bg-green-100 text-green-800",
  };

  if (isLoading && !isDetailsOpen && !isCancelOpen) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-6"
      >
        {t("preparation_orders")}
      </motion.h2>

      {error && !orders.length && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("store")}
          </label>
          <div className="relative">
            <FiShoppingBag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            >
              <option value="">{t("all_stores")}</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 mt-4 sm:mt-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("status")}
          </label>
          <div className="relative">
            <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            >
              <option value="">{t("all_statuses")}</option>
              <option value="pending">{t("pending")}</option>
              <option value="preparing">{t("preparing")}</option>
              <option value="prepared">{t("prepared")}</option>
            </select>
          </div>
        </div>
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("total")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("store")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("pickup_time")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("status")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openOrderDetails(order)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    {order.id}
                  </motion.button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {order.customer_name || t("guest")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  ${order.total.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {order.store_name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {order.pickup_time
                    ? new Date(order.pickup_time).toLocaleString()
                    : t("na")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs capitalize ${
                      statusStyles[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                  {order.status === "pending" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(order.id, "prepare")}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      disabled={isLoading}
                    >
                      {t("start_preparing")}
                    </motion.button>
                  )}
                  {order.status === "preparing" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(order.id, "complete")}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      disabled={isLoading}
                    >
                      {t("mark_prepared")}
                    </motion.button>
                  )}
                  {order.status === "prepared" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(order.id, "pickup")}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      disabled={isLoading}
                    >
                      {t("mark_picked_up")}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsCancelOpen(true);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                    disabled={isLoading}
                  >
                    {t("cancel")}
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <motion.div
            key={order.id}
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openOrderDetails(order)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  {order.id}
                </motion.button>
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
                  ${order.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("store")}
                </span>
                <span className="text-sm text-gray-900">
                  {order.store_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("pickup_time")}
                </span>
                <span className="text-sm text-gray-900">
                  {order.pickup_time
                    ? new Date(order.pickup_time).toLocaleString()
                    : t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("status")}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs capitalize ${
                    statusStyles[order.status]
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("actions")}
                </span>
                <div className="flex space-x-2">
                  {order.status === "pending" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(order.id, "prepare")}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      disabled={isLoading}
                    >
                      {t("start_preparing")}
                    </motion.button>
                  )}
                  {order.status === "preparing" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(order.id, "complete")}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      disabled={isLoading}
                    >
                      {t("mark_prepared")}
                    </motion.button>
                  )}
                  {order.status === "prepared" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(order.id, "pickup")}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      disabled={isLoading}
                    >
                      {t("mark_picked_up")}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsCancelOpen(true);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                    disabled={isLoading}
                  >
                    {t("cancel")}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Details Modal */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-lg w-full max-w-lg sm:max-w-2xl shadow-xl">
            <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              {t("order_details")} #{selectedOrder?.id}
            </Dialog.Title>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}
            {isLoading && (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
            {!isLoading && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                    {t("items")}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("product")}
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("quantity")}
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("price")}
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("discount")}
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("total")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 text-right">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 text-right">
                              {item.discount}%
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 text-right">
                              $
                              {(
                                item.price *
                                item.quantity *
                                (1 - item.discount / 100)
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                    {t("payments")}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("method")}
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("amount")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {payment.payment_method_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 text-right">
                              ${payment.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDetailsOpen(false)}
                    className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    <FiX className="mr-2" />
                    {t("close")}
                  </motion.button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Cancel Order Modal */}
      <Dialog
        open={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              {t("cancel_order")} #{selectedOrder?.id}
            </Dialog.Title>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}
            <div className="relative">
              <FiAlertCircle className="absolute left-3 top-3 text-gray-400" />
              <textarea
                placeholder={t("reason_for_cancellation")}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="4"
                disabled={isLoading}
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCancelOpen(false)}
                className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                disabled={isLoading}
              >
                <FiX className="mr-2" />
                {t("close")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStatusChange(selectedOrder.id, "cancel")}
                className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                disabled={isLoading || !cancelReason}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("cancelling")}
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    {t("confirm_cancel")}
                  </>
                )}
              </motion.button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default PreparationOrders;
