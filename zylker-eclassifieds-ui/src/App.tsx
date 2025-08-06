import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { store } from "./store";
import Navbar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import TrackOrder from "./pages/TrackOrder";
import MyOrdersPage from "./pages/MyOrdersPage";
import ChatPage from "./pages/ChatPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProductPage from "./pages/SellerProductPage";
import { useEffect, useState } from "react";
import { setUser } from "./store/slices/userSlice";
import { User } from "./types";
import { CLIENTID, STRATUS_BUCKET_URL } from "./constants";

function App() {
  // Retriving DC from STRATUS_BUCKET_URL
  const DC = STRATUS_BUCKET_URL.split(".")[2];
  const [isFetching, setIsFetching] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const Zcatalyst = (window as any).catalyst;
    // Verify if the user is authenticated; if yes, store their details in the `user` variable
    Zcatalyst.auth
      .isUserAuthenticated()
      .then((userData: any) => {
        const user: User = {
          userId: userData.content.user_id,
          name:
            (userData.content.first_name ? userData.content.first_name : "") +
            " " +
            (userData.content.last_name ? userData.content.last_name : ""),
          email: userData.content.email_id || "",
        };
        dispatch(setUser(user));
        setIsUserAuthenticated(true);
        // Execute query to determine if the current user has a stored refresh token
        let query = `SELECT * FROM Token where Token.userId = ${userData.content.user_id}`;
        let zcql = Zcatalyst.ZCatalystQL;
        let zcqlPromise = zcql.executeQuery(query);
        zcqlPromise
          .then((response: any) => {
            if (response.content.length === 0) {
              setShowConnect(true);
            }
          })
          .catch((err: any) => {
            console.error(err);
          });
      })
      .catch((err: any) => {
        console.error(err);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [dispatch]);

  const handleConnect = () => {
    // Handing ZOHO CRM Connect
    setShowConnect(false);
    window.location.href =
      `https://accounts.zoho.${DC}/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=${CLIENTID}&response_type=code&access_type=offline&redirect_uri=` +
      window.location.protocol +
      "//" +
      window.location.host +
      "/server/zylker_eclassifieds_routes_handler/generateRefreshToken";
  };

  return (
    <>
      {isFetching ? (
        <p className="loading">Loading ....</p>
      ) : isUserAuthenticated ? (
        showConnect ? (
          <div
            id="connect"
            style={{
              width: "500px",
              height: "260px",
              position: "absolute",
              top: "0",
              bottom: "0",
              left: "0",
              right: "0",
              margin: "auto",
            }}
          >
            <center>
              <p>Click here to connect to Zoho CRM</p>
              <button onClick={handleConnect}>
                <img
                  src="https://www.zohowebstatic.com/sites/default/files/styles/product-home-page/public/icon-crm_blue.png"
                  style={{ width: "180px", height: "130px" }}
                  alt="Zoho CRM"
                />
              </button>
            </center>
          </div>
        ) : (
          <Provider store={store}>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/app/index.html" element={<Dashboard />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/track/:orderId" element={<TrackOrder />} />
                    <Route path="/orders" element={<MyOrdersPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route
                      path="/seller/dashboard"
                      element={<SellerDashboard />}
                    />
                    <Route
                      path="/seller/products/:id"
                      element={<SellerProductPage />}
                    />
                  </Routes>
                </main>
              </div>
            </Router>
          </Provider>
        )
      ) : (
        (window.location.href = "/app/")
      )}
    </>
  );
}

export default App;
