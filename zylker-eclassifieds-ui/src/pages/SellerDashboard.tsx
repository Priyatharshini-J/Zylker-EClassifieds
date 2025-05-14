import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import { RootState } from "../store";
import { BASE_URL } from "../constants";

import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
} from "../store/slices/productSlice";
import { FaSearch, FaPlus } from "react-icons/fa";

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector(
    (state: RootState) => state.product
  );

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      dispatch(fetchProductsStart());
      try {
        const res = await axios.get(
          `${BASE_URL}/server/zylker_eclassifieds_routes_handler/crmProducts`
        );
        dispatch(fetchProductsSuccess(res.data));
      } catch (error: any) {
        dispatch(
          fetchProductsFailure(error.message || "Failed to fetch products")
        );
      }
    };

    fetchProducts();
  }, [dispatch]);

  const sellerProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">My Products</h2>
        <Link
          to="/seller/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add New Product</span>
        </Link>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-600">Loading products</h3>
          </div>
        ) : (
          sellerProducts.map((product) => (
            <Link
              key={product.id}
              to={`/seller/products/${product.id}`}
              className="group"
            >
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
          ))
        )}
      </div>

      {sellerProducts.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-600">No products found</h3>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
