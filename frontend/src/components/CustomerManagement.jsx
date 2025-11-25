// src/components/CustomerManagement.jsx

import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiX,
  FiCheck,
  FiUser,
  FiMail,
  FiPhone,
  FiAward,
  FiDollarSign,
} from "react-icons/fi";

function CustomerManagement() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    loyalty_points: 0,
    ewallet_balance: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError(t("failed_to_fetch_customers"));
      toast.error(t("failed_to_fetch_customers"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdateCustomer = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customerData = {
        ...newCustomer,
        loyalty_points: parseInt(newCustomer.loyalty_points) || 0,
        ewallet_balance: parseFloat(newCustomer.ewallet_balance) || 0,
      };
      let res;
      if (editCustomer) {
        res = await axios.put(`/customers/${editCustomer.id}`, customerData);
        setCustomers(
          customers.map((c) => (c.id === editCustomer.id ? res.data : c))
        );
        toast.success(t("customer_updated"));
      } else {
        res = await axios.post("/customers", customerData);
        setCustomers([...customers, res.data]);
        toast.success(t("customer_added"));
      }
      setIsOpen(false);
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        loyalty_points: 0,
        ewallet_balance: 0,
      });
      setEditCustomer(null);
    } catch (err) {
      console.error("Failed to save customer:", err);
      const errorMsg =
        err.response?.data?.error || t("failed_to_save_customer");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setNewCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      loyalty_points: customer.loyalty_points || 0,
      ewallet_balance: customer.ewallet_balance || 0,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(t("confirm_delete_customer"))) return;
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`/customers/${id}`);
      setCustomers(customers.filter((c) => c.id !== id));
      toast.success(t("customer_deleted"));
    } catch (err) {
      console.error("Failed to delete customer:", err);
      const errorMsg =
        err.response?.data?.error || t("failed_to_delete_customer");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("customer_management")}
        </h2>
        <button
          onClick={() => {
            setEditCustomer(null);
            setNewCustomer({
              name: "",
              email: "",
              phone: "",
              loyalty_points: 0,
              ewallet_balance: 0,
            });
            setIsOpen(true);
          }}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors mt-4 md:mt-0"
          disabled={isLoading}
        >
          <FiPlus className="mr-2" />
          {t("add_customer")}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {!isLoading && customers.length === 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>{t("no_customers_found")}</p>
        </div>
      )}

      {!isLoading && customers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("email")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("phone")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("loyalty_points")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("ewallet_balance")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.phone || t("na")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {customer.loyalty_points || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    $
                    {isNaN(customer.ewallet_balance)
                      ? "0.00"
                      : Number(customer.ewallet_balance).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-indigo-600 hover:text-indigo-900"
                        disabled={isLoading}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isLoading}
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

      {/* Customer Modal */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg md:max-w-md rounded-lg bg-white p-4 sm:p-6 shadow-xl">
            <div className="flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <Dialog.Title className="text-xl font-bold text-gray-800 mb-4">
              {editCustomer ? t("edit_customer") : t("add_customer")}
            </Dialog.Title>

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
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("name")}
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
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
                    placeholder={t("email")}
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
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
                    type="text"
                    placeholder={t("phone")}
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("loyalty_points")}
                </label>
                <div className="relative">
                  <FiAward className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder={t("loyalty_points")}
                    value={newCustomer.loyalty_points}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        loyalty_points: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("ewallet_balance")}
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder={t("ewallet_balance")}
                    value={newCustomer.ewallet_balance}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        ewallet_balance: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAddOrUpdateCustomer}
                className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isLoading}
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
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    {editCustomer ? t("update_customer") : t("add_customer")}
                  </>
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default CustomerManagement;
