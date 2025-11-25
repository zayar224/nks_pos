// src/components/BranchManagement.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck } from "react-icons/fi";

function BranchManagementPage() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [editingBranch, setEditingBranch] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get("/auth/me");
        const user = userResponse.data.user;
        setCurrentUser(user);

        if (user.role !== "admin") {
          setError(t("access_denied"));
          toast.error(t("access_denied"));
          setLoading(false);
          return;
        }

        const branchesResponse = await axios.get("/branches");
        setBranches(branchesResponse.data);
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || t("failed_to_fetch_branches");
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const handleSubmitBranch = async (e) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.address || !newBranch.phone) {
      const errorMsg = t("required_fields_missing");
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      if (editingBranch) {
        const response = await axios.put(
          `/branches/${editingBranch.id}`,
          newBranch
        );
        setBranches(
          branches.map((branch) =>
            branch.id === editingBranch.id
              ? { ...branch, ...newBranch }
              : branch
          )
        );
        setEditingBranch(null);
        toast.success(t("branch_updated"));
      } else {
        const response = await axios.post("/branches", newBranch);
        setBranches([
          ...branches,
          { id: response.data.id, ...newBranch, shop_id: currentUser.shop_id },
        ]);
        toast.success(t("branch_added"));
      }

      setNewBranch({ name: "", address: "", phone: "" });
      setError("");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        t(editingBranch ? "failed_to_update_branch" : "failed_to_add_branch");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setNewBranch({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
    });
  };

  const handleDeleteBranch = async (id) => {
    if (!confirm(t("confirm_delete_branch"))) return;
    try {
      await axios.delete(`/branches/${id}`);
      setBranches(branches.filter((branch) => branch.id !== id));
      toast.success(t("branch_deleted"));
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || t("failed_to_delete_branch");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleCancelEdit = () => {
    setEditingBranch(null);
    setNewBranch({ name: "", address: "", phone: "" });
    setError("");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        {error}
      </div>
    );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {t("branches")}
        </h1>

        {/* Branch Form */}
        <form
          onSubmit={handleSubmitBranch}
          className="mb-8 bg-gray-50 p-4 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("branch_name")}
              </label>
              <input
                type="text"
                value={newBranch.name}
                onChange={(e) =>
                  setNewBranch({ ...newBranch, name: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("address")}
              </label>
              <input
                type="text"
                value={newBranch.address}
                onChange={(e) =>
                  setNewBranch({ ...newBranch, address: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("phone")}
              </label>
              <input
                type="text"
                value={newBranch.phone}
                onChange={(e) =>
                  setNewBranch({ ...newBranch, phone: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
              disabled={loading || !currentUser}
            >
              <FiCheck className="mr-2" />
              {editingBranch ? t("update_branch") : t("add_branch")}
            </button>
            {editingBranch && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                <FiX className="mr-2" />
                {t("cancel")}
              </button>
            )}
          </div>
        </form>

        {/* Branches Table */}
        {branches.length === 0 ? (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
            <p>{t("no_branches_found")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("id")}
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
                    {t("shop_id")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.shop_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditBranch(branch)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={loading}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchManagementPage;
