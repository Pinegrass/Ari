const releaseProfiles = new Set(['preview', 'production']);
const profile = process.env.EAS_BUILD_PROFILE;

if (!releaseProfiles.has(profile)) {
  console.log(`[release-env] Skipping release checks for profile ${profile ?? 'local'}.`);
  process.exit(0);
}

const required = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SENTRY_DSN',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
  'GOOGLE_SERVICES_JSON',
];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  throw new Error(`[release-env] Missing required variables: ${missing.join(', ')}`);
}

for (const name of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_SUPABASE_URL']) {
  if (new URL(process.env[name]).protocol !== 'https:') {
    throw new Error(`[release-env] ${name} must use HTTPS.`);
  }
}

if (!process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY.startsWith('goog_')) {
  throw new Error('[release-env] RevenueCat Android key must be a Play public SDK key.');
}

console.log(`[release-env] ${profile} configuration is complete.`);
