// ========================================
//         SAWERIA WEBHOOK API
//         COMPLETE ALL ENDPOINTS
// ========================================

// Global storage (in-memory, resets on cold start)
let donations = [];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, url } = req;
  console.log(`[${method}] ${url} - ${new Date().toISOString()}`);

  // Get API key for secured endpoints
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'test123';

  // ===== ROOT ENDPOINT =====
  if (method === 'GET' && url === '/api') {
    return res.json({
      status: '🚀 Saweria API Server Running!',
      version: '1.0.0',
      time: new Date().toISOString(),
      endpoints: {
        root: 'GET /api - Server info',
        webhook: 'POST /api/webhook - Terima dari Saweria',
        getdonations: 'GET /api/getdonations - Untuk Roblox (butuh x-api-key)',
        test: 'POST /api/test - Test manual (butuh x-api-key)'
      },
      pendingDonations: donations.length,
      apiKeySet: process.env.API_KEY ? 'Custom' : 'Default (test123)',
      lastDonation: donations.length > 0 ? donations[donations.length - 1] : null
    });
  }

  // ===== WEBHOOK ENDPOINT (dari Saweria) =====
  if (method === 'POST' && url === '/api/webhook') {
    try {
      const data = req.body || {};
      
      console.log('🎉 Webhook received from Saweria:');
      console.log(JSON.stringify(data, null, 2));

      const donation = {
        id: Date.now() + Math.random(),
        username: data.donatur_name || data.donator_name || 'Anonymous',
        amount: parseInt(data.amount_raw) || parseInt(data.amount) || 0,
        message: data.message || data.donator_message || '',
        timestamp: Date.now(),
        source: 'saweria',
        rawData: data
      };

      // Validasi minimum amount
      if (donation.amount < 1000) {
        console.log(`⚠️ Donation too small: Rp${donation.amount} (min: Rp1000)`);
        return res.json({ 
          status: 'ignored', 
          reason: 'amount_too_small',
          amount: donation.amount,
          minAmount: 1000
        });
      }

      // Simpan donasi
      donations.push(donation);
      
      // Keep max 50 donations in memory
      if (donations.length > 50) {
        donations.shift();
      }
      
      console.log(`✅ Donation saved: ${donation.username} - Rp${donation.amount}`);
      console.log(`📊 Total pending donations: ${donations.length}`);
      
      return res.json({
        status: 'success',
        message: 'Donation received and saved successfully!',
        donation: {
          id: donation.id,
          username: donation.username,
          amount: donation.amount,
          message: donation.message,
          timestamp: donation.timestamp,
          source: donation.source
        },
        totalPending: donations.length
      });
      
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Failed to process webhook',
        error: error.message 
      });
    }
  }

  // ===== GET DONATIONS ENDPOINT (untuk Roblox) =====
  if (method === 'GET' && url === '/api/getdonations') {
    if (!apiKey || apiKey !== validKey) {
      console.log('🚫 Unauthorized getdonations attempt');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Valid x-api-key header required',
        provided: apiKey ? 'invalid key' : 'no key provided'
      });
    }

    try {
      // Get all pending donations
      const result = [...donations];
      
      // Clear donations after retrieval (consumed by Roblox)
      donations = [];
      
      console.log(`📤 Sending ${result.length} donations to Roblox`);
      if (result.length > 0) {
        console.log('Donations:', result.map(d => `${d.username}:Rp${d.amount}`).join(', '));
      }
      
      return res.json({
        donations: result,
        count: result.length,
        timestamp: Date.now(),
        status: 'success'
      });
      
    } catch (error) {
      console.error('❌ GetDonations error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // ===== TEST ENDPOINT (manual testing) =====
  if (method === 'POST' && url === '/api/test') {
    if (!apiKey || apiKey !== validKey) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Valid x-api-key header required for test endpoint'
      });
    }

    try {
      const { username = 'TestUser', amount = 10000, message = 'Test donation from API!' } = req.body || {};
      
      const testDonation = {
        id: Date.now() + Math.random(),
        username: username,
        amount: parseInt(amount),
        message: message,
        timestamp: Date.now(),
        source: 'test'
      };

      donations.push(testDonation);
      
      console.log('🧪 Test donation added:');
      console.log(`   Username: ${testDonation.username}`);
      console.log(`   Amount: Rp${testDonation.amount}`);
      console.log(`   Message: ${testDonation.message}`);
      
      return res.json({
        status: 'success',
        message: 'Test donation added successfully!',
        donation: testDonation,
        totalPending: donations.length
      });
      
    } catch (error) {
      console.error('❌ Test endpoint error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // ===== STATS ENDPOINT (bonus, untuk monitoring) =====
  if (method === 'GET' && url === '/api/stats') {
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const avgAmount = donations.length > 0 ? Math.round(totalAmount / donations.length) : 0;

    return res.json({
      pendingDonations: donations.length,
      totalAmount: totalAmount,
      averageAmount: avgAmount,
      donations: donations.map(d => ({
        username: d.username,
        amount: d.amount,
        source: d.source,
        timestamp: new Date(d.timestamp).toISOString()
      })),
      serverTime: new Date().toISOString(),
      uptime: process.uptime?.() || 0
    });
  }

  // ===== 404 NOT FOUND =====
  return res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${method} ${url} not found`,
    method: method,
    url: url,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api - Server info',
      'POST /api/webhook - Saweria webhook',
      'GET /api/getdonations - Get donations (requires x-api-key)',
      'POST /api/test - Add test donation (requires x-api-key)',
      'GET /api/stats - View stats'
    ]
  });
}
