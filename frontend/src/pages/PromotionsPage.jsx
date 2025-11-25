// src/pages/PromotionsPage.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiTrash2,
  FiPackage,
  FiX,
  FiCheck,
  FiPercent,
  FiDollarSign,
  FiTag,
} from "react-icons/fi";

function PromotionsPage() {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [newPromotion, setNewPromotion] = useState({
    name: "",
    type: "percentage",
    value: "",
    startDate: "",
    endDate: "",
    productIds: [],
    minPurchase: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, []);

  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get("/promotions", config);
      setPromotions(response.data);
      if (response.data.length === 0) {
        setError(t("no_promotions_found"));
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_fetch_promotions");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get("/products", config);
      setProducts(response.data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_fetch_products");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPromotion = async (e) => {
    e.preventDefault();
    if (newPromotion.productIds.length === 0) {
      toast.error(t("select_at_least_one_product"));
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        "/promotions",
        {
          ...newPromotion,
          value: parseFloat(newPromotion.value),
          minPurchase: parseFloat(newPromotion.minPurchase) || null,
          productIds: JSON.stringify(newPromotion.productIds),
          startDate: newPromotion.startDate || null,
          endDate: newPromotion.endDate || null,
        },
        config
      );
      fetchPromotions();
      setNewPromotion({
        name: "",
        type: "percentage",
        value: "",
        startDate: "",
        endDate: "",
        productIds: [],
        minPurchase: "",
      });
      setIsModalOpen(false);
      toast.success(t("promotion_added"));
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_add_promotion");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeletePromotion = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/promotions/${id}`, config);
      fetchPromotions();
      toast.success(t("promotion_deleted"));
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_delete_promotion");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleProductToggle = (productId) => {
    setNewPromotion((prev) => {
      const productIds = prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId];
      return { ...prev, productIds };
    });
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
        {t("manage_promotions")}
      </motion.h1>

      {error && !promotions.length && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md mb-6 text-sm transition-colors"
      >
        <FiPlus className="mr-2" />
        {t("add_promotion")}
      </motion.button>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("name")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("type")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("value")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("min_purchase")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("start_date")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("end_date")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promotions.map((promotion) => (
              <tr key={promotion.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {promotion.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {promotion.type}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {promotion.value}
                  {promotion.type === "percentage" ? "%" : "MMK"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  MMK{promotion.minPurchase?.toFixed(2) || t("na")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {promotion.startDate
                    ? new Date(promotion.startDate).toLocaleDateString()
                    : t("na")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {promotion.endDate
                    ? new Date(promotion.endDate).toLocaleDateString()
                    : t("na")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeletePromotion(promotion.id)}
                    className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <FiTrash2 className="mr-1" />
                    {t("delete")}
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {promotions.map((promotion) => (
          <motion.div
            key={promotion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("name")}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {promotion.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("type")}
                </span>
                <span className="text-sm text-gray-900 capitalize">
                  {promotion.type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("value")}
                </span>
                <span className="text-sm text-gray-900">
                  {promotion.value}
                  {promotion.type === "percentage" ? "%" : "MMK"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("min_purchase")}
                </span>
                <span className="text-sm text-gray-900">
                  ${promotion.minPurchase?.toFixed(2) || t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("start_date")}
                </span>
                <span className="text-sm text-gray-900">
                  {promotion.startDate
                    ? new Date(promotion.startDate).toLocaleDateString()
                    : t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("end_date")}
                </span>
                <span className="text-sm text-gray-900">
                  {promotion.endDate
                    ? new Date(promotion.endDate).toLocaleDateString()
                    : t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("actions")}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeletePromotion(promotion.id)}
                  className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                >
                  <FiTrash2 className="mr-1" />
                  {t("delete")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Promotion Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              {t("add_promotion")}
            </Dialog.Title>
            <form onSubmit={handleAddPromotion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("promotion_name")}
                </label>
                <div className="relative">
                  <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newPromotion.name}
                    onChange={(e) =>
                      setNewPromotion({ ...newPromotion, name: e.target.value })
                    }
                    placeholder={t("promotion_name")}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("type")}
                </label>
                <div className="relative">
                  <FiPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={newPromotion.type}
                    onChange={(e) =>
                      setNewPromotion({ ...newPromotion, type: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="percentage">{t("percentage")}</option>
                    <option value="fixed">{t("fixed")}</option>
                    <option value="bundle">{t("bundle")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("value")}
                </label>
                <div className="relative">
                  {newPromotion.type === "percentage" ? (
                    <FiPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  ) : (
                    <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  )}
                  <input
                    type="number"
                    value={newPromotion.value}
                    onChange={(e) =>
                      setNewPromotion({
                        ...newPromotion,
                        value: e.target.value,
                      })
                    }
                    placeholder={t("value")}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("start_date")}
                  </label>
                  <input
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(e) =>
                      setNewPromotion({
                        ...newPromotion,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1 mt-4 sm:mt-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("end_date")}
                  </label>
                  <input
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(e) =>
                      setNewPromotion({
                        ...newPromotion,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("min_purchase")}
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={newPromotion.minPurchase}
                    onChange={(e) =>
                      setNewPromotion({
                        ...newPromotion,
                        minPurchase: e.target.value,
                      })
                    }
                    placeholder={t("min_purchase")}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("select_products")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={newPromotion.productIds.includes(product.id)}
                        onChange={() => handleProductToggle(product.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                      />
                      <FiPackage className="mr-1 text-gray-500" />
                      {product.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  {t("add_promotion")}
                </motion.button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default PromotionsPage;
