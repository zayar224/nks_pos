// src/components/BarcodeScanner.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

function BarcodeScanner({ onProductFound, onCustomerFound }) {
  const { t } = useTranslation();
  const [barcode, setBarcode] = useState("");

  const handleBarcodeInput = async (e) => {
    if (e.key === "Enter" && barcode) {
      try {
        // Try to find a product
        const productRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/products/barcode/${barcode}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (productRes.data) {
          onProductFound(productRes.data);
        }
      } catch (productError) {
        try {
          // Try to find a customer
          const customerRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/customers/barcode/${barcode}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          if (customerRes.data) {
            onCustomerFound(customerRes.data);
          }
        } catch (customerError) {
          console.error("Barcode not found:", customerError);
        }
      }
      setBarcode("");
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        {t("scan_barcode")}
      </label>
      <input
        type="text"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyPress={handleBarcodeInput}
        className="w-full p-2 border rounded"
        placeholder={t("scan_barcode_placeholder")}
        autoFocus
      />
    </div>
  );
}

export default BarcodeScanner;
