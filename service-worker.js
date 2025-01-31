
const CACHE_NAME = 'sugar-jar-cache-v1';
const URLsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/service-worker.js',
  // 添加所有需要缓存的资源，如CSS、JS、图片等
  'https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@300;400;600&family=Amatic+SC&family=Lobster&display=swap',
  // 其他外部资源链接
];

// 安装阶段：缓存必要的资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLsToCache);
      })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求，使用缓存优先策略
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在缓存中找到资源，返回缓存资源
        if (response) {
          return response;
        }
        // 否则，尝试从网络获取资源
        return fetch(event.request).then(
          networkResponse => {
            // 检查响应是否有效
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // 将新资源添加到缓存中
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(() => {
          // 当网络请求失败时，可以返回一个备用页面或图片
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});