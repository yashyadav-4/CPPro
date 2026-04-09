const axios = require('axios');

const proxyList = process.env.PROXY_POOL ? process.env.PROXY_POOL.split(',') : [];

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
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
];

let proxyIndex = 0;

function randomUserAgent() {
    return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

const Yaxios = axios.create();

Yaxios.interceptors.request.use((config) => {
    config.headers = {
        ...(config.headers || {}),
        'User-Agent': randomUserAgent(),
        'Accept-Language': 'en-US,en;q=0.9',
    };

    if (proxyList.length > 0) {
        const proxyUri = proxyList[proxyIndex].trim();
        try {
            const parsed = new URL(proxyUri);
            config.proxy = {
                protocol: parsed.protocol.replace(':', ''),
                host: parsed.hostname,
                port: parsed.port ? Number(parsed.port) : 80,
            };

            if (parsed.username || parsed.password) {
                config.proxy.auth = {
                    username: decodeURIComponent(parsed.username || ''),
                    password: decodeURIComponent(parsed.password || ''),
                };
            }
        } catch {
            // Skip malformed proxy entries and continue without proxy for this request.
            delete config.proxy;
        }
        proxyIndex = (proxyIndex + 1) % proxyList.length;
    }
    return config;
});

module.exports = { Yaxios };
