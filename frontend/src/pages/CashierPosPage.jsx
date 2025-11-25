// src/pages/CashierPosPage.jsx

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import PaymentModal from "../components/PaymentModal";
import AuthContext from "../context/AuthContext";
import { toast } from "react-toastify";
import { Transition } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  ClockIcon,
  LanguageIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// Default placeholder image
const PLACEHOLDER_IMAGE = "https://placehold.co/80x80/png";

function CashierPosPage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [heldOrders, setHeldOrders] = useState([]);
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  );
  const [loading, setLoading] = useState({
    stores: true,
    products: true,
    orders: false,
    cancelling: {},
    attendance: false,
    session: false,
  });
  const [error, setError] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  const barcodeInputRef = useRef(null);

  // Toggle item details for small screens
  const toggleItemDetails = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      );
    };
    updateClock(); // Initial call
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Language switch
  const languages = [
    { code: "en", name: "English" },
    { code: "my", name: "မြန်မာ" },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
    toast.info(t("language_changed"));
  };

  // Load saved language
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "en";
    i18n.changeLanguage(savedLanguage);
  }, [i18n]);

  // Validate session
  const validateSession = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, session: true }));
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/validate-session`,
        config
      );
    } catch (err) {
      console.error("Session validation error:", err);
      setError(t("session_invalid"));
      toast.error(t("session_invalid"));
      logout();
      navigate("/login");
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
    }
  }, [t, logout, navigate]);

  // Fetch stores, products, held orders, attendance, and validate session on mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    validateSession();
    fetchStores();
    fetchProducts();
    fetchHeldOrders();
    fetchAttendance();
    barcodeInputRef.current.focus();

    // Periodic session validation every 30 seconds
    const intervalId = setInterval(validateSession, 30000);
    return () => clearInterval(intervalId);
  }, [user, navigate, validateSession]);

  // Fetch stores
  const fetchStores = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/stores`,
        config
      );
      setStores(response.data);
      if (
        user.role === "admin" &&
        user.branch_id === null &&
        response.data.length > 0
      ) {
        setSelectedStore(response.data[0].id);
      } else if (response.data.length > 0) {
        setSelectedStore(
          response.data.find((s) => s.branch_id === user.branch_id)?.id ||
            response.data[0].id
        );
      }
    } catch (err) {
      setError(t("failed_to_fetch_stores"));
      toast.error(t("failed_to_fetch_stores"));
    } finally {
      setLoading((prev) => ({ ...prev, stores: false }));
    }
  }, [user, t]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/products`,
        config
      );
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (err) {
      console.error("Fetch products error:", err);
      setError(t("failed_to_fetch_products"));
      toast.error(t("failed_to_fetch_products"));
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  }, [t]);

  // Fetch held orders
  const fetchHeldOrders = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, orders: true }));
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/pending`,
        config
      );
      const cancellableOrders = response.data.filter(
        (order) =>
          order.status === "pending" && order.branch_id === user.branch_id
      );
      setHeldOrders(cancellableOrders);
    } catch (err) {
      console.error("Fetch held orders error:", err);
      toast.error(t("failed_to_fetch_held_orders"));
    } finally {
      setLoading((prev) => ({ ...prev, orders: false }));
    }
  }, [user, t]);

  // Fetch current attendance
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, attendance: true }));
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/employee-attendance?user_id=${
          user.id
        }`,
        config
      );

      // Find the latest open attendance record (no clock_out)
      const latestAttendance = response.data
        .filter((record) => record.user_id === user.id && !record.clock_out)
        .sort((a, b) => new Date(b.clock_in) - new Date(a.clock_in))[0];
      setAttendance(latestAttendance || null);
    } catch (err) {
      console.error("Fetch attendance error:", err);
      toast.error(t("failed_to_fetch_attendance"));
    } finally {
      setLoading((prev) => ({ ...prev, attendance: false }));
    }
  }, [user, t]);

  // Handle clock-in
  const handleClockIn = useCallback(async () => {
    if (attendance) {
      toast.warn(t("already_clocked_in"));
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, attendance: true }));
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/employee-attendance`,
        {
          user_id: user.id,
          branch_id: user.branch_id,
          clock_in: new Date().toISOString(),
        },
        config
      );
      setAttendance({
        id: response.data.id,
        user_id: user.id,
        branch_id: user.branch_id,
        clock_in: new Date().toISOString(),
        clock_out: null,
      });
      toast.success(t("clocked_in"));
    } catch (err) {
      console.error("Clock-in error:", err);
      toast.error(t("failed_to_clock_in"));
    } finally {
      setLoading((prev) => ({ ...prev, attendance: false }));
    }
  }, [user, attendance, t]);

  // Handle clock-out
  const handleClockOut = useCallback(async () => {
    if (!attendance) {
      toast.warn(t("not_clocked_in"));
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, attendance: true }));
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/employee-attendance/${attendance.id}`,
        {
          clock_out: new Date().toISOString(),
        },
        config
      );
      setAttendance(null);
      toast.success(t("clocked_out"));
    } catch (err) {
      console.error("Clock-out error:", err);
      toast.error(t("failed_to_clock_out"));
    } finally {
      setLoading((prev) => ({ ...prev, attendance: false }));
    }
  }, [attendance, t]);

  // Filter products
  useEffect(() => {
    let filtered = products;
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode?.includes(searchQuery) ||
          p.code?.includes(searchQuery) ||
          p.sku?.includes(searchQuery)
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  // Calculate total and tax
  useEffect(() => {
    const subtotal = cart.reduce(
      (sum, item) =>
        sum + item.price * item.quantity * (1 - (item.discount || 0) / 100),
      0
    );
    const newTaxTotal = cart.reduce((sum, item) => {
      const taxRates = item.tax_rates || [];
      const taxAmount = taxRates.reduce((taxSum, rate) => {
        const itemSubtotal =
          item.price * item.quantity * (1 - (item.discount || 0) / 100);
        return taxSum + (itemSubtotal * rate) / 100;
      }, 0);
      return sum + taxAmount;
    }, 0);
    const discountedSubtotal = subtotal * (1 - discount / 100);
    const discountedTaxTotal = newTaxTotal * (1 - discount / 100);
    setTotal(discountedSubtotal + discountedTaxTotal);
    setTaxTotal(discountedTaxTotal);
  }, [cart, discount]);

  // Handle barcode scan
  const handleBarcodeScan = async (e) => {
    if (e.key === "Enter" && barcode.trim()) {
      const product = products.find(
        (p) => p.barcode === barcode || p.code === barcode || p.sku === barcode
      );
      if (product) {
        addToCart(product);
        toast.success(t("item_added"));
      } else {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/customers/${barcode}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setCustomer(response.data);
          toast.success(t("customer_added"));
        } catch (err) {
          toast.error(t("invalid_barcode"));
        }
      }
      setBarcode("");
      barcodeInputRef.current.focus();
    }
  };

  // Add product to cart with tax rates
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          discount: 0,
          image_url: product.image_url,
          tax_rates: product.tax_rates || [],
        },
      ];
    });
  };

  // Remove item from cart
  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.success(t("item_removed"));
  };

  // Update quantity
  const updateQuantity = (id, qty) => {
    setCart(
      cart.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, parseInt(qty) || 1) }
          : item
      )
    );
  };

  // Update item discount
  const updateDiscount = (id, disc) => {
    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              discount: Math.min(100, Math.max(0, parseFloat(disc) || 0)),
            }
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomer(null);
    setTaxTotal(0);
    toast.info(t("cart_cleared"));
  };

  // Hold order
  const holdOrder = async () => {
    if (cart.length === 0) {
      toast.error(t("cart_empty"));
      return;
    }
    if (!selectedStore) {
      toast.warn(t("select_store"));
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders`,
        {
          items: cart,
          customer_id: customer?.id || null,
          discount,
          tax_total: taxTotal,
          store_id: selectedStore,
          branch_id: user.branch_id,
          status: "pending",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
      setDiscount(0);
      setCustomer(null);
      setTaxTotal(0);
      await fetchHeldOrders();
      toast.success(t("order_held"));
    } catch (err) {
      console.error("Hold order error:", err);
      toast.error(t("failed_to_hold_order"));
    }
  };

  // Resume held order
  const resumeOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const order = response.data;
      setCart(
        order.items.map((item) => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0,
          image_url: item.image_url,
          tax_rates: item.tax_rates || [],
        }))
      );
      setDiscount(order.discount || 0);
      setTaxTotal(parseFloat(order.tax_total || 0));
      setCustomer(
        order.customer_id
          ? { id: order.customer_id, name: order.customer_name }
          : null
      );
      setSelectedStore(order.store_id);
      setIsHeldOrdersOpen(false);
      toast.success(t("order_resumed"));
    } catch (err) {
      console.error("Resume order error:", err);
      toast.error(t("failed_to_resume_order"));
    }
  };

  // Cancel held order
  const cancelHeldOrder = async (orderId) => {
    try {
      setLoading((prev) => ({
        ...prev,
        cancelling: { ...prev.cancelling, [orderId]: true },
      }));
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders/${orderId}/cancel`,
        { reason: "Cancelled by cashier" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchHeldOrders();
      toast.success(t("order_cancelled"));
    } catch (err) {
      console.error("Cancel held order error:", err);
      const errorMessage =
        err.response?.data?.error || t("failed_to_cancel_order");
      toast.error(errorMessage);
    } finally {
      setLoading((prev) => ({
        ...prev,
        cancelling: { ...prev.cancelling, [orderId]: false },
      }));
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error(t("cart_empty"));
      return;
    }
    if (!selectedStore) {
      toast.warn(t("select_store"));
      return;
    }
    setIsPaymentOpen(true);
  };

  // Handle order completion
  const handleOrderComplete = async (orderId) => {
    setCart([]);
    setDiscount(0);
    setCustomer(null);
    setTaxTotal(0);
    setIsPaymentOpen(false);
    toast.success(t("order_completed"));
    navigate(`/receipt/${orderId}`);
  };

  // Custom logout to invalidate session
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/logout`,
        {},
        config
      );
      logout();
      localStorage.removeItem("token");
      navigate("/login");
      toast.success(t("logged_out"));
    } catch (err) {
      console.error("Logout error:", err);
      // Only show error toast for non-404 errors, as 404 is now handled by the backend
      if (err.response?.status !== 404) {
        toast.error(t("failed_to_logout"));
      }
      logout();
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // Get unique categories
  const categories = [
    "all",
    ...new Set(products.map((p) => p.category || "Uncategorized")),
  ];

  // Handle customer search
  const handleCustomerSearch = async (barcode) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/customers/${barcode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomer(response.data);
      setIsCustomerModalOpen(false);
      toast.success(t("customer_added"));
    } catch (err) {
      toast.error(t("customer_not_found"));
    }
  };

  // Construct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== "string") {
      console.warn(`Image URL is invalid: ${imageUrl}`);
      return PLACEHOLDER_IMAGE;
    }
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }
    const normalizedImageUrl = imageUrl.startsWith("/")
      ? imageUrl
      : `/${imageUrl}`;
    const fullUrl = `${
      import.meta.env.VITE_API_URL
    }/images${normalizedImageUrl}`;
    console.log(`Constructed image URL: ${fullUrl}`);
    return fullUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md p-3 sm:p-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            {t("pos")}
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          {attendance ? (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                {t("clocked_in_at", {
                  time: new Date(attendance.clock_in).toLocaleTimeString([], {
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  }),
                })}
              </span>
              <button
                onClick={handleClockOut}
                className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md transition-colors text-xs sm:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading.attendance}
                aria-label={t("clock_out")}
              >
                {loading.attendance ? (
                  <div className="animate-spin h-4 sm:h-5 w-4 sm:w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <ClockIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                )}
                {t("clock_out")}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClockIn}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md transition-colors text-xs sm:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading.attendance}
              aria-label={t("clock_in")}
            >
              {loading.attendance ? (
                <div className="animate-spin h-4 sm:h-5 w-4 sm:w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : (
                <ClockIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
              )}
              {t("clock_in")}
            </button>
          )}
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="p-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base"
            aria-label={t("select_language")}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStore || ""}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="p-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base"
            disabled={stores.length === 0}
            aria-label={t("select_store")}
          >
            <option value="">{t("select_store")}</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleLogout}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md transition-colors text-xs sm:text-base"
            aria-label={t("logout")}
          >
            <XMarkIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            {t("logout")}
          </button>
        </div>
      </header>

      {/* Date and Time Display */}
      <div className="w-full bg-gray-100 dark:bg-gray-900 p-3 sm:p-4 text-center">
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Display Date & Time: {currentTime}
        </span>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left: Product Selection */}
        <div className="sm:col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 dark:text-white">
              {t("products")}
            </h2>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-base"
                aria-label={t("add_customer")}
              >
                <PlusIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                {t("add_customer")}
              </button>
              <button
                onClick={() => setIsHeldOrdersOpen(true)}
                className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-base"
                aria-label={t("view_held_orders")}
              >
                <ClockIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                {t("view_held_orders")}
              </button>
            </div>
          </div>

          {/* Barcode Input */}
          <div className="relative mb-4 sm:mb-6">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400 dark:text-gray-300"
              aria-hidden="true"
            />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeScan}
              placeholder={t("scan_barcode_placeholder")}
              className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-base"
              aria-label={t("scan_barcode")}
              autoFocus
            />
          </div>

          {/* Search and Category Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search_products")}
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-base"
                aria-label={t("search_products")}
              />
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400 dark:text-gray-300"
                aria-hidden="true"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 sm:p-3 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-base"
              aria-label={t("select_category")}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? t("all_categories") : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[calc(100vh-400px)] overflow-y-auto">
            {loading.products ? (
              Array(6)
                .fill()
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 sm:p-4 animate-pulse"
                  >
                    <div className="w-full h-16 sm:h-20 bg-gray-300 dark:bg-gray-600 rounded-md mb-2"></div>
                    <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 text-left hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors focus:ring-2 focus:ring-indigo-500"
                  aria-label={t("add_to_cart", { name: product.name })}
                >
                  <img
                    src={getImageUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-20 sm:h-24 object-cover rounded-md mb-2 sm:mb-3"
                    onError={(e) => {
                      console.error(
                        `Failed to load image for ${product.name}: ${e.target.src}`
                      );
                      toast.error(
                        t("failed_to_load_image", { name: product.name })
                      );
                      e.target.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                  <h3 className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-300 truncate">
                    {product.name}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">
                    {product.price.toFixed(2)} MMK
                  </p>
                </button>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                {t("no_products_found")}
              </p>
            )}
          </div>
        </div>

        {/* Right: Cart and Summary */}
        <div className="sm:col-span-2 md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            {t("cart")}
          </h2>

          {/* Cart Header */}
          <div className="grid grid-cols-2 sm:grid-cols-8 gap-3 sm:gap-4 p-3 sm:p-4 border-b dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-xs sm:text-sm font-semibold text-gray-800 dark:text-white">
            <div className="col-span-1">{t("product_name")}</div>
            <div className="col-span-1">{t("actions")}</div>
            <div className="hidden sm:block">{t("price")}</div>
            <div className="hidden sm:block col-span-2">{t("quantity")}</div>
            <div className="hidden sm:block">{t("discount")}</div>
            <div className="hidden sm:block">{t("subtotal")}</div>
            <div className="hidden sm:block">{t("tax")}</div>
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="my-4 sm:my-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800 dark:text-white text-xs sm:text-sm">
                  {t("customer")}: {customer.name}
                </p>
                {customer.loyalty_points && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {t("loyalty_points")}: {customer.loyalty_points}
                  </p>
                )}
              </div>
              <button
                onClick={() => setCustomer(null)}
                className="text-red-500 hover:text-red-600"
                aria-label={t("remove_customer")}
              >
                <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6" />
              </button>
            </div>
          )}

          {/* Cart Items */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto mb-4 sm:mb-6">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                {t("cart_empty")}
              </p>
            ) : (
              <Transition
                as="div"
                show={cart.length > 0}
                enter="transition-opacity duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div>
                  {cart.map((item) => {
                    const itemSubtotal =
                      item.price *
                      item.quantity *
                      (1 - (item.discount || 0) / 100);
                    const itemTax = item.tax_rates.reduce(
                      (sum, rate) => sum + (itemSubtotal * rate) / 100,
                      0
                    );
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-2 sm:grid-cols-8 gap-3 sm:gap-4 items-center p-3 sm:p-4 border-b dark:border-gray-700"
                      >
                        <div className="col-span-1 text-xs sm:text-sm font-medium text-gray-800 dark:text-white truncate">
                          {item.name}
                          <button
                            onClick={() => toggleItemDetails(item.id)}
                            className="sm:hidden text-gray-500 dark:text-gray-400 ml-2"
                            aria-label={t(
                              expandedItems[item.id]
                                ? "hide_details"
                                : "show_details",
                              {
                                name: item.name,
                              }
                            )}
                          >
                            {expandedItems[item.id] ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-600"
                            aria-label={t("remove_from_cart", {
                              name: item.name,
                            })}
                          >
                            <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6" />
                          </button>
                        </div>
                        <div
                          className={`sm:col-span-6 col-span-2 ${
                            expandedItems[item.id] ? "block" : "hidden sm:grid"
                          } grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4 items-center`}
                        >
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {item.price.toFixed(2)} MMK
                          </div>
                          <div className="col-span-2 flex gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white w-6 sm:w-8 h-6 sm:h-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                              aria-label={t("decrease_quantity", {
                                name: item.name,
                              })}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.id, e.target.value)
                              }
                              className="w-12 sm:w-16 p-1 border border-gray-300 rounded-md text-center bg-gray-50 dark:bg-gray-700 dark:text-white text-xs sm:text-sm"
                              min="1"
                              aria-label={t("quantity", { name: item.name })}
                            />
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white w-6 sm:w-8 h-6 sm:h-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                              aria-label={t("increase_quantity", {
                                name: item.name,
                              })}
                            >
                              +
                            </button>
                          </div>
                          <div>
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) =>
                                updateDiscount(item.id, e.target.value)
                              }
                              placeholder="Disc %"
                              className="w-16 sm:w-20 p-1 border border-gray-300 rounded-md text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 dark:text-white"
                              min="0"
                              max="100"
                              aria-label={t("discount_for", {
                                name: item.name,
                              })}
                            />
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white">
                            {itemSubtotal.toFixed(2)} MMK
                          </div>
                          <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                            {itemTax.toFixed(2)} MMK
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Transition>
            )}
          </div>

          {/* Cart Summary */}
          <div className="border-t dark:border-gray-700 pt-4 sm:pt-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <label className="text-gray-800 dark:text-white text-xs sm:text-sm">
                {t("discount_percent")}
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) =>
                  setDiscount(
                    Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                  )
                }
                className="w-20 sm:w-24 p-2 border border-gray-300 rounded-md text-right bg-gray-50 dark:bg-gray-700 dark:text-white text-xs sm:text-sm"
                min="0"
                max="100"
                aria-label={t("cart_discount")}
              />
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm sm:text-md font-medium text-gray-800 dark:text-white">
                {t("subtotal")}
              </p>
              <p className="text-sm sm:text-md font-medium text-gray-800 dark:text-white">
                {(total - taxTotal).toFixed(2)} MMK
              </p>
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm sm:text-md font-medium text-green-600 dark:text-green-400">
                {t("total_taxes")}
              </p>
              <p className="text-sm sm:text-md font-medium text-green-600 dark:text-green-400">
                {taxTotal.toFixed(2)} MMK
              </p>
            </div>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
                {t("total")}
              </p>
              <p className="text-base sm:text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {total.toFixed(2)} MMK
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={clearCart}
                className="flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md transition-colors text-xs sm:text-sm"
                aria-label={t("clear_cart")}
              >
                <TrashIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                {t("clear_cart")}
              </button>
              <button
                onClick={holdOrder}
                className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md transition-colors text-xs sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={cart.length === 0 || !selectedStore}
                aria-label={t("hold_order")}
              >
                <PauseIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                {t("hold_order")}
              </button>
              <button
                onClick={handleCheckout}
                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md transition-colors text-xs sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={cart.length === 0 || !selectedStore}
                aria-label={t("checkout")}
              >
                {t("checkout")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        cart={cart}
        discount={discount}
        total={total}
        taxTotal={taxTotal}
        customer={customer}
        onOrderComplete={handleOrderComplete}
        selectedStore={selectedStore}
      />

      {/* Customer Lookup Modal */}
      <Transition
        show={isCustomerModalOpen}
        enter="transition ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        as="div"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-6 w-full max-w-full sm:max-w-md">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
                {t("add_customer")}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={t("close")}
              >
                <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6" />
              </button>
            </div>
            <div className="relative mb-4 sm:mb-6">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleCustomerSearch(barcode)
                }
                placeholder={t("scan_barcode_placeholder")}
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
                aria-label={t("scan_barcode")}
              />
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400 dark:text-gray-300"
                aria-hidden="true"
              />
            </div>
            <div className="flex justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-xs sm:text-sm"
                aria-label={t("cancel")}
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleCustomerSearch(barcode)}
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs sm:text-sm"
                aria-label={t("add")}
              >
                {t("add")}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      {/* Held Orders Modal */}
      <Transition
        show={isHeldOrdersOpen}
        enter="transition ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        as="div"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-6 w-full max-w-full sm:max-w-lg">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
                {t("held_orders")}
              </h3>
              <button
                onClick={() => setIsHeldOrdersOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={t("close")}
              >
                <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {loading.orders ? (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin h-6 sm:h-8 w-6 sm:w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : heldOrders.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  {t("no_held_orders")}
                </p>
              ) : (
                heldOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white">
                        {t("order")} #{order.id} - ${order.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleString([], {
                          timeZone:
                            Intl.DateTimeFormat().resolvedOptions().timeZone,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={() => resumeOrder(order.id)}
                        className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={loading.cancelling[order.id]}
                        aria-label={t("resume_order", { id: order.id })}
                      >
                        <PlayIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                        {t("resume")}
                      </button>
                      <button
                        onClick={() => cancelHeldOrder(order.id)}
                        className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={loading.cancelling[order.id]}
                        aria-label={t("cancel_order", { id: order.id })}
                      >
                        {loading.cancelling[order.id] ? (
                          <div className="animate-spin h-4 sm:h-5 w-4 sm:w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        ) : (
                          <XMarkIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                        )}
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4 sm:mt-6">
              <button
                onClick={() => setIsHeldOrdersOpen(false)}
                className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-xs sm:text-sm"
                aria-label={t("close")}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      {error && (
        <div className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 bg-red-500 text-white p-3 sm:p-4 rounded-lg shadow-lg max-w-xs sm:max-w-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default CashierPosPage;
