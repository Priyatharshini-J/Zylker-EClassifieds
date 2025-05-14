import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OrderResponse } from "../types/index";
import { BASE_URL } from "../constants";
import axios from "axios";

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/server/zylker_eclassifieds_routes_handler/getOrder/${orderId}`
        );
        setOrder(res.data.data);
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="text-center py-20 text-lg">Loading order details...</div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-red-500">Order not found.</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <h2
        className={`text-3xl font-bold mb-4 ${
          order.status === "delivered" ? "text-green-600" : "text-blue-600"
        }`}
      >
        {order.status === "delivered"
          ? "Order Delivered Successfully!"
          : "Order Placed Successfully!"}
      </h2>
      <p className="text-xl mb-2">Order Number: #{orderId}</p>
      <p className="text-gray-600 mb-8">
        Your order has been{" "}
        {order.status === "delivered"
          ? "delivered. Hope you enjoy the product !!!"
          : "placed and is being processed.  You can track your order status using the order number above."}
        .
      </p>

      <div className="bg-white p-6 rounded-lg shadow mb-6 text-left">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Order Summary
        </h3>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between mb-4"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <span className="font-medium">
                  {item.name} × {item.quantity}
                </span>
              </div>
              <span className="font-semibold">
                ${(item.price || 0) * item.quantity}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>${order.total}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Estimated Delivery</h3>
          <p className="text-gray-600">
            Your order will be delivered within 3–5 business days.
          </p>
        </div>
        <button
          onClick={() => navigate("/app/index.html")}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default TrackOrder;
