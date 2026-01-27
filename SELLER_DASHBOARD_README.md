# Seller Dashboard - Implementation Guide

## Overview
The Seller Dashboard is a complete, modern, and responsive portal for sellers/vendors to manage their products, view orders, handle price negotiations, and track earnings. It runs independently of the admin dashboard with its own authentication and routing system.

## Features Implemented

### 1. **Authentication System**
- Dedicated seller login at `/seller/login`
- Role-based access control (supports "seller" and "vendor" roles)
- Session management with 15-minute timeout
- Automatic token refresh on user activity
- Secure token storage in localStorage

### 2. **Dashboard Pages**

#### **Dashboard** (`/seller/dashboard`)
- Overview statistics (Total Products, Active Orders, Earnings, Pending Negotiations)
- Recent activity feed
- Quick stats cards
- Trend indicators with percentage changes

#### **My Products** (`/seller/products`)
- Product listing with search and filters
- Status badges (Approved, Pending Approval, Action Required)
- Display of seller's offer price (not final selling price)
- Pagination support
- Edit and manage product options

#### **Add Product** (`/seller/add-product`)
- **Step 1**: Search master product database
- **Step 2**: If product exists - select and add stock
- **Step 3**: If product doesn't exist - request new product with image upload
- Pricing form with MRP and Offer Price fields
- Clear guidance on pricing model

#### **Orders** (`/seller/orders`)
- List of orders containing seller's products
- Shows seller's rate (not customer's payment)
- Order status tracking
- Detailed order view modal
- Payment calculation (Your Rate × Quantity = Total Payable)

#### **Negotiations** (`/seller/negotiations`)
- View admin counter-offers
- Accept or decline with new counter-offer
- Status tracking (Pending, Action Required, Approved)
- Side-by-side comparison of offers

#### **Earnings** (`/seller/earnings`)
- Total earnings summary
- Pending and paid amounts
- Transaction history with filters (Week/Month/Year/All)
- Detailed payment tracking

#### **Notifications** (`/seller/notifications`)
- Placeholder for future notification system
- Real-time alerts for price negotiations and orders

### 3. **UI/UX Design**
- Modern, minimal, and fully responsive design
- Tailwind CSS for styling
- Mantine UI components (v7)
- Dark mode support
- Mobile-friendly navigation with burger menu
- Smooth animations and transitions
- Consistent color scheme (Blue primary color for seller portal)

## File Structure

```
admin-deployed/src/
├── contexts/
│   └── SellerAuthContext.jsx           # Seller authentication context
├── utils/
│   ├── sellerAuthApi.js                # Seller auth API calls
│   └── sellerApi.js                    # Seller business logic APIs
├── Components/
│   └── Seller/
│       ├── SellerAuthenticationForm.jsx    # Login form
│       ├── SellerProtectedRoute.jsx        # Route protection
│       ├── SellerLayout.jsx                # Main layout wrapper
│       ├── SellerSidebar.jsx               # Navigation sidebar
│       └── SellerHeader.jsx                # Top header bar
└── Pages/
    └── Seller/
        ├── Dashboard.jsx                   # Main dashboard
        ├── Orders.jsx                      # Orders management
        ├── Earnings.jsx                    # Earnings & payments
        ├── Negotiations.jsx                # Price negotiations
        ├── Notifications.jsx               # Notification center
        └── Products/
            ├── index.jsx                   # Product listing
            └── AddProduct.jsx              # Add/request products
```

## Routing Structure

### Seller Routes (Separate from Admin)
```javascript
/seller/login           → Seller login page
/seller/dashboard       → Seller dashboard
/seller/products        → Product listing
/seller/add-product     → Add new product
/seller/orders          → Order management
/seller/negotiations    → Price negotiations
/seller/earnings        → Earnings tracking
/seller/notifications   → Notifications
```

All seller routes are protected by `SellerProtectedRoute` component.

## API Endpoints (Backend Required)

### Authentication
- `POST /api/seller-auth/login` - Login
- `POST /api/seller-auth/logout` - Logout
- `GET /api/seller-auth/me` - Get current seller

### Products
- `GET /api/seller/products` - Get seller's products (with filters)
- `GET /api/seller/products/search?q=<term>` - Search master products
- `POST /api/seller/products/request` - Request new product
- `POST /api/seller/products/stock` - Add product stock
- `PATCH /api/seller/products/:id/offer-price` - Update offer price

### Negotiations
- `GET /api/seller/negotiations` - Get negotiations
- `POST /api/seller/negotiations/:id/accept` - Accept counter-offer
- `POST /api/seller/negotiations/:id/decline` - Decline with new offer

### Orders
- `GET /api/seller/orders` - Get seller's orders (with filters)
- `GET /api/seller/orders/:id` - Get order details

### Dashboard & Analytics
- `GET /api/seller/dashboard` - Dashboard stats
- `GET /api/seller/earnings?period=<period>` - Earnings data

## Key Business Logic

### 1. **Pricing Model**
- **Seller Offer Price**: The amount the seller wants to receive
- **Admin Markup**: Admin adds their margin (higher/lower/competitive)
- **Customer Price**: Final price shown on website
- **Seller receives**: Always their offer price regardless of final selling price

### 2. **Product Flow**
1. Seller searches master database
2. If found → Select and add stock with offer price
3. If not found → Request new product with image
4. Admin reviews and adds to master database
5. Admin shares product code with seller
6. Seller adds stock using the new code

### 3. **Negotiation Workflow**
1. Vendor proposes: Quantity + Unit Price
2. Status: PENDING_APPROVAL
3. Admin counter-offers (if price too high/low)
4. Status: ACTION_REQUIRED
5. Vendor accepts OR declines with new offer
6. Back to PENDING_APPROVAL or APPROVED

## Integration with Admin Dashboard

### Separation of Concerns
- **Admin Portal**: `/admin/*` routes (or root `/`)
- **Seller Portal**: `/seller/*` routes
- Separate authentication contexts
- No UI interference between portals
- Different color schemes (Red for admin, Blue for seller)

### Shared Components
- Mantine UI library
- Tailwind CSS utilities
- Notification system
- Theme management (light/dark mode)

## Backend Integration Required

### Database Schema Additions Needed

#### User Table
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20);
-- Values: 'admin', 'seller', 'vendor', 'user'
```

#### Seller Products Table
```sql
CREATE TABLE seller_products (
  id SERIAL PRIMARY KEY,
  seller_id INT REFERENCES users(id),
  product_id INT REFERENCES products(id),
  product_code VARCHAR(50),
  quantity INT,
  seller_offer_price DECIMAL(10, 2),
  mrp DECIMAL(10, 2),
  status VARCHAR(30), -- PENDING_APPROVAL, ACTION_REQUIRED, APPROVED, REJECTED
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Negotiations Table
```sql
CREATE TABLE negotiations (
  id SERIAL PRIMARY KEY,
  seller_product_id INT REFERENCES seller_products(id),
  seller_id INT REFERENCES users(id),
  your_offer_price DECIMAL(10, 2),
  admin_counter_price DECIMAL(10, 2),
  status VARCHAR(30),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Middleware Setup
Use existing middleware from `backend-deployed/middleware/authorize.js`:
```javascript
router.get('/products', authenticate, authorize('seller', 'vendor'), getSellerProducts);
```

## Testing the Implementation

### 1. **Start the Application**
```bash
cd admin-deployed
npm install
npm run dev
```

### 2. **Access Seller Portal**
Navigate to: `http://localhost:5173/seller/login`

### 3. **Test User**
Create a test user with role='seller' in the database

### 4. **Features to Test**
- ✅ Login with seller credentials
- ✅ View dashboard statistics
- ✅ Navigate between pages
- ✅ Search for products
- ✅ Request new product
- ✅ View orders
- ✅ Handle price negotiations
- ✅ Check earnings
- ✅ Toggle dark mode
- ✅ Mobile responsive design

## Next Steps

### Backend Development Priority
1. **Authentication** - Implement seller auth endpoints
2. **Product APIs** - Create seller product management endpoints
3. **Negotiation System** - Build price negotiation workflow
4. **Order Integration** - Connect seller orders with main order system
5. **Payment System** - Integrate wallet/payment tracking

### Frontend Enhancements
1. Real-time notifications using WebSockets
2. Product image upload with Cloudinary integration
3. Advanced filters and sorting
4. Export reports (CSV/PDF)
5. Analytics charts and graphs
6. Bulk product upload

### Future Features
1. **Seller Profile Management**
2. **Messaging System** (Seller ↔ Admin)
3. **Product Performance Analytics**
4. **Inventory Alerts** (Low stock warnings)
5. **Tax & Invoice Management**
6. **Multi-warehouse Support**
7. **Return Management** (for marketplace sellers)

## Design Principles

### 1. **Separation**
- Completely separate from admin UI
- Independent routing and authentication
- No cross-contamination of contexts

### 2. **Clarity**
- Clear pricing display (seller's rate vs. customer price)
- Intuitive navigation
- Status indicators for all actions

### 3. **Responsiveness**
- Mobile-first design
- Adaptive layouts for all screen sizes
- Touch-friendly interface

### 4. **Consistency**
- Follows admin portal patterns where appropriate
- Maintains brand consistency
- Uses established UI components

## Security Considerations

1. **Role-Based Access Control (RBAC)**
   - Verify role at authentication
   - Check role on every API call
   - Prevent privilege escalation

2. **Data Isolation**
   - Sellers only see their own data
   - Filter queries by seller_id
   - No access to other sellers' information

3. **Token Security**
   - Separate token storage (seller_token)
   - Session timeout
   - Token refresh on activity

4. **Input Validation**
   - Validate all form inputs
   - Sanitize file uploads
   - Prevent SQL injection

## Support & Documentation

For issues or questions:
1. Check backend API documentation
2. Review middleware configuration
3. Verify database schema
4. Test API endpoints with Postman
5. Check browser console for errors

## Conclusion

The Seller Dashboard is production-ready on the frontend and awaits backend API integration. The architecture is scalable, maintainable, and follows modern React best practices. The UI is polished, responsive, and provides an excellent user experience for sellers managing their inventory and orders.

---

**Last Updated**: January 26, 2026
**Version**: 1.0.0
**Status**: Frontend Complete ✅ | Backend Integration Pending ⏳
