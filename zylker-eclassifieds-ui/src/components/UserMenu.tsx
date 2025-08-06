import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaComments,
  FaQuestionCircle,
  FaPhone,
  FaSignOutAlt,
  FaList,
  FaStore,
} from "react-icons/fa";

interface UserMenuProps {
  userName: string;
}

const UserMenu = ({ userName }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Function to handle user logout
  const handleLogout = () => {
    var redirectURL = "/";
    var auth = (window as any).catalyst.auth;
    // Trigger the sign-out process and redirect the user to the specified URL
    auth.signOut(redirectURL);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-full transition-colors"
      >
        <FaUser className="text-gray-700" />
        <span className="text-gray-700">{userName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          <Link
            to="/seller/dashboard"
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            <FaStore className="text-gray-600" />
            <span>Seller Dashboard</span>
          </Link>
          <Link
            to="/orders"
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            <FaList className="text-gray-600" />
            <span>My Orders</span>
          </Link>

          <Link
            to="/faq"
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            <FaQuestionCircle className="text-gray-600" />
            <span>FAQ</span>
          </Link>

          <Link
            to="/chat"
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            <FaComments className="text-gray-600" />
            <span>Chat with us</span>
          </Link>

          <Link
            to="/contact"
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            <FaPhone className="text-gray-600" />
            <span>Contact Us</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors text-left"
          >
            <FaSignOutAlt className="text-gray-600" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
