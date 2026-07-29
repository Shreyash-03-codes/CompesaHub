// ============================================================
// DEVELOPMENT ENVIRONMENT
// ============================================================
// Copy this file or set these values in .env.local for local dev.
// These are NOT committed to git — .env.local is gitignored.
//
// REQUIRED VARIABLES:
//   SUPABASE_URL            — Your Supabase project URL
//   SUPABASE_ANON_KEY       — Your Supabase anon/public key
//   RESEND_API_KEY          — Your Resend API key
//
// YOUR_APP_URL placeholder: For local dev, use http://localhost:4200
// until you deploy. Search for YOUR_APP_URL across the codebase to
// update all locations after first Netlify deploy.

export const environment = {
  production: false,
  supabaseUrl: 'https://kvzdwaymgkzpnsjxeuym.supabase.co',
  supabaseAnonKey: 'sb_publishable_h97uld9goYv-0auNH9MMRA_O-LmFDUH',
  resendApiKey: '', // Add your Resend API key here
  appUrl: 'http://localhost:4200',
};
