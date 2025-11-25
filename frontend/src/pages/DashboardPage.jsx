import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import OrderHistory from "../components/OrderHistory";
import CustomerManagement from "../components/CustomerManagement";
import ProductManagement from "../components/ProductManagement";
import PreparationOrders from "../components/PreparationOrders";

function DashboardPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div>
          <span className="mr-4">{user?.username}</span>
          <button
            onClick={() => navigate("/")}
            className="mr-4 bg-blue-500 text-white p-2 rounded"
          >
            PoS
          </button>
          <button
            onClick={logout}
            className="bg-red-500 text-white p-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex mb-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`mr-2 p-2 rounded ${
            activeTab === "orders" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Order History
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`mr-2 p-2 rounded ${
            activeTab === "customers" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Customer Management
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`mr-2 p-2 rounded ${
            activeTab === "products" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Product Management
        </button>
        <button
          onClick={() => setActiveTab("preparation")}
          className={`p-2 rounded ${
            activeTab === "preparation"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
        >
          Preparation Orders
        </button>
      </div>
      {activeTab === "orders" && <OrderHistory />}
      {activeTab === "customers" && <CustomerManagement />}
      {activeTab === "products" && <ProductManagement />}
      {activeTab === "preparation" && <PreparationOrders />}
    </div>
  );
}

export default DashboardPage;
