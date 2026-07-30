let donations = [];
let totalStats = { count: 0, amount: 0, start: Date.now() };

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { method, url } = req;
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'saweria2024';

  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  // ROOT
  if (method === 'GET' && url === '/api') {
    return res.status(200).json({
      status: '🚀 Saweria API Running!',
      version: '3.0.0',
      time: new Date().toISOString(),
      pendingDonations: donations.length,
      totalProcessed: totalStats.count,
      apiKey: process.env.API_KEY ? 'Custom' : 'Default (saweria2024)',
      endpoints: {
        root: 'GET /api',
        webhook: 'POST /api/webhook',
        getdonations: 'GET /api/getdonations (x-api-key required)',
        test: 'POST /api/test (x-api-key required)',
        stats: 'GET /api/stats',
        health: 'GET /api/health'
      }
    });
  }

  // WEBHOOK - Saweria kirim ke sini
  if (method === 'POST' && url === '/api/webhook') {
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
        console.log('Rejected - too small:', donation.amount);
        return res.status(200).json({
          status: 'rejected',
          reason: 'amount_too_small',
          minimum: 1000
        });
      }

      donations.push(donation);
      totalStats.count++;
      totalStats.amount += donation.amount;

      if (donations.length > 100) donations.shift();

      console.log(`Saved: ${donation.username} - Rp${donation.amount}`);

      return res.status(200).json({
        status: 'success',
        donation: donation,
        pending: donations.length
      });

    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(500).json({ error: 'Webhook failed', message: err.message });
    }
  }

  // GET DONATIONS - Roblox ambil dari sini
  if (method === 'GET' && url === '/api/getdonations') {
    if (!apiKey || apiKey !== validKey) {
      console.log('Unauthorized attempt');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid x-api-key required'
      });
    }

    const result = [...donations];
    donations = [];

    console.log(`Sent ${result.length} donations to Roblox`);

    return res.status(200).json({
      success: true,
      donations: result,
      count: result.length,
      timestamp: Date.now()
    });
  }

  // TEST - Manual testing
  if (method === 'POST' && url === '/api/test') {
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

      donations.push(donation);
      totalStats.count++;
      totalStats.amount += donation.amount;

      console.log('Test donation added:', donation);

      return res.status(200).json({
        status: 'success',
        message: 'Test donation added!',
        donation: donation,
        pending: donations.length
      });

    } catch (err) {
      return res.status(500).json({ error: 'Test failed', message: err.message });
    }
  }

  // STATS
  if (method === 'GET' && url === '/api/stats') {
    const uptime = Math.floor((Date.now() - totalStats.start) / 1000);
    return res.status(200).json({
      uptime: uptime,
      pending: donations.length,
      totalProcessed: totalStats.count,
      totalAmount: totalStats.amount,
      recentDonations: donations.slice(-5)
    });
  }

  // HEALTH
  if (method === 'GET' && url === '/api/health') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: Date.now(),
      pending: donations.length
    });
  }

  // CLEAR QUEUE
  if (method === 'POST' && url === '/api/clear') {
    if (!apiKey || apiKey !== validKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const cleared = donations.length;
    donations = [];
    return res.status(200).json({
      status: 'success',
      cleared: cleared
    });
  }

  // 404
  return res.status(404).json({
    error: 'Not Found',
    path: url,
    method: method,
    available: [
      'GET /api',
      'POST /api/webhook',
      'GET /api/getdonations',
      'POST /api/test',
      'GET /api/stats',
      'GET /api/health'
    ]
  });
}
