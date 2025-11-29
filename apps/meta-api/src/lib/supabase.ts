import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️ Supabase credentials not configured');
}

export { supabase };

// Helper to check if Supabase is available
export const isSupabaseEnabled = (): boolean => !!supabase;

// Realtime subscription helpers
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void
) => {
  if (!supabase) {
    console.warn('Supabase not enabled, skipping subscription');
    return null;
  }

  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType?: string
) => {
  if (!supabase) {
    throw new Error('Supabase not enabled');
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType });

  if (error) throw error;
  return data;
};

export const getFileUrl = (bucket: string, path: string): string | null => {
  if (!supabase) return null;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
