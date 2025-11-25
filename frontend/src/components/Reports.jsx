// src/components/Reports.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";

function Reports() {
  const { t } = useTranslation();
  const [reportData, setReportData] = useState({
    totalSales: 0,
    orderCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get("/orders/report/ordertotal");
        setReportData(response.data);
        setError("");
      } catch (err) {
        setError(t("failed_to_fetch_report", { defaultValue: err.message }));
        console.error("Report fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [t]);

  if (loading) return <p className="text-center">{t("loading")}</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{t("reports")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">{t("total_sales")}</h3>
          <p className="text-2xl">${reportData.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">{t("order_count")}</h3>
          <p className="text-2xl">{reportData.orderCount}</p>
        </div>
      </div>
    </div>
  );
}

export default Reports;
