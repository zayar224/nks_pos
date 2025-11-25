// src/pages/LoyaltyTiersPage.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiTrash2,
  FiStar,
  FiX,
  FiCheck,
  FiAward,
  FiEdit2,
} from "react-icons/fi";

function LoyaltyTiersPage() {
  const { t } = useTranslation();
  const [loyaltyTiers, setLoyaltyTiers] = useState([]);
  const [newTier, setNewTier] = useState({
    name: "",
    minPoints: "",
    pointMultiplier: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);

  useEffect(() => {
    fetchLoyaltyTiers();
  }, []);

  const fetchLoyaltyTiers = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get("/loyalty-tiers", config);
      setLoyaltyTiers(response.data);
      if (response.data.length === 0) {
        setError(t("no_loyalty_tiers_found"));
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_fetch_loyalty_tiers");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEditTier = async (e) => {
    e.preventDefault();
    const minPoints = parseInt(newTier.minPoints);
    const pointMultiplier = parseFloat(newTier.pointMultiplier);

    // Validate inputs
    if (!newTier.name || isNaN(minPoints) || minPoints < 0) {
      const errorMessage = t("invalid_min_points");
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    if (isNaN(pointMultiplier) || pointMultiplier <= 0) {
      const errorMessage = t("invalid_point_multiplier");
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingTier) {
        await axios.put(
          `/loyalty-tiers/${editingTier.id}`,
          {
            name: newTier.name,
            min_points: minPoints,
            point_multiplier: pointMultiplier,
          },
          config
        );
        toast.success(t("loyalty_tier_updated"));
      } else {
        await axios.post(
          "/loyalty-tiers",
          {
            name: newTier.name,
            min_points: minPoints,
            point_multiplier: pointMultiplier,
          },
          config
        );
        toast.success(t("loyalty_tier_added"));
      }
      fetchLoyaltyTiers();
      setNewTier({ name: "", minPoints: "", pointMultiplier: "" });
      setEditingTier(null);
      setIsModalOpen(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        (editingTier
          ? t("failed_to_update_loyalty_tier")
          : t("failed_to_add_loyalty_tier"));
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteTier = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/loyalty-tiers/${id}`, config);
      fetchLoyaltyTiers();
      toast.success(t("loyalty_tier_deleted"));
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_delete_loyalty_tier");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditTier = (tier) => {
    setNewTier({
      name: tier.name,
      minPoints: tier.min_points,
      pointMultiplier: tier.point_multiplier,
    });
    setEditingTier(tier);
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
        {t("manage_loyalty_tiers")}
      </motion.h1>

      {error && !loyaltyTiers.length && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setNewTier({ name: "", minPoints: "", pointMultiplier: "" });
          setEditingTier(null);
          setIsModalOpen(true);
        }}
        className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md mb-6 text-sm transition-colors"
      >
        <FiPlus className="mr-2" />
        {t("add_loyalty_tier")}
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
                {t("min_points")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("point_multiplier")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loyaltyTiers.map((tier) => (
              <tr key={tier.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <FiAward className="mr-2 text-indigo-500" />
                    {tier.name}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {tier.min_points}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {tier.point_multiplier.toFixed(2)}x
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditTier(tier)}
                    className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <FiEdit2 className="mr-1" />
                    {t("edit")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteTier(tier.id)}
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
        {loyaltyTiers.map((tier) => (
          <motion.div
            key={tier.id}
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
                <span className="text-sm font-semibold text-gray-900 flex items-center">
                  <FiAward className="mr-1 text-indigo-500" />
                  {tier.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("min_points")}
                </span>
                <span className="text-sm text-gray-900">{tier.min_points}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("point_multiplier")}
                </span>
                <span className="text-sm text-gray-900">
                  {tier.point_multiplier.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("actions")}
                </span>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditTier(tier)}
                    className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <FiEdit2 className="mr-1" />
                    {t("edit")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteTier(tier.id)}
                    className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <FiTrash2 className="mr-1" />
                    {t("delete")}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Loyalty Tier Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTier(null);
          setNewTier({ name: "", minPoints: "", pointMultiplier: "" });
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white p-6 rounded-lg shadow-xl">
            <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              {editingTier ? t("edit_loyalty_tier") : t("add_loyalty_tier")}
            </Dialog.Title>
            <form onSubmit={handleAddOrEditTier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tier_name")}
                </label>
                <div className="relative">
                  <FiAward className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newTier.name}
                    onChange={(e) =>
                      setNewTier({ ...newTier, name: e.target.value })
                    }
                    placeholder={t("tier_name")}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("min_points")}
                </label>
                <div className="relative">
                  <FiStar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={newTier.minPoints}
                    onChange={(e) =>
                      setNewTier({ ...newTier, minPoints: e.target.value })
                    }
                    placeholder={t("min_points")}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("point_multiplier")}
                </label>
                <div className="relative">
                  <FiStar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={newTier.pointMultiplier}
                    onChange={(e) =>
                      setNewTier({
                        ...newTier,
                        pointMultiplier: e.target.value,
                      })
                    }
                    placeholder={t("point_multiplier")}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    step="0.01"
                    min="0.01"
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
                    setEditingTier(null);
                    setNewTier({
                      name: "",
                      minPoints: "",
                      pointMultiplier: "",
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
                  {editingTier ? t("update_tier") : t("add_loyalty_tier")}
                </motion.button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default LoyaltyTiersPage;
