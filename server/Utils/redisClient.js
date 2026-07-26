const { Redis } = require('@upstash/redis');

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        console.log('[Redis] Initialized Upstash Redis client.');
    } catch (err) {
        console.error('[Redis] Failed to initialize Upstash Redis client:', err.message);
    }
} else {
    console.warn('[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not found in .env. Redis caching is disabled.');
}

/**
 * Get a value from Redis
 * @param {string} key
 * @returns {Promise<any|null>} The parsed JSON value, or null if not found/disabled.
 */
async function getCache(key){
    if(!redis) return null;
    try {
        const data = await redis.get(key);
        return data; 
    }catch(err){
        console.error(`[Redis] Error getting key ${key}:`, err.message);
        return null;
    }
}

/**
 * Set a value in Redis with optional TTL.
 * @param {string} key
 * @param {any} value - Will be JSON stringified automatically by @upstash/redis
 * @param {number} [ttlSeconds] - Optional expiration in seconds
 */
async function setCache(key, value, ttlSeconds = null){
    if(!redis) return;
    try{
        if(ttlSeconds){
            await redis.set(key, value, { ex: ttlSeconds });
        }else{
            await redis.set(key, value);
        }
    }catch(err){
        console.error(`[Redis] Error setting key ${key}:`, err.message);
    }
}

/**
 * Delete a key from Redis.
 * @param {string} key
 */
async function delCache(key){
    if(!redis) return;
    try{
        await redis.del(key);
    }catch (err){
        console.error(`[Redis] Error deleting key ${key}:`, err.message);
    }
}

module.exports ={
    redis,
    getCache,
    setCache,
    delCache,
};
