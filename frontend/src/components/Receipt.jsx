import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiArrowLeft,
  FiPrinter,
  FiDollarSign,
  FiPackage,
} from "react-icons/fi";

function Receipt() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [cashierUsername, setCashierUsername] = useState("N/A");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrderAndUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch order
        const orderResponse = await axios.get(`/orders/${orderId}`, config);
        setOrder(orderResponse.data);

        // Fetch current user
        const userResponse = await axios.get("/auth/me", config);
        setCashierUsername(userResponse.data.user.username || "N/A");

        setError("");
      } catch (err) {
        const errorMessage =
          err.response?.data?.error || t("failed_to_fetch_data");
        setError(errorMessage);
        toast.error(errorMessage);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setCashierUsername("N/A");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrderAndUser();
  }, [orderId, t]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const voucherContent = document.getElementById("voucher").innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt Voucher #${order.id}</title>
          <style>
            @page {
              margin: 2mm 0;
              size: 80mm auto;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.3;
              color: #000;
              box-sizing: border-box;
              width: 80mm;
            }
            .receipt-container {
              width: 80mm;
              max-width: 80mm;
              padding: 5mm 3mm;
              box-sizing: border-box;
              background: white;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 3mm;
            }
            .store-name {
              font-size: 14px;
              font-weight: bold;
              margin: 0 0 2mm 0;
            }
            .store-details {
              font-size: 10px;
              margin: 1mm 0;
            }
            .receipt-title {
              font-size: 12px;
              font-weight: bold;
              margin: 2mm 0;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 3mm 0;
            }
            .receipt-details p {
              margin: 1mm 0;
              font-size: 10px;
            }
            .receipt-details .order-id {
              display: flex;
              justify-content: space-between;
            }
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
              margin: 3mm 0;
              font-size: 10px;
            }
            .receipt-table th,
            .receipt-table td {
              border: 1px solid #000;
              padding: 2mm 2mm;
              text-align: left;
              box-sizing: border-box;
            }
            .receipt-table th {
              font-weight: bold;
            }
            .receipt-table th:nth-child(1),
            .receipt-table td:nth-child(1) {
              width: 55%;
              word-break: break-word;
            }
            .receipt-table th:nth-child(2),
            .receipt-table td:nth-child(2) {
              width: 15%;
              text-align: center;
            }
            .receipt-table th:nth-child(3),
            .receipt-table td:nth-child(3) {
              width: 15%;
              text-align: right;
            }
            .receipt-table th:nth-child(4),
            .receipt-table td:nth-child(4) {
              width: 15%;
              text-align: right;
            }
            .receipt-totals {
              margin: 3mm 0;
            }
            .receipt-totals p {
              margin: 1mm 0;
              text-align: right;
              font-size: 10px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 3mm;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .receipt-footer p {
              margin: 1mm 0;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          ${voucherContent}
          <script>
            // Send ESC/POS paper cut command for thermal printers
            if (window?.print) {
              const cutCommand = "\\x1D\\x56\\x00";
              const encoder = new TextEncoder();
              const cutBytes = encoder.encode(cutCommand);
              try {
                navigator.serial?.getPorts().then(ports => {
                  if (ports.length > 0) {
                    ports[0].open({ baudRate: 9600 }).then(port => {
                      const writer = port.writable.getWriter();
                      writer.write(cutBytes);
                      writer.releaseLock();
                      port.close();
                    });
                  }
                });
              } catch (e) {
                console.log("Paper cut command failed:", e);
              }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mx-4 sm:mx-6">
        {error || t("order_not_found")}
      </div>
    );
  }

  const total = parseFloat(order.total);
  const discountAmount =
    order.discount > 0 ? (total * order.discount) / 100 : 0;
  const taxTotal = parseFloat(order.tax_total || 0);
  const subtotal = total - taxTotal;
  const finalTotal = subtotal * (1 - order.discount / 100) + taxTotal;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mx-4 sm:mx-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6 flex items-center"
      >
        <FiFileText className="mr-2 text-indigo-500" />
        {t("receipt")} #{order.id}
      </motion.h1>

      {/* Receipt Details */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center">
            <FiFileText className="mr-2 text-indigo-500" />
            <div>
              <span className="text-sm font-medium text-gray-500">
                {t("order_id")}
              </span>
              <p className="text-sm font-semibold text-gray-900">{order.id}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FiFileText className="mr-2 text-indigo-500" />
            <div>
              <span className="text-sm font-medium text-gray-500">
                {t("date")}
              </span>
              <p className="text-sm text-gray-900">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <FiFileText className="mr-2 text-indigo-500" />
            <div>
              <span className="text-sm font-medium text-gray-500">
                {t("store")}
              </span>
              <p className="text-sm text-gray-900">{order.store_name}</p>
            </div>
          </div>
          {order.customer_name && (
            <div className="flex items-center">
              <FiFileText className="mr-2 text-indigo-500" />
              <div>
                <span className="text-sm font-medium text-gray-500">
                  {t("customer")}
                </span>
                <p className="text-sm text-gray-900">{order.customer_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("item")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("quantity")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("price")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("total")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {order.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <FiPackage className="mr-2 text-indigo-500" />
                    {item.name}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.price.toFixed(2)} MMK
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {(
                    item.price *
                    item.quantity *
                    (1 - (item.discount || 0) / 100)
                  ).toFixed(2)}{" "}
                  MMK
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4 mb-6">
        {order.items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("item")}
                </span>
                <span className="text-sm font-semibold text-gray-900 flex items-center">
                  <FiPackage className="mr-1 text-indigo-500" />
                  {item.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("quantity")}
                </span>
                <span className="text-sm text-gray-900">{item.quantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("price")}
                </span>
                <span className="text-sm text-gray-900">
                  {item.price.toFixed(2)} MMK
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("total")}
                </span>
                <span className="text-sm text-gray-900">
                  {(
                    item.price *
                    item.quantity *
                    (1 - (item.discount || 0) / 100)
                  ).toFixed(2)}{" "}
                  MMK
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">
            {t("subtotal")}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {subtotal.toFixed(2)} MMK
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium text-green-600">
            {t("total_taxes")}
          </span>
          <span className="text-sm font-semibold text-green-600">
            {taxTotal.toFixed(2)} MMK
          </span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-gray-500">
              {t("discount")}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {discountAmount.toFixed(2)} MMK
            </span>
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium text-gray-500">
            {t("total")}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {finalTotal.toFixed(2)} MMK
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
          aria-label={t("back_to_dashboard")}
        >
          <FiArrowLeft className="mr-2" />
          {t("back_to_dashboard")}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrint}
          className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
          aria-label={t("print_receipt")}
        >
          <FiPrinter className="mr-2" />
          {t("print_receipt")}
        </motion.button>
      </div>

      {/* Print Receipt Voucher */}
      <div style={{ display: "none" }} id="voucher">
        <div className="receipt-container">
          <div className="receipt-header">
            <h2 className="store-name">{order.store_name}</h2>
            <p className="store-details">{order.address}</p>
            <p className="store-details">Phone: {order.phone}</p>
            <div className="separator"></div>
          </div>
          <div className="receipt-details">
            <p className="order-id">
              <span><strong>{t("order_id")}:</strong> {order.id}</span>
              <span><strong>{t("cashier")}:</strong> {cashierUsername}</span>
            </p>
            <p>
              <strong>{t("date")}:</strong>{" "}
              {new Date(order.created_at).toLocaleDateString()}
            </p>
            <p>
              <strong>{t("time")}:</strong>{" "}
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
            {order.customer_name && (
              <p>
                <strong>{t("customer")}:</strong> {order.customer_name}
              </p>
            )}
          </div>
          <div className="separator"></div>
          <table className="receipt-table">
            <thead>
              <tr>
                <th>{t("item")}</th>
                <th>{t("qty")}</th>
                <th>{t("price")}</th>
                <th>{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.price.toFixed(2)}</td>
                  <td>
                    {(
                      item.price *
                      item.quantity *
                      (1 - (item.discount || 0) / 100)
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="separator"></div>
          <div className="receipt-totals">
            <p>
              <strong>{t("subtotal")}:</strong> {subtotal.toFixed(2)}
            </p>
            <p>
              <strong>{t("total_taxes")}:</strong> {taxTotal.toFixed(2)}
            </p>
            {order.discount > 0 && (
              <p>
                <strong>{t("discount")}:</strong> {discountAmount.toFixed(2)}
              </p>
            )}
            <p>
              <strong>{t("total")}:</strong> {finalTotal.toFixed(2)}
            </p>
          </div>
          <div className="separator"></div>
          <div className="receipt-footer">
            <p>{t("thank_you")}</p>
            {/* <p>{t("return_policy")}</p> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Receipt;