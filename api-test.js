// Simple API test to verify the products endpoint
const API_BASE_URL = "http://localhost:8000/api";

async function testProductsAPI() {
  try {
    console.log("Testing products API endpoint...");
    
    // Test the corrected endpoint
    const response = await fetch(`${API_BASE_URL}/productsroute/allproducts`);
    const data = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", data);
    
    if (response.ok) {
      console.log("✅ Products API is working!");
      console.log("Number of products:", data.products?.length || data.data?.length || 0);
    } else {
      console.log("❌ Products API failed:", data.error || data.message);
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

async function testWarehousesAPI() {
  try {
    console.log("Testing warehouses API endpoint...");
    
    const response = await fetch(`${API_BASE_URL}/warehouses`);
    const data = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", data);
    
    if (response.ok) {
      console.log("✅ Warehouses API is working!");
      console.log("Number of warehouses:", data.data?.length || 0);
    } else {
      console.log("❌ Warehouses API failed:", data.error || data.message);
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

// Run tests
testProductsAPI();
testWarehousesAPI();