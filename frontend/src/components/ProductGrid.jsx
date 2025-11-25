function ProductGrid({ products, addToCart }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white p-4 rounded shadow hover:shadow-lg cursor-pointer text-gray-900"
          onClick={() => addToCart(product)}
        >
          <img
            src={product.image_url || "https://via.placeholder.com/150"}
            alt={product.name}
            className="w-full h-32 object-cover rounded"
          />
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="text-gray-600">MMK{product.price.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{product.category_name}</p>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;
