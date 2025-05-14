import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaShoppingCart } from "react-icons/fa";
import { RootState } from "../store";
import UserMenu from "./UserMenu";

const Navbar = () => {
  const { items } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.user);
  const cartItemsCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-2">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/app/index.html"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Zylker
          </Link>

          <div className="flex items-center space-x-6">
            <UserMenu userName={user?.name || ""} />
            <Link
              to="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Shopping Cart"
            >
              <FaShoppingCart className="text-gray-700 text-xl" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
