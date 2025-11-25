import { openDB } from "idb";

const dbPromise = openDB("KernexPosDB", 1, {
  upgrade(db) {
    db.createObjectStore("orders", { keyPath: "id" });
  },
});

export const queueOrder = async (orderData) => {
  const db = await dbPromise;
  const id = Date.now(); // Temporary ID
  await db.put("orders", { ...orderData, id, status: "pending" });
};

export const syncOrders = async () => {
  const db = await dbPromise;
  const orders = await db.getAll("orders");
  for (const order of orders) {
    if (order.status === "pending") {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/orders`, order, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        await db.put("orders", { ...order, status: "synced" });
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }
  }
};
