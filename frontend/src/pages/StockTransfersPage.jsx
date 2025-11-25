// src/pages/StockTransfersPage.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiCheck,
  FiX,
  FiArrowRight,
  FiArrowLeft,
  FiPackage,
  FiMapPin,
  FiEdit2,
} from "react-icons/fi";

function StockTransfersPage() {
  const { t } = useTranslation();
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [newTransfer, setNewTransfer] = useState({
    fromBranchId: "",
    toBranchId: "",
    productId: "",
    quantity: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [transfersRes, branchesRes, productsRes] = await Promise.all([
          axios.get("/stock-transfers", config),
          axios.get("/branches", config),
          axios.get("/products", config),
        ]);
        setTransfers(transfersRes.data);
        setBranches(branchesRes.data);
        setProducts(productsRes.data);
        if (transfersRes.data.length === 0) {
          setError(t("no_transfers_found"));
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.error || t("failed_to_fetch_data");
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const handleAddOrEditTransfer = async (e) => {
    e.preventDefault();
    const quantity = parseInt(newTransfer.quantity);
    if (
      !newTransfer.fromBranchId ||
      !newTransfer.toBranchId ||
      !newTransfer.productId
    ) {
      const errorMessage = t("select_all_fields");
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      const errorMessage = t("invalid_quantity");
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    if (newTransfer.fromBranchId === newTransfer.toBranchId) {
      const errorMessage = t("same_branch_error");
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingTransfer) {
        await axios.put(
          `/stock-transfers/${editingTransfer.id}`,
          {
            from_branch_id: newTransfer.fromBranchId,
            to_branch_id: newTransfer.toBranchId,
            product_id: newTransfer.productId,
            quantity,
            status: editingTransfer.status,
          },
          config
        );
        toast.success(t("transfer_updated"));
      } else {
        await axios.post(
          "/stock-transfers",
          {
            from_branch_id: newTransfer.fromBranchId,
            to_branch_id: newTransfer.toBranchId,
            product_id: newTransfer.productId,
            quantity,
            status: "pending",
          },
          config
        );
        toast.success(t("transfer_added"));
      }
      setNewTransfer({
        fromBranchId: "",
        toBranchId: "",
        productId: "",
        quantity: "",
      });
      setEditingTransfer(null);
      setIsModalOpen(false);
      const response = await axios.get("/stock-transfers", config);
      setTransfers(response.data);
      if (response.data.length === 0) {
        setError(t("no_transfers_found"));
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        (editingTransfer
          ? t("failed_to_update_transfer")
          : t("failed_to_add_transfer"));
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/stock-transfers/${id}`, { status }, config);
      toast.success(t(`transfer_${status}`));
      const response = await axios.get("/stock-transfers", config);
      setTransfers(response.data);
      if (response.data.length === 0) {
        setError(t("no_transfers_found"));
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_update_transfer");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditTransfer = (transfer) => {
    setNewTransfer({
      fromBranchId: transfer.from_branch_id,
      toBranchId: transfer.to_branch_id,
      productId: transfer.product_id,
      quantity: transfer.quantity,
    });
    setEditingTransfer(transfer);
    setIsModalOpen(true);
  };

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
        {t("manage_stock_transfers")}
      </motion.h1>

      {error && !transfers.length && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setNewTransfer({
            fromBranchId: "",
            toBranchId: "",
            productId: "",
            quantity: "",
          });
          setEditingTransfer(null);
          setIsModalOpen(true);
        }}
        className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md mb-6 text-sm transition-colors"
      >
        <FiPlus className="mr-2" />
        {t("add_transfer")}
      </motion.button>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("from_branch")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("to_branch")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("product")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("quantity")}
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
            {transfers.map((transfer) => (
              <tr key={transfer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <FiArrowLeft className="mr-2 text-indigo-500" />
                    {branches.find((b) => b.id === transfer.from_branch_id)
                      ?.name || t("na")}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <FiArrowRight className="mr-2 text-indigo-500" />
                    {branches.find((b) => b.id === transfer.to_branch_id)
                      ?.name || t("na")}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <FiPackage className="mr-2 text-indigo-500" />
                    {products.find((p) => p.id === transfer.product_id)?.name ||
                      t("na")}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {transfer.quantity}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {transfer.status}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                  {transfer.status === "pending" && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleUpdateStatus(transfer.id, "completed")
                        }
                        className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        <FiCheck className="mr-1" />
                        {t("mark_completed")}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleUpdateStatus(transfer.id, "rejected")
                        }
                        className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        <FiX className="mr-1" />
                        {t("mark_rejected")}
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditTransfer(transfer)}
                    className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <FiEdit2 className="mr-1" />
                    {t("edit")}
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {transfers.map((transfer) => (
          <motion.div
            key={transfer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("from_branch")}
                </span>
                <span className="text-sm font-semibold text-gray-900 flex items-center">
                  <FiArrowLeft className="mr-1 text-indigo-500" />
                  {branches.find((b) => b.id === transfer.from_branch_id)
                    ?.name || t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("to_branch")}
                </span>
                <span className="text-sm text-gray-900 flex items-center">
                  <FiArrowRight className="mr-1 text-indigo-500" />
                  {branches.find((b) => b.id === transfer.to_branch_id)?.name ||
                    t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("product")}
                </span>
                <span className="text-sm text-gray-900 flex items-center">
                  <FiPackage className="mr-1 text-indigo-500" />
                  {products.find((p) => p.id === transfer.product_id)?.name ||
                    t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("quantity")}
                </span>
                <span className="text-sm text-gray-900">
                  {transfer.quantity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("status")}
                </span>
                <span className="text-sm text-gray-900 capitalize">
                  {transfer.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("actions")}
                </span>
                <div className="flex space-x-2">
                  {transfer.status === "pending" && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleUpdateStatus(transfer.id, "completed")
                        }
                        className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        <FiCheck className="mr-1" />
                        {t("mark_completed")}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleUpdateStatus(transfer.id, "rejected")
                        }
                        className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        <FiX className="mr-1" />
                        {t("mark_rejected")}
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditTransfer(transfer)}
                    className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <FiEdit2 className="mr-1" />
                    {t("edit")}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Stock Transfer Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransfer(null);
          setNewTransfer({
            fromBranchId: "",
            toBranchId: "",
            productId: "",
            quantity: "",
          });
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white p-6 rounded-lg shadow-xl">
            <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              {editingTransfer ? t("edit_transfer") : t("add_transfer")}
            </Dialog.Title>
            <form onSubmit={handleAddOrEditTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("from_branch")}
                </label>
                <div className="relative">
                  <FiArrowLeft className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={newTransfer.fromBranchId}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        fromBranchId: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">{t("select_from_branch")}</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("to_branch")}
                </label>
                <div className="relative">
                  <FiArrowRight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={newTransfer.toBranchId}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        toBranchId: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">{t("select_to_branch")}</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("product")}
                </label>
                <div className="relative">
                  <FiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={newTransfer.productId}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        productId: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">{t("select_product")}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("quantity")}
                </label>
                <div className="relative">
                  <FiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={newTransfer.quantity}
                    onChange={(e) =>
                      setNewTransfer({
                        ...newTransfer,
                        quantity: e.target.value,
                      })
                    }
                    placeholder={t("quantity")}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransfer(null);
                    setNewTransfer({
                      fromBranchId: "",
                      toBranchId: "",
                      productId: "",
                      quantity: "",
                    });
                  }}
                  className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  <FiX className="mr-2" />
                  {t("cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  disabled={loading}
                >
                  <FiCheck className="mr-2" />
                  {editingTransfer ? t("update_transfer") : t("add_transfer")}
                </motion.button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default StockTransfersPage;
