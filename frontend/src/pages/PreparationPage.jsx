// src/pages/PreparationPage.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";

function PreparationPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/orders/pending`,
          config
        );
        setOrders(response.data);
        setError("");
      } catch (err) {
        setError(
          t("failed_to_fetch_orders", {
            defaultValue: "Failed to fetch orders",
          })
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const markAsPrepared = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/orders/${orderId}/status`,
        { status: "prepared" },
        config
      );
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: "prepared" } : order
        )
      );
    } catch (err) {
      setError(
        t("failed_to_update_order", {
          defaultValue: "Failed to update order status",
        })
      );
    }
  };

  if (loading) return <p>{t("loading")}</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t("preparation")}</h1>
      {orders.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">{t("order_id")}</th>
              <th className="border p-2">{t("date")}</th>
              <th className="border p-2">{t("total")}</th>
              <th className="border p-2">{t("status")}</th>
              <th className="border p-2">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border">
                <td className="border p-2">{order.id}</td>
                <td className="border p-2">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="border p-2">${order.total.toFixed(2)}</td>
                <td className="border p-2">{order.status || "pending"}</td>
                <td className="border p-2">
                  <button
                    onClick={() => markAsPrepared(order.id)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                    disabled={order.status === "prepared"}
                  >
                    {t("mark_prepared")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>{t("no_pending_orders")}</p>
      )}
    </div>
  );
}

export default PreparationPage;
