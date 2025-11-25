//  src/components/ShopManagement.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiShoppingBag,
  FiMapPin,
  FiPhone,
  FiImage,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
} from "react-icons/fi";

function ShopManagement() {
  const { t } = useTranslation();
  const [shops, setShops] = useState([]);
  const [newShop, setNewShop] = useState({
    name: "",
    address: "",
    phone: "",
    logo: null,
  });
  const [editShop, setEditShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fetchShops = async () => {
    try {
      const response = await axios.get("/shops/");
      setShops(response.data);
      setError("");
    } catch (err) {
      const errorMsg = err.response?.data?.error || t("failed_to_fetch_shops");
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Shop fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [t]);

  const validateFile = (file) => {
    if (!file) return true;
    const filetypes = /jpeg|jpg|png/;
    const isValidType = filetypes.test(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
    if (!isValidType) {
      toast.error(t("invalid_file_type"));
      return false;
    }
    if (!isValidSize) {
      toast.error(t("file_too_large"));
      return false;
    }
    return true;
  };

  const handleAddOrUpdateShop = async () => {
    const shopData = editShop || newShop;
    if (!shopData.name || !shopData.address || !shopData.phone) {
      const errorMsg = t("required_fields_missing");
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const formData = new FormData();
    formData.append("name", shopData.name);
    formData.append("address", shopData.address);
    formData.append("phone", shopData.phone);
    if (shopData.logo) {
      formData.append("logo", shopData.logo);
    } else if (editShop && editShop.logo_url) {
      formData.append("logo_url", editShop.logo_url);
    }

    setLoading(true);
    setError(null);
    try {
      let response;
      if (editShop) {
        response = await axios.put(`/shops/${editShop.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setShops(shops.map((s) => (s.id === editShop.id ? response.data : s)));
        toast.success(t("shop_updated"));
      } else {
        response = await axios.post("/shops/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setShops([...shops, response.data]);
        toast.success(t("shop_added"));
      }
      setIsModalOpen(false);
      setNewShop({ name: "", address: "", phone: "", logo: null });
      setEditShop(null);
      setImagePreview(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || t("failed_to_save_shop");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async (id) => {
    if (!confirm(t("confirm_delete_shop"))) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/shops/${id}`);
      setShops(shops.filter((shop) => shop.id !== id));
      toast.success(t("shop_deleted"));
    } catch (err) {
      const errorMsg = err.response?.data?.error || t("failed_to_delete_shop");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (shop = null) => {
    if (shop) {
      setEditShop({ ...shop, logo: null });
      setImagePreview(shop.logo_url || null);
    } else {
      setEditShop(null);
      setNewShop({ name: "", address: "", phone: "", logo: null });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold text-gray-800 mb-6"
      >
        {t("shop_management")}
      </motion.h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{t("shops")}</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors mt-4 md:mt-0"
          disabled={loading}
        >
          <FiPlus className="mr-2" />
          {t("add_shop")}
        </motion.button>
      </div>

      {shops.length === 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>{t("no_shops_found")}</p>
        </div>
      )}

      {shops.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("logo")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("address")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("phone")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("product_count")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {shop.logo_url ? (
                      <img
                        src={`http://localhost:5200${shop.logo_url}`}
                        alt={shop.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={() => toast.error(t("failed_to_load_image"))}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <FiImage className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {shop.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.product_count || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <div className="flex justify-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal(shop)}
                        className="text-indigo-600 hover:text-indigo-900"
                        disabled={loading}
                      >
                        <FiEdit />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteShop(shop.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={loading}
                      >
                        <FiTrash2 />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Shop Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-800">
                {editShop ? t("edit_shop") : t("add_shop")}
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("name")}
                </label>
                <div className="relative">
                  <FiShoppingBag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("name")}
                    value={editShop ? editShop.name : newShop.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editShop) {
                        setEditShop({ ...editShop, name: value });
                      } else {
                        setNewShop({ ...newShop, name: value });
                      }
                    }}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("address")}
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("address")}
                    value={editShop ? editShop.address : newShop.address}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editShop) {
                        setEditShop({ ...editShop, address: value });
                      } else {
                        setNewShop({ ...newShop, address: value });
                      }
                    }}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("phone")}
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    placeholder={t("phone")}
                    value={editShop ? editShop.phone : newShop.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editShop) {
                        setEditShop({ ...editShop, phone: value });
                      } else {
                        setNewShop({ ...newShop, phone: value });
                      }
                    }}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("logo")}
                </label>
                <div className="relative">
                  <FiImage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && validateFile(file)) {
                        if (editShop) {
                          setEditShop({ ...editShop, logo: file });
                        } else {
                          setNewShop({ ...newShop, logo: file });
                        }
                        setImagePreview(URL.createObjectURL(file));
                      } else {
                        if (editShop) {
                          setEditShop({ ...editShop, logo: null });
                        } else {
                          setNewShop({ ...newShop, logo: null });
                        }
                        setImagePreview(null);
                        e.target.value = null;
                      }
                    }}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(false)}
                className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                disabled={loading}
              >
                <FiX className="mr-2" />
                {t("cancel")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddOrUpdateShop}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                disabled={loading}
              >
                {loading ? (
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
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    {editShop ? t("update_shop") : t("add_shop")}
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

export default ShopManagement;
