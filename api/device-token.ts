import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = '89e64f2b-d768-4f42-a644-401b940fe536';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { device_code } = req.body;
  if (!device_code) return res.status(400).json({ error: 'device_code required' });

  const response = await fetch('https://auth.silverfern.app/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code,
    }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
