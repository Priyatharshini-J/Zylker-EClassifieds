import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { addToCart } from "../store/slices/cartSlice";

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { products } = useSelector((state: RootState) => state.product);
  const product = products.find((p) => p.id === id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (product?.images.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (product?.images.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart(product));
    }
  };

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <img
            src={product.images[currentImageIndex]}
            alt={product.name}
            className="w-full h-96 object-cover rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-between p-4">
            <button
              onClick={handlePrevImage}
              className="bg-white/80 p-2 rounded-full hover:bg-white"
            >
              <FaArrowLeft className="text-gray-800" />
            </button>
            <button
              onClick={handleNextImage}
              className="bg-white/80 p-2 rounded-full hover:bg-white"
            >
              <FaArrowRight className="text-gray-800" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600">Code: {product.code}</p>
          <p className="text-2xl font-bold text-blue-600">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-gray-700">Description: {product.description}</p>

          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
