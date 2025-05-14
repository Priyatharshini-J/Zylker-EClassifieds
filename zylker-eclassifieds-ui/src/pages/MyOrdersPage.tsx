import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useEffect, useState } from "react";
import { BASE_URL } from "../constants";
import { Order } from "../types/index";
import axios from "axios";
import { FaBox, FaShippingFast, FaCheckCircle, FaClock } from "react-icons/fa";

const statusIcons = {
  Pending: <FaClock className="text-yellow-500" />,
  Processing: <FaBox className="text-blue-500" />,
  Shipped: <FaShippingFast className="text-purple-500" />,
  Delivered: <FaCheckCircle className="text-green-500" />,
};

const MyOrdersPage = () => {
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/server/zylker_eclassifieds_routes_handler/getOrders`
        );
        setUserOrders(res.data.data);
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-8">Your Orders</h2>

      {userOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-xl text-gray-600">No orders found</h3>
          <Link
            to="/"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {userOrders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Order #{order.orderId}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {statusIcons[order.status]}
                  <span className="font-medium">{order.status}</span>
                </div>
              </div>

              <div className="border-t border-b py-4 my-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 mb-4 last:mb-0"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Estimated Delivery:{" "}
                    {new Date(
                      new Date(order.createdAt).setDate(
                        new Date(order.createdAt).getDate() + 5
                      )
                    ).toLocaleDateString()}
                  </p>
                  <p className="font-medium">Total: ${order.total}</p>
                </div>
                <Link
                  to={`/track/${order.orderId}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
