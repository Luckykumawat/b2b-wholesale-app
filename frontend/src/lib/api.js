const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiUrl) {
  console.error('❌ NEXT_PUBLIC_API_URL is missing');
}

export const API_BASE_URL = rawApiUrl.replace(/\/$/, '');
