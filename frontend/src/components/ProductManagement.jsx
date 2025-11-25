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
  FiImage,
  FiTag,
  FiDollarSign,
  FiPackage,
  FiGrid,
  FiHash,
  FiCheckCircle,
  FiPrinter,
  FiRefreshCw,
  FiPercent,
} from "react-icons/fi";

function ProductManagement() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isTaxRateOpen, setIsTaxRateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editTaxRate, setEditTaxRate] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    original_price: "",
    price: "",
    stock: "",
    category_id: "",
    is_weighted: false,
    barcode: "",
    image: null,
    tax_rate_ids: [],
  });
  const [newTaxRate, setNewTaxRate] = useState({ name: "", rate: "" });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productsRes, categoriesRes, taxRatesRes] = await Promise.all([
          axios.get("/products"),
          axios.get("/products/categories"),
          axios.get("/products/tax-rates"),
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setTaxRates(taxRatesRes.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(t("failed_to_load_data"));
        toast.error(t("failed_to_load_data"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const validateFile = (file) => {
    if (!file) return true;
    const filetypes = /jpeg|jpg|png/;
    const isValidType = filetypes.test(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024;
    if (!isValidType) {
      toast.error(t("invalid_file_type"));
      return false;
    }
    if (!isValidSize) {
      toast.error(t("file_too_large"));
      return false;
    }
    return true;
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}-${random}`.toUpperCase();
  };

  const handleAddOrUpdateProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.original_price ||
      !newProduct.price ||
      !newProduct.stock
    ) {
      setError(t("required_fields_missing"));
      toast.error(t("required_fields_missing"));
      return;
    }
    if (
      parseFloat(newProduct.original_price) < 0 ||
      parseFloat(newProduct.price) < 0 ||
      parseInt(newProduct.stock) < 0
    ) {
      setError(t("negative_values"));
      toast.error(t("negative_values"));
      return;
    }
    if (newProduct.image && !validateFile(newProduct.image)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("original_price", newProduct.original_price);
      formData.append("price", newProduct.price);
      formData.append("stock", newProduct.stock);
      formData.append("category_id", newProduct.category_id || "");
      formData.append("is_weighted", newProduct.is_weighted);
      formData.append("barcode", newProduct.barcode || generateBarcode());
      if (newProduct.image) formData.append("image", newProduct.image);
      if (newProduct.tax_rate_ids) {
        formData.append(
          "tax_rate_ids",
          JSON.stringify(newProduct.tax_rate_ids)
        );
      }

      let res;
      if (editProduct) {
        res = await axios.put(`/products/${editProduct.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProducts(
          products.map((p) => (p.id === editProduct.id ? res.data : p))
        );
        toast.success(t("product_updated"));
      } else {
        res = await axios.post("/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProducts([...products, res.data]);
        toast.success(t("product_added"));
      }

      setIsProductOpen(false);
      setNewProduct({
        name: "",
        original_price: "",
        price: "",
        stock: "",
        category_id: "",
        is_weighted: false,
        barcode: "",
        image: null,
        tax_rate_ids: [],
      });
      setEditProduct(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Failed to save product:", err);
      const errorMsg = err.response?.data?.error || t("failed_to_save_product");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdateTaxRate = async () => {
    if (!newTaxRate.name || !newTaxRate.rate) {
      setError(t("required_fields_missing"));
      toast.error(t("required_fields_missing"));
      return;
    }
    if (parseFloat(newTaxRate.rate) < 0 || parseFloat(newTaxRate.rate) > 100) {
      setError(t("invalid_tax_rate"));
      toast.error(t("invalid_tax_rate"));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let res;
      if (editTaxRate) {
        res = await axios.put(
          `/products/tax-rates/${editTaxRate.id}`,
          newTaxRate
        );
        setTaxRates(
          taxRates.map((t) => (t.id === editTaxRate.id ? res.data : t))
        );
        toast.success(t("tax_rate_updated"));
      } else {
        res = await axios.post("/products/tax-rates", newTaxRate);
        setTaxRates([...taxRates, res.data]);
        toast.success(t("tax_rate_added"));
      }

      setIsTaxRateOpen(false);
      setNewTaxRate({ name: "", rate: "" });
      setEditTaxRate(null);
    } catch (err) {
      console.error("Failed to save tax rate:", err);
      const errorMsg =
        err.response?.data?.error || t("failed_to_save_tax_rate");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
    setNewProduct({
      name: product.name,
      original_price: product.original_price.toString(),
      price: product.price.toString(),
      stock: product.stock.toString(),
      category_id: product.category_id || "",
      is_weighted: product.is_weighted || false,
      barcode: product.barcode || "",
      image: null,
      tax_rate_ids:
        product.tax_rates
          ?.map((r) => {
            const tax = taxRates.find((t) => t.rate === r);
            return tax ? tax.id : null;
          })
          .filter((id) => id) || [],
    });
    setImagePreview(product.image_url || null);
    setIsProductOpen(true);
  };

  const handleEditTaxRate = (taxRate) => {
    setEditTaxRate(taxRate);
    setNewTaxRate({ name: taxRate.name, rate: taxRate.rate.toString() });
    setIsTaxRateOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm(t("confirm_delete_product"))) return;
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      toast.success(t("product_deleted"));
    } catch (err) {
      console.error("Failed to delete product:", err);
      const errorMsg =
        err.response?.data?.error || t("failed_to_delete_product");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTaxRate = async (id) => {
    if (!confirm(t("confirm_delete_tax_rate"))) return;
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`/products/tax-rates/${id}`);
      setTaxRates(taxRates.filter((t) => t.id !== id));
      toast.success(t("tax_rate_deleted"));
    } catch (err) {
      console.error("Failed to delete tax rate:", err);
      const errorMsg =
        err.response?.data?.error || t("failed_to_delete_tax_rate");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintBarcode = async (productId) => {
    if (!productId) {
      toast.error(t("no_product_selected"));
      return;
    }
    try {
      const response = await axios.get(`/products/${productId}/barcode-image`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "image/png" })
      );
      const printWindow = window.open("");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              img { max-width: 100%; max-height: 100%; }
            </style>
          </head>
          <body>
            <img src="${url}" onload="window.print();window.close();" onerror="window.close();alert('Failed to load barcode image.');">
          </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        toast.error(t("popup_blocked"));
      }
    } catch (err) {
      console.error("Failed to generate barcode image:", err);
      toast.error(t("failed_to_generate_barcode"));
    } finally {
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    }
  };

  const handleRemoveTaxRate = async (productId, taxRateId) => {
    if (!confirm(t("confirm_remove_tax_rate"))) return;
    try {
      await axios.delete(`/products/${productId}/tax-rates/${taxRateId}`);
      const updatedProduct = { ...editProduct };
      updatedProduct.tax_rates = updatedProduct.tax_rates.filter(
        (rate) => rate !== taxRateId
      );
      setEditProduct(updatedProduct);
      toast.success(t("tax_rate_removed"));
    } catch (err) {
      toast.error(t("failed_to_remove_tax_rate"));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {t("product_management")}
      </h2>

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

      {/* Products Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {t("products")}
          </h3>
          <button
            onClick={() => {
              setEditProduct(null);
              setNewProduct({
                name: "",
                original_price: "",
                price: "",
                stock: "",
                category_id: "",
                is_weighted: false,
                barcode: "",
                image: null,
                tax_rate_ids: [],
              });
              setImagePreview(null);
              setIsProductOpen(true);
            }}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors mt-4 md:mt-0"
            disabled={isLoading}
          >
            <FiPlus className="mr-2" />
            {t("add_product")}
          </button>
        </div>

        {products.length === 0 && !isLoading && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
            <p>{t("no_products_found")}</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("image")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("name")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("original_price")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("price")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("stock")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("category")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("barcode")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("tax_rates")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("weighted")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={() => toast.error(t("failed_to_load_image"))}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <FiImage className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      MMK {parseFloat(product.original_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      MMK {parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category_name || t("na")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.barcode || t("na")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.tax_rates?.join(", ") || t("none")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {product.is_weighted ? (
                        <FiCheckCircle className="text-green-500 mx-auto" />
                      ) : (
                        <FiX className="text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={isLoading}
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          <FiTrash2 />
                        </button>
                        <button
                          onClick={() => handlePrintBarcode(product.id)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={isLoading}
                        >
                          <FiPrinter />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Rates Section */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {t("tax_rates")}
          </h3>
          <button
            onClick={() => {
              setEditTaxRate(null);
              setNewTaxRate({ name: "", rate: "" });
              setIsTaxRateOpen(true);
            }}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors mt-4 md:mt-0"
            disabled={isLoading}
          >
            <FiPlus className="mr-2" />
            {t("add_tax_rate")}
          </button>
        </div>

        {taxRates.length === 0 && !isLoading && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
            <p>{t("no_tax_rates_found")}</p>
          </div>
        )}

        {taxRates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("name")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("rate")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxRates.map((taxRate) => (
                  <tr key={taxRate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {taxRate.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {taxRate.rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditTaxRate(taxRate)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={isLoading}
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteTaxRate(taxRate.id)}
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
      </div>

      {/* Product Modal */}
      <Dialog
        open={isProductOpen}
        onClose={() => setIsProductOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-800">
                {editProduct ? t("edit_product") : t("add_product")}
              </Dialog.Title>
              <button
                onClick={() => setIsProductOpen(false)}
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
                  {t("name")}
                </label>
                <div className="relative">
                  <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("name")}
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("original_price")}
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder={t("original_price")}
                    value={newProduct.original_price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        original_price: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("price")}
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder={t("price")}
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("stock")}
                </label>
                <div className="relative">
                  <FiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder={t("stock")}
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("category")}
                </label>
                <div className="relative">
                  <FiGrid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={newProduct.category_id}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category_id: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  >
                    <option value="">{t("no_category")}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("barcode")}
                </label>
                <div className="relative flex items-center space-x-2">
                  <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("barcode")}
                    value={newProduct.barcode}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, barcode: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        barcode: generateBarcode(),
                      })
                    }
                    className="text-indigo-600 hover:text-indigo-900"
                    disabled={isLoading}
                  >
                    <FiRefreshCw />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tax_rates")}
                </label>
                <div className="relative">
                  <FiPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    multiple
                    value={newProduct.tax_rate_ids}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        tax_rate_ids: Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        ),
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  >
                    {taxRates.map((taxRate) => (
                      <option key={taxRate.id} value={taxRate.id}>
                        {taxRate.name} ({taxRate.rate}%)
                      </option>
                    ))}
                  </select>
                </div>
                {editProduct &&
                  newProduct.tax_rate_ids.map((taxRateId) => {
                    const taxRate = taxRates.find((t) => t.id === taxRateId);
                    return taxRate ? (
                      <div
                        key={taxRateId}
                        className="flex items-center justify-between mt-2"
                      >
                        <span className="text-sm text-gray-600">
                          {taxRate.name} ({taxRate.rate}%)
                        </span>
                        <button
                          onClick={() =>
                            handleRemoveTaxRate(editProduct.id, taxRateId)
                          }
                          className="text-red-600 hover:text-red-800"
                          disabled={isLoading}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ) : null;
                  })}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newProduct.is_weighted}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      is_weighted: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className="ml-2 block text-sm text-gray-700">
                  {t("weighted_product")}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("image")}
                </label>
                <div className="relative">
                  <FiImage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && validateFile(file)) {
                        setNewProduct({ ...newProduct, image: file });
                        setImagePreview(URL.createObjectURL(file));
                      } else {
                        setNewProduct({ ...newProduct, image: null });
                        setImagePreview(null);
                        e.target.value = null;
                      }
                    }}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {(imagePreview ||
                (editProduct &&
                  editProduct.image_url &&
                  !newProduct.image)) && (
                <div className="flex justify-center">
                  <img
                    src={imagePreview || editProduct?.image_url}
                    alt={t("preview_image")}
                    className="w-32 h-32 object-contain rounded border border-gray-200"
                    onError={() => toast.error(t("failed_to_load_image"))}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 space-x-2">
              <button
                onClick={handleAddOrUpdateProduct}
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
                    {editProduct ? t("update_product") : t("add_product")}
                  </>
                )}
              </button>
              <br />
              <button
                onClick={() => handlePrintBarcode(editProduct?.id || null)}
                className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isLoading || !editProduct}
              >
                <FiPrinter className="mr-2" />
                {t("print_barcode")}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Tax Rate Modal */}
      <Dialog
        open={isTaxRateOpen}
        onClose={() => setIsTaxRateOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-800">
                {editTaxRate ? t("edit_tax_rate") : t("add_tax_rate")}
              </Dialog.Title>
              <button
                onClick={() => setIsTaxRateOpen(false)}
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
                  {t("name")}
                </label>
                <input
                  type="text"
                  placeholder={t("name")}
                  value={newTaxRate.name}
                  onChange={(e) =>
                    setNewTaxRate({ ...newTaxRate, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("rate")}
                </label>
                <div className="relative">
                  <FiPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder={t("rate")}
                    value={newTaxRate.rate}
                    onChange={(e) =>
                      setNewTaxRate({ ...newTaxRate, rate: e.target.value })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAddOrUpdateTaxRate}
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
                    {editTaxRate ? t("update_tax_rate") : t("add_tax_rate")}
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

export default ProductManagement;
