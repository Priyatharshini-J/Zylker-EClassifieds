import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { removeFromCart, updateQuantity } from "../store/slices/cartSlice";

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state: RootState) => state.cart);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ id, quantity }));
    } else {
      dispatch(removeFromCart(id));
    }
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          Your cart is empty
        </h2>
        <button
          onClick={() => navigate("/app/index.html")}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-8">Shopping Cart</h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow"
          >
            <img
              src={item.images[0]}
              alt={item.name}
              className="w-24 h-24 object-cover rounded"
            />

            <div className="flex-1">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-gray-600">{item.code}</p>
              <p className="text-blue-600 font-bold">
                ${item.price.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                className="bg-gray-200 px-3 py-1 rounded"
              >
                -
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                className="bg-gray-200 px-3 py-1 rounded"
              >
                +
              </button>
            </div>

            <button
              onClick={() => dispatch(removeFromCart(item.id))}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between text-xl font-bold">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
