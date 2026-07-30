// Shared in-memory storage
// Note: resets on cold start (serverless limitation)
let donations = [];
let stats = { count: 0, amount: 0, start: Date.now() };

export function addDonation(donation) {
  donations.push(donation);
  stats.count++;
  stats.amount += donation.amount;
  if (donations.length > 100) donations.shift();
  return donations.length;
}

export function getDonations() {
  return [...donations];
}

export function clearDonations() {
  const count = donations.length;
  donations = [];
  return count;
}

export function getStats() {
  return { ...stats };
}
