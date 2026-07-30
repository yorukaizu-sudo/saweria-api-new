import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const QUEUE_KEY = 'donations_queue';
const STATS_KEY = 'donations_stats';

export async function addDonation(donation) {
  await redis.rpush(QUEUE_KEY, JSON.stringify(donation));
  await redis.ltrim(QUEUE_KEY, -100, -1); // Keep last 100
  
  const stats = await getStats();
  stats.count++;
  stats.amount += donation.amount;
  await redis.set(STATS_KEY, JSON.stringify(stats));
  
  const length = await redis.llen(QUEUE_KEY);
  console.log(`✅ Donation added to Redis queue. Queue length: ${length}`);
  return length;
}

export async function getDonations() {
  const items = await redis.lrange(QUEUE_KEY, 0, -1);
  return items.map(item => typeof item === 'string' ? JSON.parse(item) : item);
}

export async function clearDonations() {
  const length = await redis.llen(QUEUE_KEY);
  await redis.del(QUEUE_KEY);
  console.log(`🗑️ Cleared ${length} donations from queue`);
  return length;
}

export async function getStats() {
  const data = await redis.get(STATS_KEY);
  if (!data) return { count: 0, amount: 0 };
  return typeof data === 'string' ? JSON.parse(data) : data;
}
