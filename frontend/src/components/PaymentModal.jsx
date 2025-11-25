import { useState, useEffect, useContext } from "react";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";
import AuthContext from "../context/AuthContext";
import { XMarkIcon } from "@heroicons/react/24/outline";

function PaymentModal({
  isOpen,
  onClose,
  cart,
  discount,
  total,
  taxTotal,
  customer,
  onOrderComplete,
  selectedStore,
}) {
  const { user } = useContext(AuthContext);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ewalletAmount, setEwalletAmount] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setPayments([]); // Reset payments on open
    setEwalletAmount(0);
    setLoyaltyPoints(0);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to continue");
      setLoading(false);
      return;
    }
    const config = { headers: { Authorization: `Bearer ${token}` } };

    axios
      .get(`${import.meta.env.VITE_API_URL}/payment-methods`, config)
      .then((response) => {
        setPaymentMethods(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching payment methods:", err);
        setError("Failed to load payment methods");
        setLoading(false);
      });
  }, [isOpen]);

  const addPayment = () => {
    if (!selectedPaymentMethod || !paymentAmount || paymentAmount <= 0) {
      setError("Please select a payment method and enter a valid amount");
      return;
    }
    const paymentMethod = paymentMethods.find(
      (m) => m.id === parseInt(selectedPaymentMethod)
    );
    if (!paymentMethod) {
      setError("Invalid payment method selected");
      return;
    }
    setPayments([
      ...payments,
      {
        payment_method_id: parseInt(selectedPaymentMethod),
        amount: parseFloat(paymentAmount),
      },
    ]);
    setSelectedPaymentMethod("");
    setPaymentAmount("");
    setError("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    if (!cart || cart.length === 0) {
      setError("Cart is empty");
      setIsSubmitting(false);
      return;
    }
    if (!selectedStore) {
      setError("Please select a store");
      setIsSubmitting(false);
      return;
    }

    const branchId = user?.branch_id;
    if (!branchId) {
      setError("Branch ID not found in user context");
      setIsSubmitting(false);
      return;
    }

    try {
      const totalPaid = payments.reduce((sum, pm) => sum + pm.amount, 0);
      const pointsValue = loyaltyPoints * 0.01;
      const totalWithPayments = totalPaid + (ewalletAmount || 0) + pointsValue;

      if (totalWithPayments < total) {
        throw new Error("Payment amounts do not cover the total");
      }

      const orderData = {
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          discount: item.discount || 0,
          price: item.price,
          tax_rates: item.tax_rates || [],
        })),
        customer_id: customer?.id || null,
        discount,
        tax_total: parseFloat(taxTotal) || 0,
        payment_methods: payments,
        ewallet_amount: ewalletAmount || 0,
        use_loyalty_points: loyaltyPoints || 0,
        store_id: selectedStore,
        is_online: false,
        branch_id: branchId,
      };

      console.log("Sending order data:", orderData);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders`,
        orderData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success(`Order #${res.data.id} created successfully!`);
      onOrderComplete(res.data.id);
      onClose();
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        "An error occurred while processing the order";
      console.error("Order submission error:", error);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingAmount =
    total -
    (payments.reduce((sum, pm) => sum + pm.amount, 0) +
      (ewalletAmount || 0) +
      (loyaltyPoints * 0.01 || 0));

  const removePayment = (indexToRemove) => {
    setPayments(payments.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <Dialog.Title className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Payment
          </Dialog.Title>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {loading && (
            <p className="text-gray-500 dark:text-gray-400 mb-4">Loading...</p>
          )}
          {!loading && (
            <>
              <p className="text-gray-800 dark:text-white">
                Total: {total.toFixed(2)} MMK
              </p>
              <p className="text-green-600 dark:text-green-400">
                Total Taxes: {taxTotal.toFixed(2)} MMK
              </p>
              <p className="text-gray-800 dark:text-white">
                Change: {remainingAmount.toFixed(2)} MMK
              </p>
              {customer && (
                <div className="mb-4">
                  <p className="text-gray-800 dark:text-white">
                    Customer: {customer.name}
                  </p>
                  <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-white">
                    Use Loyalty Points (Available:{" "}
                    {customer.loyalty_points || 0})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={customer.loyalty_points || 0}
                    value={loyaltyPoints}
                    onChange={(e) =>
                      setLoyaltyPoints(parseInt(e.target.value) || 0)
                    }
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
                  />
                  <label className="block text-sm font-medium mb-2 mt-2 text-gray-800 dark:text-white">
                    Use eWallet (Balance:
                    {customer.ewallet_balance?.toFixed(2) || "0.00"} MMK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={customer.ewallet_balance || 0}
                    value={ewalletAmount}
                    onChange={(e) =>
                      setEwalletAmount(parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-white">
                  Payment Method
                </label>
                <div className="flex flex-col sm:flex-row sm:gap-4">
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="flex-1 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
                    disabled={loading || paymentMethods.length === 0}
                  >
                    <option value="">Select Payment Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="flex-1 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white sm:mt-0 mt-2"
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={addPayment}
                  className="mt-2 w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                  disabled={loading || isSubmitting}
                >
                  Add Payment
                </button>
              </div>
              {payments.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                    Added Payments
                  </h3>
                  {payments.map((pm, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between mt-2"
                    >
                      <p className="text-gray-800 dark:text-white">
                        {paymentMethods.find(
                          (m) => m.id === pm.payment_method_id
                        )?.name || "Unknown Method"}
                        : {pm.amount.toFixed(2)} MMK
                      </p>
                      <button
                        onClick={() => removePayment(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        aria-label={`Remove payment ${index + 1}`}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                disabled={loading || isSubmitting || remainingAmount > 0}
              >
                {isSubmitting ? "Processing..." : "Complete Payment"}
              </button>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default PaymentModal;
