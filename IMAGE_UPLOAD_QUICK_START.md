# Image Upload System - Quick Start Guide 🚀

## What's Implemented

### 1. **ImageUpload Component** 
📄 `apps/web/app/components/ImageUpload.tsx`

Features:
- ✅ Drag-and-drop support
- ✅ Click to browse device files
- ✅ Image crop and rotate (with zoom slider)
- ✅ Real-time preview
- ✅ Multiple file upload
- ✅ Delete with confirmation
- ✅ Responsive grid preview
- ✅ File validation (type, size)

### 2. **Supabase Integration**
📄 `apps/web/lib/supabase.ts`

Functions:
- ✅ `uploadImage()` - Single file upload
- ✅ `deleteImage()` - Storage cleanup
- ✅ `uploadMultipleImages()` - Batch upload

### 3. **Product Images Hook**
📄 `apps/web/hooks/useProductImages.ts`

Manages:
- ✅ Add/remove images
- ✅ Reorder images
- ✅ Update image properties
- ✅ Batch upload
- ✅ Clear all images

---

## Quick Setup (5 steps)

### Step 1: Add Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 2: Create Supabase Buckets
In Supabase dashboard → Storage:
- Create `products` bucket (Public)
- Create `banners` bucket (Public)

### Step 3: Use in Component
```tsx
import { ImageUpload } from '@/app/components/ImageUpload';

<ImageUpload
  bucket="products"
  folder="product-images"
  onUpload={(url) => {
    console.log('Image uploaded:', url);
    // Save to database
  }}
  multiple={true}
/>
```

### Step 4: Save URLs to Database
```typescript
// After upload, save the URL
await fetch('/api/products', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Product',
    images: [{ url, color, alt, priority }]
  })
});
```

### Step 5: Deploy
- Supabase handles storage
- URLs are permanent
- No additional server needed

---

## Usage Examples

### Example 1: Single Banner Image
```tsx
<ImageUpload
  bucket="banners"
  onUpload={(url) => setBannerUrl(url)}
  maxSize={15}
  multiple={false}
/>
```

### Example 2: Multiple Product Images
```tsx
const { images, addImage } = useProductImages();

<ImageUpload
  bucket="products"
  onUpload={(url) => addImage(url)}
  multiple={true}
/>
```

### Example 3: With Crop Control
```tsx
<ImageUpload
  bucket="products"
  onUpload={async (url) => {
    // Image is already cropped
    // Save to DB
  }}
  maxSize={10}
  acceptedFormats={['image/jpeg', 'image/png']}
/>
```

---

## File Flow

```
User selects image from device
        ↓
Image preview + crop/rotate controls
        ↓
User adjusts zoom, rotation, angle
        ↓
Click "Upload"
        ↓
File uploaded to Supabase Storage
        ↓
Public URL generated
        ↓
Return URL to component
        ↓
Display in preview grid
        ↓
User saves to database
        ↓
Product created with image URL
```

---

## Features Breakdown

### Crop & Edit
- 🔍 Zoom in/out with slider
- 🔄 360° rotation
- 📐 Real-time preview
- ✂️ Automatic crop on upload

### Storage Management
- 📦 Automatic Supabase upload
- 🔗 Public URL generation
- 🗑️ Delete with cleanup
- 📁 Organized folders

### User Experience
- 📱 Mobile & desktop responsive
- ⌛ Loading states
- ⚠️ Error handling
- 👁️ Thumbnail grid
- 🎯 Drag-drop support

### Security
- ✅ File type validation
- 📊 Size limits (configurable)
- 🔒 Public/Private buckets
- 🗝️ RLS policies

---

## API Reference

### Component Props
```typescript
<ImageUpload
  bucket="products"           // Supabase bucket
  folder="product-images"     // Optional folder
  onUpload={(url) => {}}      // Success callback
  onRemove={(url) => {}}      // Delete callback
  maxSize={10}                // Max MB
  acceptedFormats={[...]}     // MIME types
  multiple={true}             // Multi-file?
  initialImage=""             // Pre-loaded image
/>
```

### Hook Methods
```typescript
const {
  images,              // Array of images
  loading,            // Upload status
  error,              // Error message
  addImage(url),      // Add image
  removeImage(id),    // Remove by ID
  uploadBatch(files), // Upload multiple
  clearAll(),         // Delete all
} = useProductImages();
```

---

## Common Tasks

### Task 1: Upload Product Image
```tsx
const { images, addImage } = useProductImages();

<ImageUpload
  bucket="products"
  onUpload={(url) => {
    addImage(url, 'Black', 'Product front view');
  }}
/>
```

### Task 2: Update Product Images
```tsx
const handleSave = async () => {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      images: images.map((img, i) => ({
        url: img.url,
        color: img.color,
        alt: img.alt,
        priority: i
      }))
    })
  });
};
```

### Task 3: Delete Image
```tsx
const handleDelete = async (imageUrl: string) => {
  await removeImage(imageId, imageUrl);
  // Automatically deleted from Supabase
};
```

### Task 4: Reorder Images
```tsx
const handleDragEnd = (result) => {
  if (result.destination) {
    reorderImages(result.source.index, result.destination.index);
  }
};
```

---

## Checklist for Integration

- [ ] Add Supabase env variables
- [ ] Create storage buckets
- [ ] Set RLS policies
- [ ] Import ImageUpload component
- [ ] Configure bucket name
- [ ] Add onUpload callback
- [ ] Test with local file
- [ ] Verify URL in database
- [ ] Check Supabase dashboard
- [ ] Test deletion
- [ ] Deploy to production

---

## Next Steps

1. **Create Admin Page** - Use ImageUpload in admin product form
2. **Add to Products** - Display images on product detail pages
3. **Gallery View** - Create image carousel/lightbox
4. **Image Optimization** - Add server-side compression
5. **Bulk Upload** - Support ZIP file uploads
6. **Mobile Gallery** - Responsive image swiper
7. **Image Versioning** - Keep upload history

---

## Support Files

- 📘 Detailed Guide: `IMAGE_UPLOAD_SYSTEM.md`
- 🧩 Component: `apps/web/app/components/ImageUpload.tsx`
- 🔧 Utilities: `apps/web/lib/supabase.ts`
- 🎣 Hook: `apps/web/hooks/useProductImages.ts`

---

## Key Capabilities

✅ **Local Upload** - Users upload from their device
✅ **Image Crop** - Edit before uploading
✅ **Multiple Files** - Upload multiple at once
✅ **Storage Cleanup** - Auto-delete when removed
✅ **URL Persistence** - Public URLs saved to DB
✅ **Mobile Ready** - Works on mobile & tablet
✅ **Admin & User** - Available for both roles
✅ **No Backend File Handling** - Supabase does it all

---

Your image upload system is ready! 🎉
