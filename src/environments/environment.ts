// ============================================================
// PRODUCTION ENVIRONMENT
// ============================================================
// Fill in your Supabase project details here after creating the project.
//
// REQUIRED VARIABLES (add to Netlify Site Settings → Environment Variables):
//   SUPABASE_URL       — Your Supabase project URL
//   SUPABASE_ANON_KEY  — Your Supabase anon/public key
//   RESEND_API_KEY     — Your Resend API key for email notifications
//
// YOUR_APP_URL placeholder: Replace with your actual deployed Netlify URL
// after the first deploy. Search for YOUR_APP_URL across the entire
// codebase to find all locations that need updating.

export const environment = {
  production: true,
  supabaseUrl: 'https://kvzdwaymgkzpnsjxeuym.supabase.co',
  supabaseAnonKey: 'sb_publishable_h97uld9goYv-0auNH9MMRA_O-LmFDUH',
  resendApiKey: '', // Add your Resend API key here (or use Netlify env var)
  appUrl: 'http://localhost:4200',
};
