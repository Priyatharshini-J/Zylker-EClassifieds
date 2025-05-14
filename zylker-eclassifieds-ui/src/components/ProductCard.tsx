import { Link } from "react-router-dom";
import { Product } from "../types/index"; // if you have a type

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-shadow duration-300 group-hover:shadow-lg">
        <div className="aspect-w-1 aspect-h-1">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-64 object-cover transform transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{product.code}</p>
          <p className="text-xl font-bold text-blue-600">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
