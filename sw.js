// Metronome service worker — lets the app open without a connection.
// Network first (so updates show up straight away when online), falling back
// to the saved copy when offline or when the network takes more than 3 seconds.
// Bump CACHE with each release so old copies are cleared.
const CACHE = 'metronome-1.6.0';
const ASSETS = [
    './',
    'app.js',
    'manifest.json',
    'favicon.png',
    'icon-192.png',
    'icon-512.png',
    'apple-touch-icon.png',
    'maskable-512.png',
    'fonts/space-grotesk-latin-700-normal.woff2',
    'fonts/inter-latin-400-normal.woff2',
    'fonts/inter-latin-600-normal.woff2',
    'fonts/jetbrains-mono-latin-400-normal.woff2',
    'fonts/jetbrains-mono-latin-600-normal.woff2',
    'fonts/caveat-latin-700-normal.woff2',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith('metronome-') && k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    const isPage = req.mode === 'navigate';
    const key = isPage ? './' : req;

    e.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const fromNet = fetch(req).then((res) => {
            // Only keep plain successful responses (never redirects)
            if (res.ok && !res.redirected && res.type === 'basic') cache.put(key, res.clone());
            return res;
        });
        const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
        try {
            const res = await Promise.race([fromNet, timeout]);
            if (res) return res;
        } catch (err) { /* offline */ }
        const saved = await cache.match(key, { ignoreSearch: true });
        return saved || fromNet;
    })());
});
