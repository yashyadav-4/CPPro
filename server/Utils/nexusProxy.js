const axios = require('axios');

//fake agents pool so codeforces doesnt flag when 1000 request come form different ip but same system
const UA_POOL = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Vivaldi/7.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Vivaldi/7.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Brave/1.71',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Brave/1.71',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Brave/1.71',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
];

// randomly picking
const getRandomUA = () => UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

// pool of proxy agents — built lazily on first request
let _agentPool = null;
let _agentPoolPromise = null;

const buildAgentPool = () => {
    if (_agentPoolPromise) return _agentPoolPromise;
    _agentPoolPromise = (async () => {
        const raw = process.env.PROXY_POOL || process.env.PROXY_URL || '';
        const urls = raw.split(',').map(u => u.trim()).filter(Boolean);

        if (urls.length === 0) {
            console.error('[LEAN-NEXUS] !! No proxy URLs set in .env — CF calls will be UNPROTECTED');
            return [];
        }

        const {HttpsProxyAgent} =await import('https-proxy-agent');
        const agents = urls.map(url => new HttpsProxyAgent(url));
        console.log(`[LEAN-NEXUS] proxy pool initialized — ${agents.length} IP's loaded`);
        return agents;
    })();
    return _agentPoolPromise;
};

//round-robin index => cycles through IPs sequentially so no IP is hit twice in a row
//with bouncer's 200ms minTime + 10 IPs = each IP gets ~2.5s cooldown before reuse
let _rrIndex = 0;
const getNextAgent = async () => {
    const pool = await buildAgentPool();
    if (pool.length === 0) return null;
    const agent = pool[_rrIndex % pool.length];
    _rrIndex = (_rrIndex + 1) % pool.length;
    return agent;
};

//if proxy doesnt respond in 15 sec than just dont freeze server and kill request
const Yaxios = axios.create({ timeout: 15000 });

//intercept every request: round-robin proxy IP + random UA
Yaxios.interceptors.request.use(async (config) => {
    config.headers['User-Agent'] = getRandomUA();
    const agent = await getNextAgent();
    if (agent) {
        config.httpsAgent = agent;
        config.httpAgent = agent;
    }
    return config;
});

module.exports= {Yaxios,cfAxios:Yaxios, getRandomUA};
