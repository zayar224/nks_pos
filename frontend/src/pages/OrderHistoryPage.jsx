// // src/pages/OrderHistoryPage.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";

function OrderHistoryPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    order_id: "",
    customer_id: "",
    store_id: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = new URLSearchParams();
      if (filters.order_id) params.append("order_id", filters.order_id);
      if (filters.customer_id)
        params.append("customer_id", filters.customer_id);
      if (filters.store_id) params.append("store_id", filters.store_id);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/history?${params.toString()}`,
        config
      );
      console.log("Orders response:", response.data); // Debug log
      setOrders(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching orders:", err); // Debug error
      setError(t("error_fetch_orders"));
      setOrders([]); // Ensure orders is reset on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t("order_history")}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <input
          type="text"
          name="order_id"
          value={filters.order_id}
          onChange={handleFilterChange}
          placeholder={t("filter_by_order_id")}
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          name="customer_id"
          value={filters.customer_id}
          onChange={handleFilterChange}
          placeholder={t("filter_by_customer_id")}
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          name="store_id"
          value={filters.store_id}
          onChange={handleFilterChange}
          placeholder={t("filter_by_store_id")}
          className="p-2 border rounded"
        />
      </div>
      {loading ? (
        <p>{t("loading")}</p>
      ) : orders.length === 0 ? (
        <p>{t("no_data")}</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">{t("order_id")}</th>
              <th className="border p-2">{t("customer")}</th>
              <th className="border p-2">{t("store")}</th>
              <th className="border p-2">{t("total")}</th>
              <th className="border p-2">{t("status")}</th>
              <th className="border p-2">{t("date")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border">
                <td className="border p-2">{order.id}</td>
                <td className="border p-2">{order.customer_name || "-"}</td>
                <td className="border p-2">{order.store_name}</td>
                <td className="border p-2">${order.total.toFixed(2)}</td>
                <td className="border p-2">{order.status}</td>
                <td className="border p-2">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OrderHistoryPage;

// src/pages/OrderHistoryPage.jsx
// import { useState, useEffect } from "react";
// import { useTranslation } from "react-i18next";
// import axios from "../api/axiosInstance";

// function OrderHistoryPage() {
//   const { t } = useTranslation();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const config = { headers: { Authorization: `Bearer ${token}` } };
//         const response = await axios.get(
//           `${import.meta.env.VITE_API_URL}/orders`,
//           config
//         );
//         setOrders(response.data);
//         setError("");
//       } catch (err) {
//         setError(
//           t("failed_to_fetch_orders", {
//             defaultValue: "Failed to fetch orders",
//           })
//         );
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchOrders();
//   }, []);

//   if (loading) return <p>{t("loading")}</p>;
//   if (error) return <p className="text-red-500">{error}</p>;

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">{t("order_history")}</h1>
//       {orders.length > 0 ? (
//         <table className="w-full border-collapse">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border p-2">{t("order_id")}</th>
//               <th className="border p-2">{t("date")}</th>
//               <th className="border p-2">{t("total")}</th>
//               <th className="border p-2">{t("status")}</th>
//             </tr>
//           </thead>
//           <tbody>
//             {orders.map((order) => (
//               <tr key={order.id} className="border">
//                 <td className="border p-2">{order.id}</td>
//                 <td className="border p-2">
//                   {new Date(order.created_at).toLocaleString()}
//                 </td>
//                 <td className="border p-2">${order.total.toFixed(2)}</td>
//                 <td className="border p-2">{order.status || "Completed"}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       ) : (
//         <p>{t("no_orders_found")}</p>
//       )}
//     </div>
//   );
// }

// export default OrderHistoryPage;
