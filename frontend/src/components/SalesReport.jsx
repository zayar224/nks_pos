import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  FiCalendar,
  FiFilter,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiDownload,
} from "react-icons/fi";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function SalesReport() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zeroCostWarning, setZeroCostWarning] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({
    branch_id: "",
    start_date: "",
    end_date: "",
    category_id: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [ordersRes, branchesRes, categoriesRes] = await Promise.all([
          axios.get("/orders?status=completed&page=1&limit=50"),
          axios.get("/branches"),
          axios.get("/products/categories"),
        ]);
        setOrders(ordersRes.data.orders);
        setBranches(branchesRes.data);
        setCategories(categoriesRes.data);
        setPagination({
          page: ordersRes.data.pagination.page,
          totalPages: ordersRes.data.pagination.totalPages,
        });
        const hasZeroCost = ordersRes.data.orders.some((order) =>
          order.order_items.some((item) => item.original_price === 0)
        );
        setZeroCostWarning(hasZeroCost);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        const errorMsg = err.response
          ? t("failed_to_load_data") + `: ${err.response.data.error}`
          : t("network_error");
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const applyFilters = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: "completed",
        page,
        limit: "50",
      });
      if (filters.branch_id) params.append("branch_id", filters.branch_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.category_id)
        params.append("category_id", filters.category_id);
      const ordersRes = await axios.get(`/orders?${params.toString()}`);
      setOrders(ordersRes.data.orders);
      setPagination({
        page: ordersRes.data.pagination.page,
        totalPages: ordersRes.data.pagination.totalPages,
      });
      const hasZeroCost = ordersRes.data.orders.some((order) =>
        order.order_items.some((item) => item.original_price === 0)
      );
      setZeroCostWarning(hasZeroCost);
      setIsFilterOpen(false);
      toast.success(t("filters_applied"));
    } catch (err) {
      console.error("Failed to apply filters:", err);
      const errorMsg = err.response
        ? t("failed_to_apply_filters") + `: ${err.response.data.error}`
        : t("network_error");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      branch_id: "",
      start_date: "",
      end_date: "",
      category_id: "",
    });
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const ordersRes = await axios.get(
          "/orders?status=completed&page=1&limit=50"
        );
        setOrders(ordersRes.data.orders);
        setPagination({
          page: ordersRes.data.pagination.page,
          totalPages: ordersRes.data.pagination.totalPages,
        });
        const hasZeroCost = ordersRes.data.orders.some((order) =>
          order.order_items.some((item) => item.original_price === 0)
        );
        setZeroCostWarning(hasZeroCost);
        toast.success(t("filters_cleared"));
      } catch (err) {
        console.error("Failed to clear filters:", err);
        const errorMsg = err.response
          ? t("failed_to_load_data") + `: ${err.response.data.error}`
          : t("network_error");
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  };

  const calculateMetrics = () => {
    const metrics = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalUnitsSold: 0,
      totalDiscounts: 0,
      totalTaxes: 0,
      products: {},
    };

    orders.forEach((order) => {
      if (order.is_refunded) return; // Skip refunded orders
      const orderDiscount = parseFloat(order.discount || 0);
      const orderTax = parseFloat(order.tax_total || 0);
      let orderRevenue = 0;
      let orderCost = 0;

      order.order_items.forEach((item) => {
        const revenue = item.quantity * item.price - (item.discount || 0);
        const cost = item.quantity * item.original_price;
        orderRevenue += revenue;
        orderCost += cost;

        if (!metrics.products[item.product_id]) {
          metrics.products[item.product_id] = {
            name: item.name,
            category_name: item.category_name || "Uncategorized",
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            discounts: 0,
            taxes: 0,
          };
        }
        metrics.products[item.product_id].unitsSold += item.quantity;
        metrics.products[item.product_id].revenue += revenue;
        metrics.products[item.product_id].cost += cost;
        metrics.products[item.product_id].profit += revenue - cost;
        metrics.products[item.product_id].discounts += item.discount || 0;
        metrics.products[item.product_id].taxes +=
          order.total > 0 ? (revenue * orderTax) / order.total : 0;
      });

      metrics.totalRevenue += orderRevenue;
      metrics.totalCost += orderCost;
      metrics.totalProfit += orderRevenue - orderCost - orderTax;
      metrics.totalUnitsSold += order.order_items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      metrics.totalDiscounts +=
        orderDiscount +
        order.order_items.reduce((sum, item) => sum + (item.discount || 0), 0);
      metrics.totalTaxes += orderTax;
    });

    return metrics;
  };

  const exportToCSV = () => {
    const metrics = calculateMetrics();
    const headers = [
      t("product_name"),
      t("category"),
      t("units_sold"),
      t("revenue") + " (MMK)",
      t("cost") + " (MMK)",
      t("profit") + " (MMK)",
      t("discounts") + " (MMK)",
      t("taxes") + " (MMK)",
    ];
    const rows = Object.values(metrics.products).map((product) => [
      product.name,
      product.category_name,
      product.unitsSold,
      product.revenue.toFixed(2),
      product.cost.toFixed(2),
      product.profit.toFixed(2),
      product.discounts.toFixed(2),
      product.taxes.toFixed(2),
    ]);
    const summary = [
      [
        "Summary",
        "",
        metrics.totalUnitsSold,
        metrics.totalRevenue.toFixed(2),
        metrics.totalCost.toFixed(2),
        metrics.totalProfit.toFixed(2),
        metrics.totalDiscounts.toFixed(2),
        metrics.totalTaxes.toFixed(2),
      ],
    ];
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "",
      ...summary.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    toast.success(t("csv_exported"));
  };

  const metrics = calculateMetrics();

  // Chart data
  const chartData = {
    labels: Object.values(metrics.products).map((product) => product.name),
    datasets: [
      {
        label: t("revenue") + " (MMK)",
        data: Object.values(metrics.products).map((product) => product.revenue),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: t("revenue_by_product") },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: t("revenue") + " (MMK)" },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {t("sales_report")}
      </h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {zeroCostWarning && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 flex items-center">
          <FiAlertTriangle className="mr-2" />
          {t("zero_cost_warning")}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Filters and Export Buttons */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {t("overview")}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={exportToCSV}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isLoading}
              >
                <FiDownload className="mr-2" />
                {t("export_csv")}
              </button>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isLoading}
              >
                <FiFilter className="mr-2" />
                {t("filter_report")}
              </button>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">
                {t("total_revenue")}
              </h4>
              <p className="text-2xl font-bold text-blue-600">
                {metrics.totalRevenue.toFixed(2)} MMK
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">
                {t("total_profit")}
              </h4>
              <p className="text-2xl font-bold text-green-600">
                {metrics.totalProfit.toFixed(2)} MMK
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">
                {t("total_units_sold")}
              </h4>
              <p className="text-2xl font-bold text-yellow-600">
                {metrics.totalUnitsSold}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">
                {t("total_discounts")}
              </h4>
              <p className="text-2xl font-bold text-red-600">
                {metrics.totalDiscounts.toFixed(2)} MMK
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">
                {t("total_taxes")}
              </h4>
              <p className="text-2xl font-bold text-purple-600">
                {metrics.totalTaxes.toFixed(2)} MMK
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">
                {t("total_cost")}
              </h4>
              <p className="text-2xl font-bold text-gray-600">
                {metrics.totalCost.toFixed(2)} MMK
              </p>
            </div>
          </div>

          {/* Revenue Chart */}
          {Object.keys(metrics.products).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {t("revenue_by_product")}
              </h3>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Detailed Report */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {t("detailed_report")}
            </h3>
            {Object.keys(metrics.products).length === 0 && (
              <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
                <p>{t("no_sales_data")}</p>
              </div>
            )}
            {Object.keys(metrics.products).length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("product_name")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("category")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("units_sold")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("revenue")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("cost")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("profit")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("discounts")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("taxes")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.values(metrics.products).map((product) => (
                      <tr key={product.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {product.unitsSold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {product.revenue.toFixed(2)} MMK
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {product.cost.toFixed(2)} MMK
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {product.profit.toFixed(2)} MMK
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {product.discounts.toFixed(2)} MMK
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {product.taxes.toFixed(2)} MMK
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => applyFilters(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t("previous")}
              </button>
              <span className="text-gray-700">
                {t("page")} {pagination.page} {t("of")} {pagination.totalPages}
              </span>
              <button
                onClick={() => applyFilters(pagination.page + 1)}
                disabled={
                  pagination.page === pagination.totalPages || isLoading
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t("next")}
              </button>
            </div>
          )}
        </>
      )}

      {/* Filter Modal */}
      <Dialog
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-800">
                {t("filter_report")}
              </Dialog.Title>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("branch")}
                </label>
                <select
                  value={filters.branch_id}
                  onChange={(e) =>
                    setFilters({ ...filters, branch_id: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                >
                  <option value="">{t("all_branches")}</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("category")}
                </label>
                <select
                  value={filters.category_id}
                  onChange={(e) =>
                    setFilters({ ...filters, category_id: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                >
                  <option value="">{t("all_categories")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("start_date")}
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("end_date")}
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      setFilters({ ...filters, end_date: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => applyFilters(1)}
                className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                    {t("applying")}
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    {t("apply_filters")}
                  </>
                )}
              </button>
              <button
                onClick={clearFilters}
                className="w-full flex justify-center items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <FiX className="mr-2" />
                {t("clear_filters")}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default SalesReport;
