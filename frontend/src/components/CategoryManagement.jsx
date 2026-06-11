import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from "react-icons/fi";
import AuthContext from "../context/AuthContext";

function CategoryManagement() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/products/categories");
      setCategories(res.data);
    } catch {
      toast.error(t("failed_to_fetch_categories"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditingCategory(null);
    setFormName("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error(t("category_name_required"));
      return;
    }
    try {
      if (editingCategory) {
        await axios.put(`/products/categories/${editingCategory.id}`, {
          name: formName.trim(),
        });
        toast.success(t("category_updated"));
      } else {
        await axios.post("/products/categories", {
          name: formName.trim(),
        });
        toast.success(t("category_added"));
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || t("failed_to_save_category"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("confirm_delete_category"))) return;
    try {
      await axios.delete(`/products/categories/${id}`);
      toast.success(t("category_deleted"));
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || t("failed_to_delete_category"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t("category_management")}
        </h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FiPlus />
          {t("add_category")}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                #
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                {t("category_name")}
              </th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center px-6 py-8 text-gray-400">
                  {t("no_categories_found")}
                </td>
              </tr>
            ) : (
              categories.map((cat, index) => (
                <tr
                  key={cat.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-800 dark:text-white">
                    {cat.name}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                      title={t("edit")}
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t("delete")}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editingCategory ? t("edit_category") : t("add_category")}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("category_name")}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t("enter_category_name")}
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FiSave />
                  {editingCategory ? t("update") : t("save")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;
