# 🎨 CUSTOM DESIGN WORKFLOW - VISUAL FLOWCHART

## USER FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER JOURNEY                                │
└─────────────────────────────────────────────────────────────────┘

1. USER VISITS /custom-design
   ↓
2. UPLOADS IMAGES (up to 3)
   - Title, description, size, color, placement
   - Special notes/requirements
   ↓
3. CLICKS "SUBMIT DESIGN REQUEST"
   ↓
4. SYSTEM CREATES RECORD (Status: PENDING)
   - Saves images to Supabase
   - Generates Order ID
   - Creates CustomDesign in database
   ↓
5. SENDS EMAILS
   ├─→ User: "Design received"
   └─→ Admin: "New custom design submitted!"
   ↓
6. USER REDIRECTED TO PROFILE
   └─→ /profile?tab=custom-orders
   └─→ Sees design with PENDING status
   └─→ No price yet
   ↓
7. USER WAITS FOR ADMIN REVIEW
   ├─→ Can view design details
   ├─→ Can view status
   └─→ Receives email when approved
```

---

## ADMIN FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN WORKFLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. ADMIN RECEIVES EMAIL NOTIFICATION
   - Subject: "🎨 New Custom Design: [Title]"
   - Shows user info
   - Shows uploaded images
   - Button: View in Dashboard
   ↓
2. ADMIN VISITS /admin/custom-orders
   - Sees new design in list
   - Status: PENDING
   ↓
3. ADMIN CLICKS "VIEW DETAILS"
   - Modal shows:
   - All uploaded images
   - Design specs (size, color, placement)
   - User contact info
   - Special requirements
   ↓
4. ADMIN CAN DOWNLOAD IMAGES
   - For production team
   - For quality review
   ↓
5. ADMIN CLICKS "SET PRICE"
   - Modal shows price input
   - Enters price (e.g., 59900 for ₹599)
   - Considers complexity, colors, placement
   ↓
6. ADMIN CLICKS "UPDATE STATUS"
   - Options:
   ├─ PENDING (keep reviewing)
   ├─ APPROVED (sends approval email to user)
   └─ REJECTED (sends rejection email)
   ↓
7A. IF APPROVED:
   - Status: APPROVED ✅
   - Price locked in
   - User receives email with:
     - Approval ✅
     - Price: ₹599
     - Checkout link
   ↓
7B. IF REJECTED:
   - Status: REJECTED ❌
   - User receives email with:
     - Rejection notice
     - Reason why
     - Option to resubmit
```

---

## DATABASE CHANGES

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE UPDATES                              │
└─────────────────────────────────────────────────────────────────┘

CustomDesign TABLE:
├─ id: (auto-generated)
├─ userId: (linked to User)
├─ title: "Anime Collector Tee"
├─ description: "Custom anime design..."
├─ images: ["url1", "url2", "url3"]
├─ size: "M"
├─ color: "black"
├─ placement: "front"
├─ notes: "High quality preferred"
├─ status: PENDING → APPROVED/REJECTED
├─ price: null → 59900 (admin sets)
├─ createdAt: (timestamp)
└─ updatedAt: (timestamp)

RELATIONS:
- User (1) ← → (Many) CustomDesign
  └─ User can have multiple designs
  └─ Admin can see all designs
```

---

## EMAIL NOTIFICATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                   EMAIL NOTIFICATIONS                            │
└─────────────────────────────────────────────────────────────────┘

STAGE 1: USER SUBMITS DESIGN
│
├─→ EMAIL TO ADMIN
│   Subject: 🎨 New Custom Design: [Title]
│   ├─ User name, email, phone
│   ├─ Design title & Order ID
│   ├─ All uploaded images
│   ├─ Special requirements
│   └─ Button: View in Dashboard
│
└─→ EMAIL TO USER
    Subject: Design Received! Order #[ID]
    ├─ Confirmation of submission
    ├─ Order ID for reference
    ├─ Expected review time
    └─ Link to track in profile

STAGE 2: ADMIN APPROVES DESIGN
│
└─→ EMAIL TO USER
    Subject: ✅ Your Design "[Title]" Approved!
    ├─ Approval confirmation
    ├─ Final price: ₹599
    ├─ Design specs
    ├─ Button: Proceed to Checkout
    └─ Expected delivery timeline

STAGE 3: ADMIN REJECTS DESIGN
│
└─→ EMAIL TO USER
    Subject: Update on Your Design "[Title]"
    ├─ Rejection notice
    ├─ Reason provided by admin
    ├─ Option to resubmit
    ├─ Support contact info
    └─ Link to submit new design
```

---

## KEY SCREENS & UI

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                                │
└─────────────────────────────────────────────────────────────────┘

SCREEN 1: /custom-design (Upload Page)
┌──────────────────────────────────────────────────┐
│ Design Your Tee                                  │
│                                                  │
│ [Drag & Drop Images Here] (up to 3)             │
│ [Image Preview Grid]                            │
│                                                  │
│ Design Title: [_____________]                   │
│ Description: [_________________]                │
│ Size: [Dropdown M ▼]                            │
│ Color: [Dropdown Black ▼]                       │
│ Placement: [Dropdown Front ▼]                   │
│ Special Notes: [_________________]              │
│                                                  │
│ [Canvas Preview of Design on T-shirt]          │
│                                                  │
│ [Submit Design Request Button]                  │
└──────────────────────────────────────────────────┘

SCREEN 2: /profile?tab=custom-orders (User Tracking)
┌──────────────────────────────────────────────────┐
│ Custom Orders                                    │
│                                                  │
│ ┌─ Design 1: "Anime Collector Tee" ─────┐     │
│ │ [Image] Title                          │     │
│ │        Size: M | Color: Black          │     │
│ │        Status: PENDING ⏳              │     │
│ │        Price: (Not set yet)            │     │
│ │        [View Details]                  │     │
│ └────────────────────────────────────────┘     │
│                                                  │
│ ┌─ Design 2: "Custom Logo Tee" ───────┐       │
│ │ [Image] Title                        │       │
│ │        Size: L | Color: White        │       │
│ │        Status: APPROVED ✅           │       │
│ │        Price: ₹599                   │       │
│ │        [Proceed to Payment]           │       │
│ └───────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘

SCREEN 3: /admin/custom-orders (Admin Dashboard)
┌──────────────────────────────────────────────────┐
│ Custom Orders Management                         │
│                                                  │
│ [Search Box] [Filter: All ▼] [Sort: Newest ▼] │
│                                                  │
│ ┌─ "Anime Collector Tee" ──────────────────┐  │
│ │ [Design Image] | Title, Size, Color     │  │
│ │ User: John Doe | john@email.com         │  │
│ │ Status: PENDING                         │  │
│ │ [Details] [Set Price] [Status] [Delete] │  │
│ └─────────────────────────────────────────┘  │
│                                                  │
│ ┌─ "Logo Design" ──────────────────────────┐  │
│ │ [Design Image] | Title, Size, Color     │  │
│ │ User: Jane Smith | jane@email.com       │  │
│ │ Status: APPROVED | Price: ₹599          │  │
│ │ [Details] [Set Price] [Status] [Delete] │  │
│ └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## CANVAS PREVIEW

```
┌──────────────────────────────────────────────────┐
│          DESIGN PREVIEW ON T-SHIRT               │
├──────────────────────────────────────────────────┤
│                                                  │
│            ┌─────────────────────┐             │
│            │    [SLEEVE]         │             │
│        ────┼─────────────────────┼────         │
│       │    │  [Design Image]     │    │       │
│       │    │  [Anime Character]  │    │       │
│   [S] │    │   on Front          │    │ [S]   │
│   [L] │    │                     │    │ [L]   │
│   [E] │    │                     │    │ [E]   │
│   [E] │    │                     │    │ [E]   │
│   [V] │    │ [T-shirt Color]     │    │ [V]   │
│   [E] │    │                     │    │ [E]   │
│       │    │                     │    │       │
│        ────┤─────────────────────├────        │
│            │                     │             │
│            └─────────────────────┘             │
│                                                  │
│ Color: Black | Placement: Front | Size: M     │
│                                                  │
│ ℹ️ Preview shows how design will look on shirt │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## SEQUENCE DIAGRAM

```
USER              FRONTEND           BACKEND           EMAIL SERVICE
  │                  │                  │                    │
  │─ Click Submit ──→│                  │                    │
  │                  │ POST /api/       │                    │
  │                  │ custom-designs──→│                    │
  │                  │                  │ Save to DB         │
  │                  │                  │ (Status: PENDING)  │
  │                  │ ←── Order ID ───│                    │
  │                  │                  │ Send Emails ──────→│
  │ ←─ Show Success ─│                  │                    │
  │   Order ID       │                  │ Admin Email ────→ ADMIN
  │                  │                  │                    │
  │                  │                  │ User Email ────→ USER
  │                  │                  │                    │
  │ Redirect to      │                  │                    │
  │ Profile Tab      │                  │                    │
  │                  │ GET /profile/    │                    │
  │                  │ custom-orders ──→│                    │
  │                  │ ←── Designs ─────│                    │
  │ ←─ Show Designs ─│ (Status: PENDING)│                    │
  │ (PENDING)        │                  │                    │
  │                  │                  │                    │

TIME PASSES - ADMIN REVIEWS

ADMIN              DASHBOARD          BACKEND           EMAIL
  │                  │                  │                │
  │ View Dashboard   │                  │                │
  │─ /admin/        ─│                  │                │
  │ custom-orders    │ GET /admin/      │                │
  │                  │ custom-designs ─→│                │
  │ ←─ All Designs ──│ ←── Designs ─────│                │
  │                  │                  │                │
  │ Set Price        │                  │                │
  │─ PUT /api/      ─│ PUT /admin/      │                │
  │ pricing          │ pricing ────────→│ Save Price     │
  │                  │                  │                │
  │ Approve Design   │                  │                │
  │─ PUT /api/      ─│ PUT /admin/      │                │
  │ status           │ status ─────────→│ Update Status  │
  │                  │                  │ Send Email ───→ USER
  │                  │                  │                │
  │ ←─ Success ──────│ ←── Updated ─────│                │
  │                  │                  │ Approval Email→ USER
  │                  │                  │ (w/ Price)     │

USER SEES UPDATE IN PROFILE

USER               PROFILE            BACKEND
  │                  │                  │
  │ Refresh Profile  │                  │
  │─ /profile       ─│ GET /api/        │
  │                  │ custom-designs ─→│
  │ ←─ Design Info ──│ ←── Updated ─────│
  │ (Status: APPROVED)│ (w/ Price)      │
  │ (Price: ₹599)    │                  │
  │                  │                  │
  │ Proceed to Pay   │                  │
  │─ /checkout      ─│ → Checkout Flow  │
```

---

Generated: 2026-07-19
Visual Workflow Reference
