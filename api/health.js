import { getDonations } from './_storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const donations = await getDonations();
    return res.status(200).json({
      status: 'healthy',
      timestamp: Date.now(),
      pending: donations.length
    });
  } catch (err) {
    return res.status(500).json({ error: 'Health check failed' });
  }
}
