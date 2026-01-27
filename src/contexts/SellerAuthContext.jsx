import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { sellerLogin, sellerLogout, getSellerMe } from "../utils/sellerAuthApi";

// Create context
const SellerAuthContext = createContext();

// Custom hook to use the auth context
export const useSellerAuth = () => useContext(SellerAuthContext);

// Session timeout in milliseconds (15 minutes)
const SELLER_SESSION_TIMEOUT = 15 * 60 * 1000;

// Provider component
export const SellerAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  // Function to start the session timeout
  const startSessionTimeout = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      // Log the user out when the session expires
      logoutUser();
    }, SELLER_SESSION_TIMEOUT);
  };

  // Reset the session timeout on user activity
  const resetSessionTimeout = () => {
    if (currentUser && isSeller) {
      startSessionTimeout();
    }
  };

  // Add event listeners for user activity
  useEffect(() => {
    if (currentUser && isSeller) {
      // Start the initial timeout
      startSessionTimeout();

      // Events that reset the timeout
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
      ];

      // Add event listeners
      events.forEach((event) => {
        window.addEventListener(event, resetSessionTimeout);
      });

      // Clean up event listeners
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        events.forEach((event) => {
          window.removeEventListener(event, resetSessionTimeout);
        });
      };
    }
  }, [currentUser, isSeller]);

  useEffect(() => {
    setLoading(true);

    const checkAuthStatus = async () => {
      try {
        // Check if we have a stored token
        const storedToken = localStorage.getItem("seller_token");

        if (!storedToken) {
          // No token, user is not logged in
          setCurrentUser(null);
          setIsSeller(false);
          setLoading(false);
          return;
        }

        // Try to verify the token with the backend
        const result = await getSellerMe();

        if (result.success && result.user) {
          const user = result.user;

          // Check if user has seller role
          const hasSellerRole = user.role?.toLowerCase() === "seller" || 
                               user.role?.toLowerCase() === "vendor";

          if (hasSellerRole) {
            setCurrentUser(user);
            setIsSeller(true);
          } else {
            // User exists but is not a seller
            localStorage.removeItem("seller_token");
            setCurrentUser(null);
            setIsSeller(false);
          }
        } else {
          // Token is invalid
          localStorage.removeItem("seller_token");
          setCurrentUser(null);
          setIsSeller(false);
        }
      } catch (err) {
        console.error("Error checking seller auth status:", err);
        localStorage.removeItem("seller_token");
        setCurrentUser(null);
        setIsSeller(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const result = await sellerLogin(email, password);

      if (result.success && result.token) {
        // Store the token
        localStorage.setItem("seller_token", result.token);

        // Check if user has seller role
        const hasSellerRole = result.user.role?.toLowerCase() === "seller" || 
                             result.user.role?.toLowerCase() === "vendor";

        if (hasSellerRole) {
          setCurrentUser(result.user);
          setIsSeller(true);
          startSessionTimeout();
          return { success: true, isSeller: true, user: result.user };
        } else {
          // User exists but is not a seller
          localStorage.removeItem("seller_token");
          setError("You do not have seller access");
          return { success: false, error: "You do not have seller access" };
        }
      } else {
        setError(result.error || "Login failed");
        return { success: false, error: result.error || "Login failed" };
      }
    } catch (err) {
      const errorMessage = err.message || "An error occurred during login";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logoutUser = async () => {
    try {
      await sellerLogout();
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      // Clear the token and user data
      localStorage.removeItem("seller_token");
      setCurrentUser(null);
      setIsSeller(false);
      setError(null);

      // Clear the session timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const value = {
    currentUser,
    isSeller,
    loading,
    error,
    login,
    logout: logoutUser,
    setError,
  };

  return (
    <SellerAuthContext.Provider value={value}>
      {children}
    </SellerAuthContext.Provider>
  );
};
