# ⚡ Admin Dashboard - Quick Start

## 🚀 Access Admin Dashboard

```
http://localhost:3002/login
```

## 🔑 Login

**Email & Password**: Use any email + password  
**Note**: Dev mode accepts any credentials for testing

```javascript
// After login, your session is saved in localStorage:
localStorage.getItem('flyfree_admin_token')  // JWT token
localStorage.getItem('flyfree_admin_user')   // User info
```

## 📍 Pages

| Page | URL | Features |
|------|-----|----------|
| **Dashboard** | `/` | Revenue, Orders, Products, Users stats |
| **Products** | `/products` | Create, edit, delete products |
| **Orders** | `/orders` | View orders, update status |
| **Users** | `/users` | User management, analytics |
| **Email Management** | `/email` | Send emails (broadcast, promo, reviews, etc.) |
| **Settings** | `/settings` | Store configuration |

## 📧 Email Templates

### **1. Broadcast**
Send message to **all users**
- Subject line
- Message content
- Sent to entire user base

### **2. Promotional**
Send campaign with **promo code**
- Offer title
- Message
- Promo code (e.g., SUMMER20)
- Discount percentage

### **3. Review Request**
Request reviews for **specific order**
- Order ID
- Custom message (optional)

### **4. Invite**
**Invite new users** to join
- Email address
- Personal message (optional)

### **5. Custom Message**
Send **personalized** message to specific user
- User ID
- Subject
- Message
- File attachment (optional)

### **6. Statistics**
View **email campaign stats**
- Total emails sent
- Delivery rate
- Open rate

## 🔐 Session

### **Automatic**
✅ Session saved to localStorage  
✅ Persists across browser refresh  
✅ Survives tab close/reopen  

### **Manual Clear**
```javascript
localStorage.clear()  // Clear all sessions
window.location.href = '/login'
```

## 🚪 Logout

Click **Logout** button in dashboard header  
✅ Session cleared  
✅ Redirects to login  

## 🔄 Auto-Redirects

| Scenario | Behavior |
|----------|----------|
| **Visit /login while logged in** | → Redirects to / (dashboard) |
| **Visit /email while logged out** | → Redirects to /login?next=/email |
| **After login with ?next parameter** | → Redirects to original page |
| **Page refresh while logged in** | → Session restored, stays logged in |

## 🛠️ API Endpoints (Backend)

```
http://localhost:3001/api
```

### Auth
```
POST   /auth/admin/login        - Login
POST   /auth/admin/logout       - Logout
GET    /auth/admin/profile      - Get current admin
```

### Email
```
POST   /admin/email/send-broadcast          - Send to all users
POST   /admin/email/send-promotional        - Send campaign
POST   /admin/email/send-review-request     - Request reviews
POST   /admin/email/send-invite             - Invite users
POST   /admin/email/send-user-message       - Custom message
GET    /admin/email/stats                   - Get statistics
```

### Dashboard Data
```
GET    /admin/analytics/dashboard  - Dashboard stats
GET    /admin/analytics/sales      - Sales data
GET    /admin/analytics/revenue    - Revenue data
GET    /admin/analytics/orders     - Orders data
```

### Admin Operations
```
GET    /admin/products             - List products
POST   /admin/products             - Create product
PUT    /admin/products/:id         - Update product
DELETE /admin/products/:id         - Delete product

GET    /admin/orders               - List orders
GET    /admin/orders/:id           - Get order
PUT    /admin/orders/:id/status    - Update order status

GET    /admin/users                - List users
GET    /admin/users/:id            - Get user
PUT    /admin/users/:id            - Update user
```

## 🧪 Test Email Feature

1. **Login** to http://localhost:3002
2. **Navigate** to `/email`
3. **Click** "Broadcast" tab
4. **Fill form**:
   - Title: "Test Campaign"
   - Subject: "Test Subject"
   - Message: "Hello everyone!"
5. **Click** "Send to All Users"
6. **Expected**: Success message with count

## 🐛 Troubleshooting

### Session Lost After Refresh
```javascript
// Check localStorage
if (!localStorage.getItem('flyfree_admin_token')) {
  // Session expired, need to login again
  window.location.href = '/login'
}
```

### Can't Access Protected Routes
- Make sure you're logged in
- Check browser console for errors
- Verify API server running on 3001

### Email Send Fails
- Check network tab for API error
- Verify authorization header sent
- Ensure bearer token in localStorage

## 📞 Need Help?

Read full documentation:
- [AUTH_ADMIN_GUIDE.md](./AUTH_ADMIN_GUIDE.md) - Complete auth system
- [AUTH_AND_EMAIL_FIXES.md](./AUTH_AND_EMAIL_FIXES.md) - All fixes and features

---

**Everything is working and ready to use! 🎉**
