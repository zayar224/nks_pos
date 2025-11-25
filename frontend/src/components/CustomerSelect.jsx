import { useState, useEffect } from "react";

export default function CustomerSelect({ setSelectedCustomer }) {
  const [customers, setCustomers] = useState([]);
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

  return (
    <div className="mb-4">
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <select
        className="w-full p-2 border rounded mb-4"
        onChange={(e) =>
          setSelectedCustomer(
            customers.find((c) => c.id === parseInt(e.target.value)) || null
          )
        }
      >
        <option value="">Select Customer</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name} ({customer.email})
          </option>
        ))}
      </select>
    </div>
  );
}
