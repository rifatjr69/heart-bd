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

// Storage bucket নাম (supabase_storage_setup.sql এর সাথে মিল থাকতে হবে)
export const IMAGE_BUCKET = 'product-images';

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

// Supabase এর টেকনিক্যাল error কে বোঝার মতো বাংলা মেসেজে রূপান্তর
const friendlyStorageError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('bucket not found')) {
    return `Supabase এ "${IMAGE_BUCKET}" নামের bucket তৈরি করা নেই (supabase_storage_setup.sql চালান)`;
  }
  if (m.includes('row-level security') || m.includes('policy') || m.includes('unauthorized') || m.includes('not allowed')) {
    return 'আপলোডের অনুমতি নেই — Supabase অ্যাকাউন্টে লগইন করা আছে কিনা এবং storage policy ঠিক আছে কিনা দেখুন';
  }
  if (m.includes('payload too large') || m.includes('exceeded the maximum')) {
    return 'ছবির সাইজ অনেক বড়, ছোট ছবি দিন';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'ইন্টারনেট বা Supabase সংযোগে সমস্যা';
  }
  return message;
};

// Upload image to Supabase Storage.
// Supabase কনফিগার করা থাকলে আপলোড ব্যর্থ হলে error ছুঁড়বে (আর চুপচাপ base64 এ যাবে না)।
// শুধু Supabase কনফিগার না থাকলে (লোকাল প্রিভিউ) base64 ব্যবহার হবে।
export const uploadImageToSupabase = async (file: File): Promise<string> => {
  if (isSupabaseConfigured && supabase) {
    const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileExt = /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : 'jpg';
    const cleanFileName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `products/${cleanFileName}`;

    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(friendlyStorageError(error.message));
    }

    const { data: publicUrlData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('আপলোড হয়েছে কিন্তু ছবির পাবলিক লিঙ্ক পাওয়া যায়নি (bucket টি Public করুন)');
    }

    return publicUrlData.publicUrl;
  }

  // Supabase কনফিগার করা নেই: লোকাল প্রিভিউয়ের জন্য base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('ছবি পড়া যায়নি'));
    reader.readAsDataURL(file);
  });
};