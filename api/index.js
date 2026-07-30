export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    status: '🚀 Saweria API Running!',
    version: '4.0.0',
    time: new Date().toISOString(),
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
