// src/pages/ReportsPage.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";

function ReportsPage() {
  const { t } = useTranslation();
  const [report, setReport] = useState({ totalSales: 0, orderCount: 0 });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/report?${params.toString()}`,
        config
      );
      setReport(response.data);
      setError("");
    } catch (err) {
      setError(t("failed_to_fetch_report"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>{t("loading")}</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t("reports")}</h1>
      <div className="mb-4">
        <label className="block mb-2">{t("start_date")}</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 border rounded mr-2"
        />
        <label className="block mb-2">{t("end_date")}</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      <div>
        <p>
          <strong>{t("total_sales")}: </strong>${report.totalSales.toFixed(2)}
        </p>
        <p>
          <strong>{t("order_count")}: </strong>
          {report.orderCount}
        </p>
      </div>
    </div>
  );
}

export default ReportsPage;
