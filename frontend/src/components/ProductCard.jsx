import { motion } from "framer-motion";

function ProductCard({ product, addToCart }) {
  const price =
    typeof product.price === "number"
      ? product.price
      : parseFloat(product.price) || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg text-gray-900"
      onClick={() => addToCart(product)}
    >
      <img
        src={product.image_url || "https://via.placeholder.com/150"}
        alt={product.name}
        className="w-full h-32 object-cover rounded"
      />
      <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
      <p className="text-gray-600">${price.toFixed(2)}</p>
      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
      {product.is_weighted && (
        <p className="text-sm text-blue-500">Weighted Product</p>
      )}
    </motion.div>
  );
}

export default ProductCard;
