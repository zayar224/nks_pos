// src/pages/AdminSettingsPage.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { motion } from "framer-motion";

function AdminSettingsPage() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState([]);
  const [stores, setStores] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [receiptSettings, setReceiptSettings] = useState([]);
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [newStore, setNewStore] = useState({
    name: "",
    branchId: "",
    address: "",
  });
  const [newTaxRate, setNewTaxRate] = useState({ name: "", rate: "" });
  const [newReceiptSetting, setNewReceiptSetting] = useState({
    storeId: "",
    logoUrl: "",
    headerText: "",
    footerText: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBranches();
    fetchStores();
    fetchTaxRates();
    fetchReceiptSettings();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/branches`,
        config
      );
      setBranches(response.data);
    } catch (err) {
      setError(t("failed_to_fetch_branches"));
    }
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/stores`,
        config
      );
      setStores(response.data);
    } catch (err) {
      setError(t("failed_to_fetch_stores"));
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxRates = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/tax-rates`,
        config
      );
      setTaxRates(response.data);
    } catch (err) {
      setError(t("failed_to_fetch_tax_rates"));
    }
  };

  const fetchReceiptSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/receipt-settings`,
        config
      );
      setReceiptSettings(response.data);
    } catch (err) {
      setError(t("failed_to_fetch_receipt_settings"));
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/branches`,
        newBranch,
        config
      );
      fetchBranches();
      setNewBranch({ name: "", address: "", phone: "" });
    } catch (err) {
      setError(t("failed_to_add_branch"));
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/stores`,
        { ...newStore, branch_id: newStore.branchId },
        config
      );
      fetchStores();
      setNewStore({ name: "", branchId: "", address: "" });
    } catch (err) {
      setError(t("failed_to_add_store"));
    }
  };

  const handleAddTaxRate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/tax-rates`,
        { ...newTaxRate, rate: parseFloat(newTaxRate.rate) },
        config
      );
      fetchTaxRates();
      setNewTaxRate({ name: "", rate: "" });
    } catch (err) {
      setError(t("failed_to_add_tax_rate"));
    }
  };

  const handleAddReceiptSetting = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/receipt-settings`,
        { ...newReceiptSetting, store_id: newReceiptSetting.storeId },
        config
      );
      fetchReceiptSettings();
      setNewReceiptSetting({
        storeId: "",
        logoUrl: "",
        headerText: "",
        footerText: "",
      });
    } catch (err) {
      setError(t("failed_to_add_receipt_setting"));
    }
  };

  const handleDeleteBranch = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/branches/${id}`,
        config
      );
      fetchBranches();
    } catch (err) {
      setError(t("failed_to_delete_branch"));
    }
  };

  const handleDeleteStore = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/stores/${id}`,
        config
      );
      fetchStores();
    } catch (err) {
      setError(t("failed_to_delete_store"));
    }
  };

  if (loading) return <p>{t("loading")}</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold mb-4"
      >
        {t("admin_settings")}
      </motion.h1>

      {/* Branch Management */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">{t("manage_branches")}</h2>
        <form onSubmit={handleAddBranch} className="mb-4 flex space-x-2">
          <input
            type="text"
            value={newBranch.name}
            onChange={(e) =>
              setNewBranch({ ...newBranch, name: e.target.value })
            }
            placeholder={t("branch_name")}
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            value={newBranch.address}
            onChange={(e) =>
              setNewBranch({ ...newBranch, address: e.target.value })
            }
            placeholder={t("address")}
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            value={newBranch.phone}
            onChange={(e) =>
              setNewBranch({ ...newBranch, phone: e.target.value })
            }
            placeholder={t("phone")}
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {t("add_branch")}
          </button>
        </form>
        <ul>
          {branches.map((branch) => (
            <li key={branch.id} className="mb-2 flex justify-between">
              <span>
                {branch.name} - {branch.address} - {branch.phone || "N/A"}
              </span>
              <button
                onClick={() => handleDeleteBranch(branch.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                {t("delete")}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Store Management */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">{t("manage_stores")}</h2>
        <form onSubmit={handleAddStore} className="mb-4 flex space-x-2">
          <input
            type="text"
            value={newStore.name}
            onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
            placeholder={t("store_name")}
            className="p-2 border rounded"
            required
          />
          <select
            value={newStore.branchId}
            onChange={(e) =>
              setNewStore({ ...newStore, branchId: e.target.value })
            }
            className="p-2 border rounded"
            required
          >
            <option value="">{t("select_branch")}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newStore.address}
            onChange={(e) =>
              setNewStore({ ...newStore, address: e.target.value })
            }
            placeholder={t("address")}
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {t("add_store")}
          </button>
        </form>
        <ul>
          {stores.map((store) => (
            <li key={store.id} className="mb-2 flex justify-between">
              <span>
                {store.name} - {store.address}
              </span>
              <button
                onClick={() => handleDeleteStore(store.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                {t("delete")}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tax Rate Management */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">{t("manage_tax_rates")}</h2>
        <form onSubmit={handleAddTaxRate} className="mb-4 flex space-x-2">
          <input
            type="text"
            value={newTaxRate.name}
            onChange={(e) =>
              setNewTaxRate({ ...newTaxRate, name: e.target.value })
            }
            placeholder={t("tax_rate_name")}
            className="p-2 border rounded"
            required
          />
          <input
            type="number"
            value={newTaxRate.rate}
            onChange={(e) =>
              setNewTaxRate({ ...newTaxRate, rate: e.target.value })
            }
            placeholder={t("tax_rate")}
            className="p-2 border rounded"
            step="0.01"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {t("add_tax_rate")}
          </button>
        </form>
        <ul>
          {taxRates.map((taxRate) => (
            <li key={taxRate.id} className="mb-2">
              {taxRate.name} - {taxRate.rate}%
            </li>
          ))}
        </ul>
      </div>

      {/* Receipt Settings Management */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">{t("manage_receipt_settings")}</h2>
        <form
          onSubmit={handleAddReceiptSetting}
          className="mb-4 flex space-x-2"
        >
          <select
            value={newReceiptSetting.storeId}
            onChange={(e) =>
              setNewReceiptSetting({
                ...newReceiptSetting,
                storeId: e.target.value,
              })
            }
            className="p-2 border rounded"
            required
          >
            <option value="">{t("select_store")}</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newReceiptSetting.logoUrl}
            onChange={(e) =>
              setNewReceiptSetting({
                ...newReceiptSetting,
                logoUrl: e.target.value,
              })
            }
            placeholder={t("logo_url")}
            className="p-2 border rounded"
          />
          <input
            type="text"
            value={newReceiptSetting.headerText}
            onChange={(e) =>
              setNewReceiptSetting({
                ...newReceiptSetting,
                headerText: e.target.value,
              })
            }
            placeholder={t("header_text")}
            className="p-2 border rounded"
          />
          <input
            type="text"
            value={newReceiptSetting.footerText}
            onChange={(e) =>
              setNewReceiptSetting({
                ...newReceiptSetting,
                footerText: e.target.value,
              })
            }
            placeholder={t("footer_text")}
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {t("add_receipt_setting")}
          </button>
        </form>
        <ul>
          {receiptSettings.map((setting) => (
            <li key={setting.id} className="mb-2">
              Store ID: {setting.store_id} - Logo: {setting.logo_url || "N/A"} -
              Header: {setting.header_text || "N/A"} - Footer:{" "}
              {setting.footer_text || "N/A"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AdminSettingsPage;
