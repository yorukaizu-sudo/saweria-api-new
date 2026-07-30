import { getDonations, clearDonations } from './_storage.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'saweria2024';

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Valid x-api-key required' });
  }

  const donations = getDonations();
  clearDonations();

  console.log(`Sent ${donations.length} donations to Roblox`);

  return res.status(200).json({
    success: true,
    donations: donations,
    count: donations.length,
    timestamp: Date.now()
  });
}
