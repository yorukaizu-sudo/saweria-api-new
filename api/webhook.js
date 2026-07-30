import { addDonation } from './_storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body || {};
    console.log('Webhook received:', JSON.stringify(data));

    const donation = {
      id: Date.now() + Math.random(),
      username: data.donatur_name || data.donator_name || 'Anonymous',
      amount: parseInt(data.amount_raw) || parseInt(data.amount) || 0,
      message: data.message || data.donator_message || '',
      timestamp: Date.now(),
      source: 'saweria'
    };

    if (donation.amount < 1000) {
      return res.status(200).json({ status: 'rejected', reason: 'amount_too_small' });
    }

    const queueLength = await addDonation(donation);
    console.log(`Saved: ${donation.username} Rp${donation.amount} - Queue: ${queueLength}`);

    return res.status(200).json({
      status: 'success',
      donation: donation,
      queueLength: queueLength
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Webhook failed', message: err.message });
  }
}
