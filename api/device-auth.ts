import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = '89e64f2b-d768-4f42-a644-401b940fe536';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const response = await fetch('https://auth.silverfern.app/oauth2/device_authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      scope: 'openid offline_access',
    }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
