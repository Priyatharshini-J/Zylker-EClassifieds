import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import ProductCard from "../components/ProductCard";
import { RootState } from "../store";
import { BASE_URL } from "../constants";

import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
} from "../store/slices/productSlice";

const Dashboard = () => {
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

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {loading ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-600">Loading products</h3>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-600">No products found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
