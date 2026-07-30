import { addDonation } from './_storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'saweria2024';

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = req.body || {};
    const donation = {
      id: Date.now() + Math.random(),
      username: String(body.username || 'TestUser').substring(0, 20),
      amount: parseInt(body.amount) || 10000,
      message: String(body.message || 'Test donation!').substring(0, 100),
      timestamp: Date.now(),
      source: 'test'
    };

    const queueLength = await addDonation(donation);
    console.log('Test donation added:', donation, 'Queue:', queueLength);

    return res.status(200).json({
      status: 'success',
      message: 'Test donation added!',
      donation: donation,
      queueLength: queueLength
    });

  } catch (err) {
    return res.status(500).json({ error: 'Test failed', message: err.message });
  }
}
