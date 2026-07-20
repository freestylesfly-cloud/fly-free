import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createBrowserClient(supabaseUrl, supabaseKey);
}

export { supabase };

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase upload is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

export async function uploadImage(bucket: string, file: File, folder = '') {
  const client = getSupabaseClient();
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await client.storage.from(bucket).upload(filePath, file, {
    cacheControl: '31536000',
    upsert: false
  });

  if (error) throw error;

  const { data: publicUrl } = client.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl.publicUrl as string;
}

export async function deleteImage(bucket: string, urlOrPath: string) {
  if (!urlOrPath) return;

  const client = getSupabaseClient();
  let path = urlOrPath;

  if (urlOrPath.includes('/storage/v1/object/public/')) {
    const publicPath = urlOrPath.split('/storage/v1/object/public/')[1] || '';
    const parts = publicPath.split('/');
    path = parts[0] === bucket ? parts.slice(1).join('/') : publicPath;
  }

  if (!path || path.startsWith('http')) return;

  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) throw error;
}
