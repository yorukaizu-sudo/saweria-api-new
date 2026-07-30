import { getDonations } from './_storage.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    status: 'healthy',
    timestamp: Date.now(),
    pending: getDonations().length
  });
}
