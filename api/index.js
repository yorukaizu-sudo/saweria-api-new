// =====================================================
//        SAWERIA WEBHOOK API - COMPLETE VERSION
//        All-in-one solution for Roblox integration
// =====================================================

// In-memory storage (resets on serverless cold start)
let donations = [];
let stats = {
  totalDonations: 0,
  totalAmount: 0,
  serverStartTime: Date.now()
};

// Helper functions
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function formatRupiah(amount) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function validateDonation(data) {
  const donation = {
    id: Date.now() + Math.random(),
    username: data.donatur_name || data.donator_name || data.nama_donatur || 'Anonymous',
    amount: parseInt(data.amount_raw) || parseInt(data.amount) || parseInt(data.jumlah) || 0,
    message: data.message || data.donator_message || data.pesan || '',
    timestamp: Date.now(),
    source: data.source || 'saweria',
    rawData: data
  };

  // Cleanup username
  donation.username = donation.username.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20);
  if (!donation.username) donation.username = 'Anonymous';

  return donation;
}

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, url } = req;
  const startTime = Date.now();
  
  log(`${method} ${url} - Processing started`);

  // Get API key for protected endpoints
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'] || req.headers['authorization']?.replace('Bearer ', '');
  const validApiKey = process.env.API_KEY || 'saweria2024';

  try {
    // ===== ROOT ENDPOINT - SERVER INFO =====
    if (method === 'GET' && url === '/api') {
      const uptime = Date.now() - stats.serverStartTime;
      
      return res.status(200).json({
        status: '🚀 Saweria Webhook Server Online',
        version: '2.0.0',
        serverTime: new Date().toISOString(),
        uptime: Math.floor(uptime / 1000),
        endpoints: {
          root: 'GET /api - Server information',
          webhook: 'POST /api/webhook - Receive donations from Saweria',
          getdonations: 'GET /api/getdonations - Fetch donations for Roblox (requires x-api-key)',
          test: 'POST /api/test - Add test donation (requires x-api-key)',
          stats: 'GET /api/stats - Server statistics',
          health: 'GET /api/health - Health check'
        },
        stats: {
          pendingDonations: donations.length,
          totalProcessed: stats.totalDonations,
          totalAmount: formatRupiah(stats.totalAmount)
        },
        security: {
          apiKeyRequired: ['getdonations', 'test'],
          apiKeySet: process.env.API_KEY ? 'Custom' : 'Default (saweria2024)'
        },
        lastDonation: donations.length > 0 ? donations[donations.length - 1] : null
      });
    }

    // ===== WEBHOOK ENDPOINT - RECEIVE FROM SAWERIA =====
    if (method === 'POST' && url === '/api/webhook') {
      try {
        const rawData = req.body || {};
        log(`Webhook received: ${JSON.stringify(rawData)}`);

        // Validate and process donation
        const donation = validateDonation(rawData);

        // Check minimum amount
        if (donation.amount < 1000) {
          log(`Donation rejected - too small: ${formatRupiah(donation.amount)}`);
          return res.status(200).json({
            status: 'rejected',
            reason: 'amount_too_small',
            minimumAmount: 1000,
            receivedAmount: donation.amount
          });
        }

        // Store donation
        donations.push(donation);
        stats.totalDonations++;
        stats.totalAmount += donation.amount;

        // Maintain max 100 donations in memory
        if (donations.length > 100) {
          const removed = donations.shift();
          log(`Removed old donation: ${removed.username} - ${formatRupiah(removed.amount)}`);
        }

        log(`✅ Donation accepted: ${donation.username} - ${formatRupiah(donation.amount)} - "${donation.message}"`);

        return res.status(200).json({
          status: 'success',
          message: 'Donation received and queued successfully',
          donation: {
            id: donation.id,
            username: donation.username,
            amount: donation.amount,
            message: donation.message,
            timestamp: donation.timestamp
          },
          queue: {
            pending: donations.length,
            position: donations.length
          }
        });

      } catch (error) {
        log(`❌ Webhook error: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to process webhook',
          error: error.message
        });
      }
    }

    // ===== GET DONATIONS ENDPOINT - FOR ROBLOX =====
    if (method === 'GET' && url === '/api/getdonations') {
      // Validate API key
      if (!apiKey || apiKey !== validApiKey) {
        log(`❌ Unauthorized getdonations attempt from ${req.headers['user-agent'] || 'unknown'}`);
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Valid x-api-key header required',
          hint: 'Include x-api-key header with your API key'
        });
      }

      // Get all pending donations
      const pendingDonations = [...donations];
      
      // Clear queue after retrieval
      donations = [];
      
      log(`📤 Sent ${pendingDonations.length} donations to Roblox`);
      
      if (pendingDonations.length > 0) {
        const donationSummary = pendingDonations.map(d => 
          `${d.username}:${formatRupiah(d.amount)}`
        ).join(', ');
        log(`Donations: ${donationSummary}`);
      }

      return res.status(200).json({
        success: true,
        donations: pendingDonations,
        count: pendingDonations.length,
        timestamp: Date.now(),
        stats: {
          totalProcessed: stats.totalDonations,
          totalAmount: stats.totalAmount
        }
      });
    }

    // ===== TEST ENDPOINT - MANUAL TESTING =====
    if (method === 'POST' && url === '/api/test') {
      // Validate API key
      if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Valid x-api-key header required for test endpoint'
        });
      }

      try {
        const { 
          username = 'TestUser', 
          amount = 10000, 
          message = 'Test donation from API' 
        } = req.body || {};

        const testDonation = {
          id: Date.now() + Math.random(),
          username: String(username).replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20) || 'TestUser',
          amount: parseInt(amount) || 10000,
          message: String(message).substring(0, 100) || 'Test donation',
          timestamp: Date.now(),
          source: 'test'
        };

        donations.push(testDonation);
        stats.totalDonations++;
        stats.totalAmount += testDonation.amount;

        log(`🧪 Test donation added: ${testDonation.username} - ${formatRupiah(testDonation.amount)}`);

        return res.status(200).json({
          status: 'success',
          message: 'Test donation added successfully',
          donation: testDonation,
          queue: {
            pending: donations.length,
            total: stats.totalDonations
          }
        });

      } catch (error) {
        log(`❌ Test endpoint error: ${error.message}`);
        return res.status(500).json({
          error: 'Test failed',
          message: error.message
        });
      }
    }

    // ===== STATS ENDPOINT - MONITORING =====
    if (method === 'GET' && url === '/api/stats') {
      const uptime = Date.now() - stats.serverStartTime;
      const avgAmount = stats.totalDonations > 0 ? stats.totalAmount / stats.totalDonations : 0;

      return res.status(200).json({
        server: {
          status: 'online',
          uptime: Math.floor(uptime / 1000),
          startTime: new Date(stats.serverStartTime).toISOString(),
          version: '2.0.0'
        },
        donations: {
          pending: donations.length,
          totalProcessed: stats.totalDonations,
          totalAmount: stats.totalAmount,
          averageAmount: Math.round(avgAmount),
          formatted: {
            totalAmount: formatRupiah(stats.totalAmount),
            averageAmount: formatRupiah(avgAmount)
          }
        },
        recent: donations.slice(-5).map(d => ({
          username: d.username,
          amount: d.amount,
          message: d.message,
          source: d.source,
          time: new Date(d.timestamp).toISOString()
        })),
        memory: process.memoryUsage ? process.memoryUsage() : null
      });
    }

    // ===== HEALTH CHECK ENDPOINT =====
    if (method === 'GET' && url === '/api/health') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: Date.now() - stats.serverStartTime,
        checks: {
          memory: 'ok',
          donations: donations.length,
          api: 'operational'
        }
      });
    }

    // ===== CLEAR ENDPOINT - EMERGENCY CLEAR QUEUE =====
    if (method === 'POST' && url === '/api/clear') {
      if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const clearedCount = donations.length;
      donations = [];
      
      log(`🗑️ Queue cleared: ${clearedCount} donations removed`);
      
      return res.status(200).json({
        status: 'success',
        message: 'Donation queue cleared',
        clearedCount: clearedCount
      });
    }

    // ===== 404 NOT FOUND =====
    return res.status(404).json({
      error: 'Endpoint Not Found',
      method: method,
      url: url,
      timestamp: new Date().toISOString(),
      available: {
        public: [
          'GET /api - Server info',
          'POST /api/webhook - Saweria webhook',
          'GET /api/stats - Statistics',
          'GET /api/health - Health check'
        ],
        protected: [
          'GET /api/getdonations - Get donations (x-api-key required)',
          'POST /api/test - Add test donation (x-api-key required)',
          'POST /api/clear - Clear queue (x-api-key required)'
        ]
      },
      hint: 'Check the available endpoints above'
    });

  } catch (error) {
    log(`💥 Unhandled error: ${error.message}`);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
  } finally {
    const processingTime = Date.now() - startTime;
    log(`${method} ${url} - Completed in ${processingTime}ms`);
  }
}
