import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";

function CustomerSelector({ selectedCustomer, setSelectedCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    loyalty_points: 0,
    ewallet_balance: 0,
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);
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
        console.error("Failed to fetch customers:", err);
        setError("Failed to load customers. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleAddCustomer = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/customers`,
        newCustomer,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCustomers([...customers, res.data]);
      setSelectedCustomer(res.data);
      setIsOpen(false);
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        loyalty_points: 0,
        ewallet_balance: 0,
      });
    } catch (error) {
      console.error("Failed to add customer:", error);
      setError(error.response?.data?.error || "Failed to add customer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Customer</label>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="flex">
        <select
          value={selectedCustomer?.id || ""}
          onChange={(e) =>
            setSelectedCustomer(
              customers.find((c) => c.id === parseInt(e.target.value)) || null
            )
          }
          className="w-full p-2 border rounded mr-2"
          disabled={isLoading}
        >
          <option value="">Guest</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.email})
            </option>
          ))}
        </select>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          Add
        </button>
      </div>
      {selectedCustomer && (
        <div className="mt-2">
          <p>Loyalty Points: {selectedCustomer.loyalty_points || 0}</p>
          <p>
            eWallet Balance: $
            {(parseFloat(selectedCustomer.ewallet_balance) || 0).toFixed(2)}
          </p>
        </div>
      )}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-lg w-full max-w-md">
            <Dialog.Title className="text-xl font-bold mb-4">
              Add New Customer
            </Dialog.Title>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <input
              type="text"
              placeholder="Name"
              value={newCustomer.name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
              disabled={isLoading}
            />
            <input
              type="email"
              placeholder="Email"
              value={newCustomer.email}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, email: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="Phone"
              value={newCustomer.phone}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, phone: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
              disabled={isLoading}
            />
            <button
              onClick={handleAddCustomer}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Customer"}
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default CustomerSelector;
