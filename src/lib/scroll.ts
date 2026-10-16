/**
 * ক্যাটাগরি সিলেক্ট বা সার্চ করলে প্রোডাক্ট সেকশনে স্মুথ স্ক্রল করে।
 *
 * কেন আগের কোডে কাজ করত না:
 * ক্যাটাগরি বদলালে React রি-রেন্ডার করে সেকশনের জায়গা বদলে যায় (বা সেকশন নতুন করে তৈরি হয়)।
 * ক্লিকের সাথে সাথে স্ক্রল করলে তখন ভুল জায়গায় যেত বা থেমে যেত।
 * এখন রি-রেন্ডার শেষ হওয়া পর্যন্ত অপেক্ষা করে, স্টিকি হেডারের উচ্চতা বাদ দিয়ে ঠিক জায়গায় থামে।
 */

const CANDIDATE_IDS = [
  'products-section',
  'products',
  'product-section',
  'all-products',
  'product-grid',
];

const findProductsSection = (customId?: string): HTMLElement | null => {
  const ids = customId ? [customId, ...CANDIDATE_IDS] : CANDIDATE_IDS;
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
};

const getHeaderHeight = (): number => {
  const header = document.querySelector('header');
  return header ? header.getBoundingClientRect().height : 0;
};

const computeTop = (el: HTMLElement): number => {
  const top = el.getBoundingClientRect().top + window.scrollY - getHeaderHeight() - 8;
  return Math.max(top, 0);
};

export const scrollToProducts = (customId?: string): void => {
  if (typeof window === 'undefined') return;

  let tries = 0;
  const maxTries = 24; // সর্বোচ্চ প্রায় ১.২ সেকেন্ড পর্যন্ত সেকশনের জন্য অপেক্ষা

  const run = () => {
    const el = findProductsSection(customId);

    if (!el) {
      tries += 1;
      if (tries < maxTries) {
        setTimeout(run, 50);
      } else {
        console.warn(
          'scrollToProducts: প্রোডাক্ট সেকশন পাওয়া যায়নি। প্রোডাক্ট গ্রিডের wrapper এ id="products-section" আছে কিনা দেখুন।'
        );
      }
      return;
    }

    // লেআউট স্থির হওয়ার পর স্ক্রল
    requestAnimationFrame(() => {
      window.scrollTo({ top: computeTop(el), behavior: 'smooth' });

      // ছবি লোড হয়ে লেআউট সরে গেলে একবার সংশোধন
      setTimeout(() => {
        const again = findProductsSection(customId);
        if (!again) return;
        const target = computeTop(again);
        if (Math.abs(window.scrollY - target) > 40) {
          window.scrollTo({ top: target, behavior: 'smooth' });
        }
      }, 600);
    });
  };

  // state আপডেট ও রি-রেন্ডার শেষ হওয়ার জন্য সামান্য অপেক্ষা
  setTimeout(run, 80);
};