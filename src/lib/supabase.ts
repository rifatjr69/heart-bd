import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Known admin emails for dev preview / instant admin verification
export const KNOWN_ADMINS = [
  'dj@gmail.com',
  'rifatkhan4054ff@gmail.com',
  'admin@littlehugbd.com',
  'admin@gmail.com',
];

// Fetch role strictly from Supabase database (with preview fallback)
export const fetchUserRoleFromDatabase = async (
  userId?: string | null,
  email?: string | null
): Promise<'admin' | 'customer'> => {
  const cleanEmail = email?.toLowerCase().trim() || '';

  // 1. If Supabase is configured and connected, query database
  if (isSupabaseConfigured && supabase) {
    try {
      // Check 1: profiles table by user UUID
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.role === 'admin') {
          return 'admin';
        }
      }

      // Check 2: profiles table by email
      if (cleanEmail) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('role')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (profileByEmail?.role === 'admin') {
          return 'admin';
        }

        // Check 3: admins table by email
        const { data: adminRow } = await supabase
          .from('admins')
          .select('email')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (adminRow) {
          return 'admin';
        }
      }
    } catch (err) {
      console.warn('Error checking admin role in Supabase:', err);
    }
  }

  // 2. Local dev / preview fallback: if user email is in KNOWN_ADMINS
  if (cleanEmail && KNOWN_ADMINS.includes(cleanEmail)) {
    return 'admin';
  }

  // 3. Check custom local storage overrides if any
  try {
    const savedAdmins = localStorage.getItem('littlehug_custom_admins');
    if (savedAdmins && cleanEmail) {
      const list = JSON.parse(savedAdmins);
      if (Array.isArray(list) && list.includes(cleanEmail)) {
        return 'admin';
      }
    }
  } catch {
    // Ignore storage parse error
  }

  return 'customer';
};

// Upload product image to Supabase Storage or fallback to base64 Data URL
export const uploadImageToSupabase = async (file: File): Promise<string> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `products/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload error, falling back to local base64:', err);
    }
  }

  // Base64 Data URL fallback for instant preview & persistence
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};
