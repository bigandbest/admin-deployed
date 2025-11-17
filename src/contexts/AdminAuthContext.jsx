import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { adminLogin, adminLogout, getAdminMe } from "../utils/adminAuthApi";

// Create context
const AdminAuthContext = createContext();

// Custom hook to use the auth context
export const useAdminAuth = () => useContext(AdminAuthContext);

// Session timeout in milliseconds (15 minutes for admin security)
const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000;

// Provider component
export const AdminAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
    }, ADMIN_SESSION_TIMEOUT);
  };

  // Reset the session timeout on user activity
  const resetSessionTimeout = () => {
    if (currentUser && isAdmin) {
      startSessionTimeout();
    }
  };

  // Add event listeners for user activity
  useEffect(() => {
    if (currentUser && isAdmin) {
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
  }, [currentUser, isAdmin]);

  useEffect(() => {
    setLoading(true);

    const checkAuthStatus = async () => {
      try {
        const result = await getAdminMe();

        if (result.success && result.user) {
          setCurrentUser(result.user);
          setIsAdmin(result.user.user_metadata?.role === "admin");
          setError(null);
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err.message);
        setCurrentUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Authentication functions
  const loginUser = async (email, password) => {
    try {
      setError(null);
      const result = await adminLogin(email, password);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        const isAdminUser = result.user.user_metadata?.role === "admin";
        setIsAdmin(isAdminUser);
        // Store the access token in localStorage
        if (result.session?.access_token) {
          localStorage.setItem("admin_token", result.session.access_token);
        }
        startSessionTimeout();
        return { success: true, user: result.user, isAdmin: isAdminUser };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const registerAdminUser = async (name, email, password) => {
    // Admin registration should be handled through backend API
    // For now, return not implemented
    return {
      success: false,
      error: "Admin registration not available through frontend",
    };
  };

  const logoutUser = async () => {
    try {
      await adminLogout();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setCurrentUser(null);
      setIsAdmin(false);
      localStorage.removeItem("admin_token");
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Context value
  const value = {
    currentUser,
    isAdmin,
    isAuthenticated: !!currentUser && isAdmin,
    loading,
    error,
    login: loginUser,
    register: registerAdminUser,
    logout: logoutUser,
    resetSessionTimeout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
