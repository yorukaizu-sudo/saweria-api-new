import { getDonations, getStats } from './_storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const stats = await getStats();
    const donations = await getDonations();

    return res.status(200).json({
      status: 'online',
      pending: donations.length,
      totalProcessed: stats.count,
      totalAmount: stats.amount,
      recent: donations.slice(-5),
      timestamp: Date.now()
    });
  } catch (err) {
    return res.status(500).json({ error: 'Stats failed', message: err.message });
  }
}
