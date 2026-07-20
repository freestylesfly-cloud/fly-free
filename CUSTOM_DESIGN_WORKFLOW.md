# 🎨 COMPLETE CUSTOM DESIGN WORKFLOW

## USER JOURNEY

### Step 1: User Starts Custom Design
- User navigates to `/custom-design`
- Clicks "Design Your Tee" button
- Must be logged in (redirected to login if not)

### Step 2: User Uploads & Configures Design
- Uploads design images (up to 3, PNG/JPG)
- Enters:
  - Design title (e.g., "Anime Collector Tee")
  - Description
  - Size (XS-XXL)
  - Color (Black, White, Navy, Gray, Red, Blue)
  - Placement (Front, Back, Front & Back, Sleeve)
  - Additional notes
- Sees canvas preview showing design on t-shirt
- Form validation ensures required fields filled

### Step 3: User Submits Request
- Clicks "Submit Design Request"
- System creates CustomDesign record in database with status: **PENDING**
- Images uploaded to Supabase storage
- Returns Order ID (e.g., "CUST-20260719-ABC123")
- Shows success message with Order ID
- Redirects to `/profile?tab=custom-orders`

### Step 4: System Sends Notifications
**Background Job Triggers:**

#### Admin Notification Email Sent To:
- `admin@flyfree.com`
- Email contains:
  - Design title & Order ID
  - User name, email, phone
  - Images uploaded (shown in email)
  - Link to admin dashboard filtered to this design
  - CTA: "View in Admin Dashboard"

#### User Confirmation Email:
- Design received confirmation
- Order ID confirmation
- Expected review timeline
- Link to track status in profile

### Step 5: User Sees in Profile
- Profile → "Custom Orders" tab
- Shows:
  - Design image thumbnail
  - Title, description
  - Size, color, placement
  - Status: **PENDING** (yellow badge)
  - "View Details" button
  - Empty price field (admin will set)

---

## ADMIN WORKFLOW

### Step 1: Admin Gets Notified
**Email Notification Received:**
- Subject: "🎨 New Custom Design: [Title]"
- Contains user details
- Shows all uploaded images
- Includes "View in Admin Dashboard" link

### Step 2: Admin Reviews Request
- Goes to `/admin/custom-orders`
- Sees all submitted custom designs
- Can filter by status (PENDING, APPROVED, REJECTED)
- Can search by title, user name, email, order ID
- Can sort by newest/oldest

### Step 3: Admin Views Full Details
- Clicks "View Details" button
- Modal shows:
  - All uploaded images (clickable to download)
  - Design title & description
  - Size, color, placement
  - Special notes/requirements
  - User contact information
  - Created date/time

### Step 4: Admin Sets Pricing
- Clicks "Set Price" button
- Modal shows price input field
- Considers:
  - Design complexity (hand-drawn vs simple)
  - Number of colors in design
  - Placement complexity
  - User's additional notes
  - Rush delivery request?
- Enters price in rupees (e.g., 59900 for ₹599)
- Saves price

### Step 5: Admin Approves/Rejects Design
- Clicks "Status" button
- Three options:
  - **PENDING** (current)
  - **APPROVED** (ready for user payment)
  - **REJECTED** (cannot produce)

**If APPROVED:**
- Status changes to APPROVED
- Price locked in
- User receives email notification with:
  - Approval confirmation
  - Final price
  - Link to checkout
  - Expected delivery timeline

**If REJECTED:**
- Admin can add rejection reason
- User receives email with:
  - Rejection notice
  - Reason why
  - Option to resubmit
  - Support contact info

### Step 6: Admin Can Download Files
- "Download" button for each image
- Useful for:
  - Printing team to review
  - Quality check
  - Production preparation
  - Archival

### Step 7: Admin Can Delete Request
- "Delete" button with confirmation
- Use if duplicate submitted
- Or if user requests removal

---

## EMAIL TEMPLATES

### Admin Notification
```
Subject: 🎨 New Custom Design: [Design Title]

Hi Admin,

A user has submitted a new custom design request.

Design Details:
- Title: [Design Title]
- Order ID: [ORDER_ID]
- User: [User Name]
- Email: [User Email]

Images Uploaded: [COUNT]
[IMAGES DISPLAYED]

Action Required:
1. Review the design in the admin dashboard
2. Set pricing based on complexity
3. Approve or reject the request
4. User will receive notification

[Button: View in Admin Dashboard]

Link: /admin/custom-orders?filter=[ORDER_ID]
```

### User Approval Email
```
Subject: ✅ Your Design "[Title]" Has Been Approved!

Hi [User Name],

Great news! Your custom design request has been approved.

Design: [Design Title]
Price: ₹[PRICE]

Your design is ready for production. Proceed to checkout:

[Button: Proceed to Checkout]
Link: /checkout?customDesignId=[ORDER_ID]

[Button: View in Profile]
Link: /profile?tab=custom-orders
```

### User Rejection Email
```
Subject: Update on Your Design "[Title]"

Hi [User Name],

We've reviewed your custom design request: [Design Title]

Status: Unable to proceed at this time
Reason: [REASON PROVIDED BY ADMIN]

You can:
- Submit a revised design
- Contact us for assistance
- Browse our existing collections

[Button: View Your Orders]
```

---

## DATABASE WORKFLOW

### CustomDesign Model
```javascript
{
  id: "cust_xyz123",
  userId: "user_123",
  title: "Anime Collector Tee",
  description: "Custom anime character design",
  images: [
    "https://supabase.com/images/design1.jpg",
    "https://supabase.com/images/design2.jpg"
  ],
  size: "M",
  color: "black",
  placement: "front",
  notes: "High quality print preferred",
  status: "APPROVED",    // PENDING | APPROVED | REJECTED
  price: 59900,          // Set by admin, null if pending
  createdAt: "2026-07-19T10:30:00Z",
  updatedAt: "2026-07-19T14:45:00Z"
}
```

---

## API ENDPOINTS

### User Endpoints
```
POST /api/ecommerce/custom-designs
- Create new design request
- Body: { title, description, images[], size, color, placement, notes }
- Returns: CustomDesign object with ID

GET /api/ecommerce/custom-designs
- Get user's own designs
- Returns: CustomDesign[] sorted by date

GET /api/ecommerce/custom-designs/:id
- Get specific design details
- Returns: CustomDesign with user details

DELETE /api/ecommerce/custom-designs/:id
- Delete user's design (only if PENDING)
- Returns: success message
```

### Admin Endpoints
```
GET /api/admin/custom-designs/all
- Get all custom designs
- Returns: CustomDesign[] with user details

PUT /api/admin/custom-designs/:id/status
- Update design status
- Body: { status: "APPROVED" | "REJECTED" }
- Triggers: Email notification to user

PUT /api/admin/custom-designs/:id/pricing
- Set custom price
- Body: { price: 59900 }
- Returns: Updated CustomDesign

GET /api/admin/custom-designs/stats
- Get statistics
- Returns: { total, pending, approved, rejected }
```

---

## NOTIFICATIONS SENT

### User Receives:
1. ✅ **Confirmation Email** - After submitting design
2. ✅ **Approval Email** - When admin approves (includes price)
3. ✅ **Rejection Email** - If admin rejects

### Admin Receives:
1. ✅ **Email Notification** - New design submitted
2. ✅ **Dashboard Alert** - Red badge on custom orders
3. ✅ **Filter View** - Can view by status

---

## SECURITY & VALIDATION

### User Side:
- JWT authentication required
- Only access own designs
- Cannot modify after submission
- Images must be valid PNG/JPG
- Max 10MB per image

### Admin Side:
- Admin guard protection on all endpoints
- Can view all designs
- Can set price and approve
- Can reject with reason
- Audit trail of changes

---

## NEXT STEPS AFTER APPROVAL

1. **User Sees Updated Profile:**
   - Status: APPROVED ✅
   - Price visible
   - "Proceed to Payment" button

2. **User Goes to Checkout:**
   - Custom design item in cart
   - Shows preview
   - Total price: Design price + delivery

3. **After Payment:**
   - Order created
   - Production team notified
   - User sees tracking in Orders

4. **Production & Delivery:**
   - Admin marks as "IN_PRODUCTION"
   - Admin marks as "SHIPPED"
   - User tracks delivery

---

## ADMIN MANAGEMENT CHECKLIST

- [ ] Check custom orders dashboard daily
- [ ] Review new pending designs
- [ ] Set appropriate pricing
- [ ] Approve designs with good quality
- [ ] Reject designs that can't be produced
- [ ] Send approval/rejection emails
- [ ] Download files for production team
- [ ] Track production status
- [ ] Notify users of shipment

---

## KEY FEATURES

✅ Canvas preview for users
✅ Email notifications for both
✅ Admin dashboard management
✅ Price setting by admin
✅ Status tracking by user
✅ Image upload & storage
✅ Order tracking
✅ User authentication
✅ Admin authentication
✅ Email templates
✅ Database relationships
✅ API endpoints secured

---

Generated: 2026-07-19
Version: 1.0 - Complete Custom Design System
