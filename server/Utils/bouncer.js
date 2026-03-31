const Bottleneck = require('bottleneck'); //library needed for rate limiting

//global bouncer or rate limitor
const bouncer =new Bottleneck({
    maxConcurrent: 1,   // one call at a time and with 250ms gap means 4 call per sec 
    minTime: 200,
});

//event listenr , it is triggered every time a request leaves the queue
bouncer.on('executing', () => {
    const counts = bouncer.counts();
    console.log(`[bouncer] executing job | queued: ${counts.QUEUED} | running: ${counts.EXECUTING}`);
});

bouncer.on('failed', (error, info) => {
    console.error(`[bouncer] job failed (attempt ${info.retryCount}):`, error.message);
    if (info.retryCount <1) {
        console.log('[bouncer] retrying in 2s...');
        return 2000;
    }
});

bouncer.on('error', (error) => {
    console.error('[bouncer] limiter error:', error.message);
});

module.exports ={bouncer};
