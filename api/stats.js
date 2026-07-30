import { getDonations, getStats } from './_storage.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const stats = getStats();
  const donations = getDonations();

  return res.status(200).json({
    status: 'online',
    pending: donations.length,
    totalProcessed: stats.count,
    totalAmount: stats.amount,
    recent: donations.slice(-5),
    timestamp: Date.now()
  });
}
