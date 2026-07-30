// SAWERIA WEBHOOK API - VERCEL SERVERLESS
// Memory storage (resets on cold start)
let donations = [];

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, url } = req;
  console.log(`[${method}] ${url}`);

  // ===== ROOT ENDPOINT =====
  if (method === 'GET' && url === '/api') {
    return res.json({
      status: '🚀 Saweria API Server Running!',
      version: '1.0.0',
      time: new Date().toISOString(),
      endpoints: {
        root: 'GET /api',
        webhook: 'POST /api/webhook - Terima dari Saweria',
        getdonations: 'GET /api/getdonations - Untuk Roblox (butuh x-api-key)',
        test: 'POST /api/test - Test manual (butuh x-api-key)'
      },
      pendingDonations: donations.length
    });
  }

  // ===== WEBHOOK ENDPOINT =====
  if (method === 'POST' && url === '/api/webhook') {
    try {
      const data = req.body || {};
      
      console.log('🎉 Saweria webhook data:', JSON.stringify(data, null, 2));

      const donation = {
        id: Date.now() + Math.random(),
        username: data.donatur_name || data.donator_name || 'Anonymous',
        amount: parseInt(data.amount_raw) || parseInt(data.amount) || 0,
        message: data.message || data.donator_message || '',
        timestamp: Date.now(),
        source: 'saweria'
      };

      if (donation.amount >= 1000) {
        donations.push(donation);
        
        // Keep max 50 donations
        if (donations.length > 50) {
          donations.shift();
        }
        
        console.log(`✅ Donation saved: ${donation.username} - Rp${donation.amount}`);
        
        return res.json({
          status: 'success',
          donation: donation,
          total: donations.length
        });
      } else {
        console.log(`⚠️ Donation too small: Rp${donation.amount}`);
        return res.json({ status: 'ignored', reason: 'amount_too_small' });
      }
      
    } catch (error) {
      console.error('❌ Webhook error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // ===== GET DONATIONS ENDPOINT =====
  if (method === 'GET' && url === '/api/getdonations') {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY || 'test123';
    
    if (!apiKey || apiKey !== validKey) {
      return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
    }

    try {
      const result = [...donations];
      donations = []; // Clear after sending
      
      console.log(`📤 Sent ${result.length} donations to Roblox`);
      
      return res.json({
        donations: result,
        count: result.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ GetDonations error:', error);
      return res.status(500).json({ error: 'Failed to get donations' });
    }
  }

  // ===== TEST ENDPOINT =====
  if (method === 'POST' && url === '/api/test') {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY || 'test123';
    
    if (!apiKey || apiKey !== validKey) {
      return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
    }

    try {
      const { username = 'TestUser', amount = 10000, message = 'Test donation!' } = req.body || {};
      
      const testDonation = {
        id: Date.now() + Math.random(),
        username: username,
        amount: parseInt(amount),
        message: message,
        timestamp: Date.now(),
        source: 'test'
      };

      donations.push(testDonation);
      
      console.log('🧪 Test donation added:', testDonation);
      
      return res.json({
        status: 'Test donation added!',
        donation: testDonation,
        total: donations.length
      });
      
    } catch (error) {
      console.error('❌ Test error:', error);
      return res.status(500).json({ error: 'Test failed' });
    }
  }

  // ===== 404 NOT FOUND =====
  return res.status(404).json({
    error: 'Not Found',
    method: method,
    url: url,
    available: ['/api', '/api/webhook', '/api/getdonations', '/api/test']
  });
}
