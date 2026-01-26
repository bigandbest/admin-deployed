# Navigation Between Admin and Seller Portals

## Portal Access

### Admin Portal
- **URL**: `http://localhost:5173/` or `http://localhost:5173/login`
- **Role Required**: `admin` or `super_admin`
- **Token Storage**: `admin_token`
- **Primary Color**: Red (#EF4444)

### Seller Portal  
- **URL**: `http://localhost:5173/seller/login`
- **Role Required**: `seller` or `vendor`
- **Token Storage**: `seller_token`
- **Primary Color**: Blue (#3B82F6)

## How to Navigate

### Option 1: Direct URL Access
Simply navigate to:
- Admin: `http://localhost:5173/login`
- Seller: `http://localhost:5173/seller/login`

### Option 2: Add Navigation Link (Optional)

If you want to add a link in the login page to switch portals, you can update the authentication forms:

#### In Admin Login Form
Add a link at the bottom:
```jsx
<Text align="center" mt="lg">
  Are you a seller?{" "}
  <Anchor href="/seller/login" className="text-red-500">
    Go to Seller Portal
  </Anchor>
</Text>
```

#### In Seller Login Form  
Already includes:
```jsx
<Text size="sm" c="dimmed" align="center" mt="md">
  Need help? Contact support
</Text>
```

You could add:
```jsx
<Text align="center" mt="lg">
  Are you an admin?{" "}
  <Anchor href="/login" className="text-blue-500">
    Go to Admin Portal
  </Anchor>
</Text>
```

## Portal Separation

### Independent Systems
- ✅ Separate authentication contexts
- ✅ Separate routing (`/admin/*` vs `/seller/*`)
- ✅ Separate token storage
- ✅ No UI interference
- ✅ Different navigation menus
- ✅ Different permissions

### Shared Components
- ✓ Mantine UI library
- ✓ Tailwind CSS
- ✓ Theme management (dark/light mode)
- ✓ Notification system
- ✓ Error boundaries

## Security

### Admin Cannot Access Seller Routes
- Admin token stored as `admin_token`
- Seller routes require `seller_token`
- Role check: `seller` or `vendor` required

### Seller Cannot Access Admin Routes
- Seller token stored as `seller_token`
- Admin routes require `admin_token`
- Role check: `admin` or `super_admin` required

## Testing

### Test Admin Access
1. Navigate to `/login`
2. Login with admin credentials
3. Should redirect to `/` (admin dashboard)
4. Cannot access `/seller/*` routes

### Test Seller Access
1. Navigate to `/seller/login`
2. Login with seller credentials (role: 'seller' or 'vendor')
3. Should redirect to `/seller/dashboard`
4. Cannot access admin routes (`/products`, `/users`, etc.)

## Visual Flow

```
User Request
    │
    ├─── /login ─────────────► Admin Authentication
    │                              │
    │                              ├─── Role: admin ──────► Admin Dashboard (/)
    │                              │
    │                              └─── Role: seller ─────► Error: No admin access
    │
    └─── /seller/login ──────────► Seller Authentication
                                      │
                                      ├─── Role: seller ───► Seller Dashboard (/seller/dashboard)
                                      │
                                      └─── Role: admin ────► Error: No seller access
```

## Backend Requirements

### User Table Schema
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'admin', 'seller', 'vendor', 'user'
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Example Users
```sql
-- Admin user
INSERT INTO users (email, password, role, name) 
VALUES ('admin@bbm.com', 'hashed_password', 'admin', 'Admin User');

-- Seller user
INSERT INTO users (email, password, role, name) 
VALUES ('seller@example.com', 'hashed_password', 'seller', 'John Seller');

-- Vendor user  
INSERT INTO users (email, password, role, name) 
VALUES ('vendor@example.com', 'hashed_password', 'vendor', 'Jane Vendor');
```

## Environment Variables

No changes needed! Both portals use the same:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

The backend will differentiate based on:
- Endpoint paths (`/api/admin-auth/*` vs `/api/seller-auth/*`)
- JWT token role claims
- Middleware role checks

---

**Summary**: The admin and seller portals are completely separate systems that share the same codebase but have different entry points, authentication flows, and UI layouts. No navigation link is required between them as they serve different user types.
