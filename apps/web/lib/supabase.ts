import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload image to Supabase Storage
 * @param bucket - Storage bucket name (e.g., 'products', 'banners')
 * @param file - File to upload
 * @param folder - Optional folder path
 * @returns Promise with public URL
 */
export async function uploadImage(
  bucket: string,
  file: File,
  folder: string = ''
): Promise<string> {
  try {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Full file path
 */
export async function deleteImage(bucket: string, filePath: string): Promise<void> {
  try {
    // Extract path from URL if full URL is provided
    let path = filePath;
    if (filePath.includes('/storage/v1/')) {
      path = filePath.split('/storage/v1/object/public/')[1]?.split('/').slice(1).join('/') || filePath;
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Upload multiple images
 * @param bucket - Storage bucket name
 * @param files - Array of files
 * @param folder - Optional folder path
 * @returns Promise with array of public URLs
 */
export async function uploadMultipleImages(
  bucket: string,
  files: File[],
  folder: string = ''
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadImage(bucket, file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}
