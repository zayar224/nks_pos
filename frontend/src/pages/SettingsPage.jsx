// src/pages/SettingsPage.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";

function SettingsPage() {
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newCurrency, setNewCurrency] = useState({
    code: "",
    exchange_rate: 1,
  });
  const [newPaymentMethod, setNewPaymentMethod] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [currenciesRes, paymentMethodsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/currencies`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/payment-methods`, config),
        ]);
        setCurrencies(currenciesRes.data);
        setPaymentMethods(paymentMethodsRes.data);
      } catch (err) {
        setError(
          t("failed_to_fetch_settings", {
            defaultValue: "Failed to fetch settings",
          })
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleAddCurrency = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/currencies`,
        newCurrency,
        config
      );
      setCurrencies([...currencies, newCurrency]);
      setNewCurrency({ code: "", exchange_rate: 1 });
    } catch (err) {
      setError(
        t("failed_to_add_currency", { defaultValue: "Failed to add currency" })
      );
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/payment-methods`,
        newPaymentMethod,
        config
      );
      setPaymentMethods([...paymentMethods, newPaymentMethod]);
      setNewPaymentMethod({ name: "" });
    } catch (err) {
      setError(
        t("failed_to_add_payment_method", {
          defaultValue: "Failed to add payment method",
        })
      );
    }
  };

  if (loading) return <p>{t("loading")}</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t("settings")}</h1>
      <div className="mb-6">
        <h2 className="text-xl mb-2">{t("currencies")}</h2>
        <form onSubmit={handleAddCurrency} className="mb-4">
          <input
            type="text"
            value={newCurrency.code}
            onChange={(e) =>
              setNewCurrency({ ...newCurrency, code: e.target.value })
            }
            placeholder={t("currency_code")}
            className="p-2 border rounded mr-2"
            required
          />
          <input
            type="number"
            value={newCurrency.exchange_rate}
            onChange={(e) =>
              setNewCurrency({
                ...newCurrency,
                exchange_rate: parseFloat(e.target.value) || 1,
              })
            }
            placeholder={t("exchange_rate")}
            className="p-2 border rounded mr-2"
            step="0.01"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {t("add_currency")}
          </button>
        </form>
        <ul>
          {currencies.map((currency) => (
            <li key={currency.id} className="mb-2">
              {currency.code} - Rate: {currency.exchange_rate}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl mb-2">{t("payment_methods")}</h2>
        <form onSubmit={handleAddPaymentMethod} className="mb-4">
          <input
            type="text"
            value={newPaymentMethod.name}
            onChange={(e) => setNewPaymentMethod({ name: e.target.value })}
            placeholder={t("payment_method_name")}
            className="p-2 border rounded mr-2"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {t("add_payment_method")}
          </button>
        </form>
        <ul>
          {paymentMethods.map((method) => (
            <li key={method.id} className="mb-2">
              {method.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SettingsPage;
