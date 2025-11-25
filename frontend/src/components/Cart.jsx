import { useState, useEffect } from "react";
import axios from "axios";

function Cart({ cart, updateQuantity, removeFromCart, proceedToPayment }) {
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/customers`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers.");
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customerId) {
      axios
        .get(`${import.meta.env.VITE_API_URL}/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => setLoyaltyPoints(res.data.loyalty_points || 0))
        .catch((err) => {
          console.error("Error fetching customer:", err);
          setError("Failed to load customer details.");
        });
    } else {
      setLoyaltyPoints(0);
      setUsePoints(0);
    }
  }, [customerId]);

  const subtotal = cart.reduce((sum, item) => {
    const price =
      typeof item.price === "number" ? item.price : parseFloat(item.price) || 0;
    const quantity = item.quantity || 1;
    const itemDiscount = item.discount || 0;
    return sum + price * quantity * (1 - itemDiscount / 100);
  }, 0);

  const total = subtotal * (1 - discount / 100) - usePoints * 0.01;

  return (
    <div className="bg-white p-4 rounded-lg shadow h-full text-gray-900">
      <h2 className="text-xl font-bold mb-4">Cart</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Customer</label>
        <select
          value={customerId || ""}
          onChange={(e) =>
            setCustomerId(e.target.value ? parseInt(e.target.value) : null)
          }
          className="w-full p-2 border rounded bg-gray-100"
        >
          <option value="">Guest</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.email})
            </option>
          ))}
        </select>
      </div>
      {customerId && (
        <div className="mb-4">
          <p className="text-sm">Loyalty Points: {loyaltyPoints}</p>
          <label className="block text-sm font-medium mb-2">Use Points</label>
          <input
            type="number"
            min="0"
            max={loyaltyPoints}
            value={usePoints}
            onChange={(e) =>
              setUsePoints(
                Math.min(parseInt(e.target.value) || 0, loyaltyPoints)
              )
            }
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>
      )}
      {cart.length === 0 ? (
        <p className="text-gray-500">Cart is empty</p>
      ) : (
        <>
          {cart.map((item) => {
            const price =
              typeof item.price === "number"
                ? item.price
                : parseFloat(item.price) || 0;
            return (
              <div
                key={item.id}
                className="flex justify-between mb-2 items-center"
              >
                <div>
                  <p>{item.name}</p>
                  <p className="text-sm text-gray-500">
                    ${price.toFixed(2)} x {item.quantity || 1}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || 1}
                    onChange={(e) =>
                      updateQuantity(item.id, parseInt(e.target.value) || 1)
                    }
                    className="w-16 p-1 border rounded bg-gray-100"
                  />
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          <p className="mt-4 font-semibold">
            Subtotal: MMK{subtotal.toFixed(2)}
          </p>
          <p className="font-semibold">Total: MMK{total.toFixed(2)}</p>
          <button
            onClick={() =>
              proceedToPayment({ discount, total, customerId, usePoints })
            }
            className="w-full mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-green-300"
            disabled={total < 0}
          >
            Proceed to Payment
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;
