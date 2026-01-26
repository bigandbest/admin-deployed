# Seller Dashboard - Quick Start Guide

## Access the Seller Portal

### URL
```
http://localhost:5173/seller/login
```

## Features Overview

### 📊 Dashboard
- Real-time statistics (Products, Orders, Earnings, Negotiations)
- Recent activity feed
- Quick stats overview

### 📦 Products Management
- View all your products with status
- Add new products (search existing or request new)
- Update offer prices
- Track approval status

### 🛒 Orders
- View orders containing your products
- See your earnings per order (Your Rate × Quantity)
- Track order status
- View detailed order information

### 🤝 Price Negotiations
- Review admin counter-offers
- Accept or decline with new counter-offer
- Track negotiation history
- Real-time status updates

### 💰 Earnings
- Total earnings summary
- Pending and paid amounts breakdown
- Transaction history with filters
- Period-based reports

### 🔔 Notifications
- Important alerts and updates
- Price negotiation notifications
- Order status changes

## File Structure Created

```
src/
├── contexts/
│   └── SellerAuthContext.jsx
├── utils/
│   ├── sellerAuthApi.js
│   └── sellerApi.js
├── Components/
│   └── Seller/
│       ├── SellerAuthenticationForm.jsx
│       ├── SellerProtectedRoute.jsx
│       ├── SellerLayout.jsx
│       ├── SellerSidebar.jsx
│       └── SellerHeader.jsx
└── Pages/
    └── Seller/
        ├── Dashboard.jsx
        ├── Orders.jsx
        ├── Earnings.jsx
        ├── Negotiations.jsx
        ├── Notifications.jsx
        └── Products/
            ├── index.jsx
            └── AddProduct.jsx
```

## Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/seller/login` | SellerAuthenticationForm | Login page |
| `/seller/dashboard` | Dashboard | Main dashboard |
| `/seller/products` | Products List | View all products |
| `/seller/add-product` | Add Product | Add new product/stock |
| `/seller/orders` | Orders | View orders |
| `/seller/negotiations` | Negotiations | Price negotiations |
| `/seller/earnings` | Earnings | Earnings tracker |
| `/seller/notifications` | Notifications | Alerts center |

## Next Steps for Backend Integration

1. **Create seller auth endpoints**:
   - `POST /api/seller-auth/login`
   - `GET /api/seller-auth/me`
   - `POST /api/seller-auth/logout`

2. **Create seller API endpoints**:
   - Products: `GET /api/seller/products`, `POST /api/seller/products/stock`
   - Orders: `GET /api/seller/orders`
   - Negotiations: `GET /api/seller/negotiations`, `POST /api/seller/negotiations/:id/accept`
   - Dashboard: `GET /api/seller/dashboard`
   - Earnings: `GET /api/seller/earnings`

3. **Add role check middleware**:
   ```javascript
   router.get('/products', authenticate, authorize('seller', 'vendor'), getSellerProducts);
   ```

4. **Update database schema**:
   - Add `role` column to users table
   - Create `seller_products` table
   - Create `negotiations` table

## Design System

### Colors
- **Primary**: Blue (#3B82F6) - Seller Portal
- **Success**: Green - Approved, Earnings
- **Warning**: Orange - Pending, Negotiations
- **Danger**: Red - Rejected, Alerts

### Components Used
- Mantine UI v7 (Cards, Tables, Modals, Forms)
- Tailwind CSS v4 (Utilities)
- React Icons (FA icons)
- Framer Motion (Animations)

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Security Features

✅ Role-based authentication
✅ Protected routes
✅ Session timeout (15 minutes)
✅ Activity-based token refresh
✅ Separate token storage

## Browser Compatibility

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## Performance

- Lazy loading for pages
- Optimized re-renders
- Pagination for large lists
- Debounced search inputs

---

For detailed documentation, see `SELLER_DASHBOARD_README.md`
