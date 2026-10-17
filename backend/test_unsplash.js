const https = require('https');

const url = 'https://images.unsplash.com/photo-1527515637462-cee1395c0c76?w=800&auto=format&fit=crop&q=80';

https.get(url, (res) => {
  console.log('Unsplash Image Status Code:', res.statusCode);
  console.log('Location Header (if redirect):', res.headers.location);
}).on('error', (err) => {
  console.error('Error:', err.message);
});
