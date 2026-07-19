import { useState } from 'react';
import { uploadMultipleImages, deleteImage } from '../lib/supabase';

interface ProductImage {
  id?: string;
  url: string;
  color?: string;
  alt?: string;
  priority?: number;
}

export function useProductImages() {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addImage = (url: string, color?: string, alt?: string) => {
    const newImage: ProductImage = {
      id: Math.random().toString(),
      url,
      color,
      alt,
      priority: images.length,
    };
    setImages([...images, newImage]);
  };

  const removeImage = async (id: string, url?: string) => {
    try {
      if (url) {
        await deleteImage('products', url);
      }
      setImages(images.filter(img => img.id !== id));
    } catch (err) {
      setError('Failed to delete image');
      console.error(err);
    }
  };

  const updateImage = (id: string, updates: Partial<ProductImage>) => {
    setImages(images.map(img =>
      img.id === id ? { ...img, ...updates } : img
    ));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);

    // Update priorities
    newImages.forEach((img, idx) => {
      img.priority = idx;
    });

    setImages(newImages);
  };

  const uploadBatch = async (files: File[], color?: string) => {
    try {
      setLoading(true);
      const urls = await uploadMultipleImages('products', files, 'product-images');

      urls.forEach(url => {
        addImage(url, color);
      });

      return urls;
    } catch (err) {
      setError('Failed to upload images');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    try {
      setLoading(true);

      // Delete all images from storage
      await Promise.all(
        images.map(img => deleteImage('products', img.url))
      );

      setImages([]);
    } catch (err) {
      setError('Failed to clear images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    images,
    loading,
    error,
    addImage,
    removeImage,
    updateImage,
    reorderImages,
    uploadBatch,
    clearAll,
    setImages,
  };
}
