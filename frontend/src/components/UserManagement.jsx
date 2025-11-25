// src/components/UserManagement.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMail,
  FiLock,
  FiKey,
  FiHome,
  FiMapPin,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiEdit,
} from "react-icons/fi";

function UserManagementPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "cashier",
    shop_id: "",
    branch_id: "",
  });
  const [editUser, setEditUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get("/auth/me");
        setCurrentUser(userResponse.data.user);

        if (
          userResponse.data.user.role === "admin" &&
          !userResponse.data.user.branch_id
        ) {
          const shopsResponse = await axios.get("/shops");
          setShops(shopsResponse.data);
          if (shopsResponse.data.length > 0) {
            setNewUser((prev) => ({
              ...prev,
              shop_id: shopsResponse.data[0].id,
            }));
          }
        } else {
          setNewUser((prev) => ({
            ...prev,
            shop_id: userResponse.data.user.shop_id,
          }));
        }

        const usersResponse = await axios.get("/auth/users");
        setUsers(usersResponse.data);
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || t("failed_to_fetch_users");
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (
      !newUser.username ||
      !newUser.email ||
      !newUser.password ||
      !newUser.role ||
      !newUser.shop_id
    ) {
      const errorMsg = t("required_fields_missing");
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const userData = {
        ...newUser,
        shop_id: parseInt(newUser.shop_id),
        branch_id: newUser.branch_id ? parseInt(newUser.branch_id) : null,
      };

      const response = await axios.post("/auth/users", userData);
      setUsers([...users, response.data]);
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "cashier",
        shop_id:
          currentUser?.role === "admin" &&
          !currentUser?.branch_id &&
          shops.length > 0
            ? shops[0].id
            : currentUser?.shop_id || "",
        branch_id: "",
      });
      toast.success(t("user_added"));
    } catch (err) {
      const errorMsg = err.response?.data?.error || t("failed_to_add_user");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEditUser = (user) => {
    setEditUser({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      shop_id: user.shop_id,
      branch_id: user.branch_id || "",
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser.username || !editUser.email || !editUser.role) {
      const errorMsg = t("required_fields_missing");
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const userData = {
        username: editUser.username,
        email: editUser.email,
        role: editUser.role,
        shop_id: parseInt(editUser.shop_id),
        branch_id: editUser.branch_id ? parseInt(editUser.branch_id) : null,
      };

      // Use /auth/users/:id for editing other users, /auth/me for the current user
      const endpoint =
        editUser.id === currentUser.id
          ? "/auth/me"
          : `/auth/users/${editUser.id}`;
      const response = await axios.put(endpoint, userData);

      const updatedUsers = users.map((user) =>
        user.id === editUser.id ? { ...user, ...response.data } : user
      );
      setUsers(updatedUsers);
      setEditUser(null);
      toast.success(t("user_updated"));
    } catch (err) {
      const errorMsg = err.response?.data?.error || t("failed_to_update_user");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm(t("confirm_delete_user"))) return;
    try {
      await axios.delete(`/auth/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
      toast.success(t("user_deleted"));
    } catch (err) {
      const errorMsg = err.response?.data?.error || t("failed_to_delete_user");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const isAdmin = currentUser?.role === "admin";

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t("users")}</h1>

      {isAdmin && (
        <form
          onSubmit={handleAddUser}
          className="mb-8 bg-gray-50 p-4 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("username")}
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder={t("username")}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("email")}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder={t("email")}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("password")}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder={t("password")}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("role")}
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="cashier">{t("cashier")}</option>
                  <option value="manager">{t("manager")}</option>
                  <option value="admin">{t("admin")}</option>
                  <option value="shop_owner">{t("shop_owner")}</option>
                </select>
              </div>
            </div>

            {currentUser?.role === "admin" && !currentUser?.branch_id ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("shop")}
                </label>
                <div className="relative">
                  <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={newUser.shop_id}
                    onChange={(e) =>
                      setNewUser({ ...newUser, shop_id: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">{t("select_shop")}</option>
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name || `Shop ${shop.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("shop_id")}
                </label>
                <input
                  type="text"
                  value={newUser.shop_id}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("branch_id")}
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={newUser.branch_id}
                  onChange={(e) =>
                    setNewUser({ ...newUser, branch_id: e.target.value || "" })
                  }
                  placeholder={t("branch_id")}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
            disabled={loading || !currentUser}
          >
            <FiPlus className="mr-2" />
            {t("add_user")}
          </button>
        </form>
      )}

      {editUser && isAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t("edit_user")}</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("username")}
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={editUser.username}
                      onChange={(e) =>
                        setEditUser({ ...editUser, username: e.target.value })
                      }
                      placeholder={t("username")}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("email")}
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) =>
                        setEditUser({ ...editUser, email: e.target.value })
                      }
                      placeholder={t("email")}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("role")}
                  </label>
                  <div className="relative">
                    <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={editUser.role}
                      onChange={(e) =>
                        setEditUser({ ...editUser, role: e.target.value })
                      }
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="cashier">{t("cashier")}</option>
                      <option value="manager">{t("manager")}</option>
                      <option value="admin">{t("admin")}</option>
                      <option value="shop_owner">{t("shop_owner")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("shop_id")}
                  </label>
                  <div className="relative">
                    <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={editUser.shop_id}
                      onChange={(e) =>
                        setEditUser({ ...editUser, shop_id: e.target.value })
                      }
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={
                        currentUser?.role !== "admin" || currentUser?.branch_id
                      }
                    >
                      <option value="">{t("select_shop")}</option>
                      {shops.map((shop) => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name || `Shop ${shop.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("branch_id")}
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={editUser.branch_id}
                      onChange={(e) =>
                        setEditUser({
                          ...editUser,
                          branch_id: e.target.value || "",
                        })
                      }
                      placeholder={t("branch_id")}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <FiCheck className="mr-2" />
                  {t("update_user")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>{t("no_users_found")}</p>
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
                  {t("username")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("email")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("role")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("shop_id")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("branch_id")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.shop_id || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.branch_id || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={loading}
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                        >
                          <FiTrash2 />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
