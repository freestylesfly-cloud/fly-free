# Product Structure & Hamper System Guide

## 🎯 Understanding the System

### **What We Sell:**
- **T-Shirts** as base products
- **Organized by Themes** (Spider-Man, Marvel, Movies, etc.)
- **Organized by Collections** (New Collection, Summer 2026, etc.)
- **Different for Gender** (Men, Women, Unisex)
- **Different Sizes & Prices** (XS, S, M, L, XL, XXL)
- **Optional Hamper Boxes** (Gift boxes with extras inside)

---

## 📦 Database Structure

### **1. Product (Base T-Shirt)**
```
├── id: "prod-123"
├── name: "Spider-Man Classic T-Shirt"
├── sku: "SP-MAN-001"
├── price: 499 (base price)
├── mrp: 799
├── gender: "UNISEX"
├── categoryId: "cat-001" (e.g., "T-Shirts")
├── collectionId: "col-001" (e.g., "Marvel Collection")
├── themeId: "theme-001" (e.g., "Spider-Man Theme")
├── images: [
│   { url: "spider-man-front.jpg", color: "Red", priority: 1 },
│   { url: "spider-man-back.jpg", color: "Red", priority: 2 }
│ ]
└── variants: [
    { size: "M", color: "Red", price: 499 },
    { size: "L", color: "Red", price: 549 },
    { size: "XL", color: "Blue", price: 599 }
  ]
```

### **2. ProductHamper (Optional Gift Box)**
```
├── id: "hamper-123"
├── productId: "prod-123" (links to product)
├── name: "Spider-Man Deluxe Box"
├── description: "T-Shirt + Poster + Mug + Sticker Pack"
├── contents: ["T-Shirt", "Poster", "Mug", "Stickers"]
├── images: ["hamper-box-front.jpg", "hamper-box-side.jpg"]
├── price: 899 (additional cost)
├── isActive: true
└── priority: 1
```

### **3. Theme (Product Theme)**
```
├── id: "theme-001"
├── name: "Spider-Man"
├── slug: "spider-man"
├── description: "Spider-Man themed collection"
├── primaryColor: "#ff0000"
├── collections: [
│   { id: "col-001", name: "Marvel Collection" },
│   { id: "col-002", name: "Summer 2026" }
│ ]
└── products: [
    { id: "prod-123", name: "Spider-Man Classic" },
    { id: "prod-124", name: "Spider-Man Miles" }
  ]
```

### **4. Collection (Product Collection)**
```
├── id: "col-001"
├── name: "Marvel Collection"
├── slug: "marvel-collection"
├── description: "All Marvel themed t-shirts"
├── imageUrl: "marvel-collection.jpg"
└── products: [
    { id: "prod-123", theme: "Spider-Man" },
    { id: "prod-125", theme: "Iron-Man" },
    { id: "prod-126", theme: "Captain America" }
  ]
```

---

## 🛒 Customer Journey

### **Step 1: Browse Products**
```
Customer visits store
  ↓
Sees Themes: "Spider-Man", "Marvel", "Movies", etc.
  ↓
Selects Theme: "Spider-Man"
  ↓
Sees Collections in theme: "New Collection", "Summer 2026", etc.
  ↓
Sees Products in collection: "Classic T-Shirt", "Miles Morales", etc.
```

### **Step 2: View Product Details**
```
Product Page Shows:
├── Base Price: ₹499
├── MRP: ₹799
├── All Sizes & Variations:
│   ├── Size M - ₹499
│   ├── Size L - ₹549
│   └── Size XL - ₹599
├── Different Colors:
│   ├── Red
│   ├── Blue
│   └── Black
├── Images:
│   ├── Front view
│   ├── Back view
│   └── Detail shots
└── Optional Hamper Boxes:
    ├── Standard Box: +₹100
    ├── Deluxe Box: +₹250
    └── Premium Box: +₹450
```

### **Step 3: Add to Cart**
```
Customer Chooses:
├── Base T-Shirt: Spider-Man (Red, Size L) - ₹549
├── Hamper Box: Deluxe Box (poster + mug) - +₹250
├── Quantity: 2
└── Total: (549 + 250) × 2 = ₹1,598
```

### **Step 4: Order Confirmation**
```
Order Details:
├── Product: Spider-Man Classic T-Shirt (Red, L)
├── Price: ₹549
├── Hamper: Deluxe Box with poster + mug
├── Hamper Price: ₹250
├── Quantity: 2
├── Subtotal: ₹1,598
├── Tax: ₹239 (15% GST)
└── Total: ₹1,837
```

---

## 👨‍💼 Admin Management

### **Manage Themes**
```
Admin → Themes
  ├── Create New Theme
  │   ├── Name: "Spider-Man"
  │   ├── Color Scheme
  │   ├── Description
  │   └── Priority
  │
  ├── View Theme Details
  │   ├── Products in theme
  │   ├── Collections
  │   ├── Sales stats
  │   └── Performance
  │
  └── Edit/Delete Theme
```

### **Manage Collections**
```
Admin → Collections
  ├── Create Collection
  │   ├── Name
  │   ├── Theme (Spider-Man)
  │   ├── Description
  │   └── Products
  │
  └── Assign Products to Collection
```

### **Manage Products**
```
Admin → Products
  ├── Create Product
  │   ├── Basic Info (name, sku, description)
  │   ├── Pricing (base, MRP, discount)
  │   ├── Theme & Collection
  │   ├── Gender (M/F/Unisex)
  │   ├── Images
  │   ├── Variants (sizes, colors, individual prices)
  │   └── Hamper Boxes (optional gift boxes)
  │
  ├── Edit Product
  │   └── Update any field
  │
  └── View Details
      ├── Sales info
      ├── Stock levels
      └── Customer reviews
```

### **Manage Hamper Boxes**
```
Admin → Products → [Product] → Hamper Boxes
  ├── Create Hamper
  │   ├── Name: "Deluxe Box"
  │   ├── Contents: ["Poster", "Mug", "Stickers"]
  │   ├── Images
  │   ├── Price: ₹250
  │   ├── Description
  │   └── Active Status
  │
  └── Edit/Delete Hamper
```

### **Filters & Search**
```
Admin Dashboard Filters:
├── By Theme: Spider-Man, Marvel, Movies
├── By Collection: New, Summer, Winter
├── By Gender: Men, Women, Unisex
├── By Price Range: ₹100-₹1000
├── By Stock Status: In Stock, Low Stock, Out
├── By Visibility: Active, Inactive, Featured
└── Search by: Name, SKU, ID
```

---

## 💻 Frontend Display

### **Product Card** (in shop)
```
┌─────────────────────┐
│   [Image]           │
│ Spider-Man Tee      │
│ ₹499 - ₹599         │
│ 5.0 ⭐ (128 reviews)│
│ M, L, XL available  │
│ [Add to Cart]       │
└─────────────────────┘
```

### **Product Detail Page**
```
Left: Image Gallery
├── Main Image (large)
└── Thumbnails (different angles)

Right: Product Info
├── Name: Spider-Man Classic T-Shirt
├── Price: ₹499 - ₹599
├── Rating: 5.0 ⭐
├── 
├── Size Selector
│   └── S(₹499) L(₹549) XL(₹599)
│
├── Color Selector
│   └── Red, Blue, Black
│
├── Optional Hampers
│   ├── ☐ Standard Box +₹100
│   ├── ☐ Deluxe Box +₹250
│   └── ☐ Premium Box +₹450
│
├── Quantity: [1] [+][-]
├── 
└── [Add to Cart] [Add to Wishlist]

Bottom: Description, Reviews, Related
```

---

## ✅ Checklist

### **Database Setup**
- [x] Product table (base t-shirt info)
- [x] ProductVariant table (sizes, colors, prices)
- [x] ProductHamper table (gift boxes)
- [x] Theme table (collections/themes)
- [x] Collection table (product collections)
- [x] ProductImage table (images)

### **Admin Features**
- [ ] Theme CRUD (Create, Read, Update, Delete)
- [ ] Collection CRUD
- [ ] Product CRUD with variants
- [ ] Hamper CRUD
- [ ] Filter & Search
- [ ] Bulk import/export

### **Frontend Features**
- [ ] Theme browsing
- [ ] Collection browsing
- [ ] Product details with all variants
- [ ] Hamper selection
- [ ] Add to cart with options
- [ ] Wishlist

### **Checkout**
- [ ] Cart summary showing product + hamper
- [ ] Price calculation (product + hamper)
- [ ] GST calculation
- [ ] Order confirmation

---

## 🔧 Important Notes

1. **Price Calculation:**
   - Base product has base price
   - Each variant can have different price
   - Hamper adds to total price
   - GST applies to total

2. **Hamper is Optional:**
   - Customer can buy t-shirt without hamper
   - Or choose from available hampers
   - Hamper increases price but adds value

3. **Theme vs Collection:**
   - **Theme**: Brand/character (Spider-Man, Marvel)
   - **Collection**: Time-based or series (New, Summer, Deluxe)

4. **Gender Organization:**
   - Products tagged as Men/Women/Unisex
   - Filter by gender in shop

5. **Images:**
   - Each product has multiple images
   - Each variant can have variant-specific images
   - Hamper has hamper-specific images

---

## 🎯 Next Steps

1. ✅ Understand this structure
2. ⏳ Verify admin pages work with this model
3. ⏳ Test product creation with variants & hampers
4. ⏳ Test cart with hamper selection
5. ⏳ Test checkout & order confirmation

