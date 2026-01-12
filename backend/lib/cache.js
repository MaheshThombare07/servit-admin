// Simple in-memory cache for frequently accessed data
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes

export function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > TTL) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
