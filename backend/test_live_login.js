const https = require('https');

function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    
    const req = https.request({
      hostname: 'servex-service-booking-platform.onrender.com',
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing login for pablo@example.com / 123456...');
  const res1 = await testLogin('pablo@example.com', '123456');
  console.log('Result 1:', res1.status, res1.body.substring(0, 200));

  console.log('\nTesting login for arvjjj@test.com / test567...');
  const res2 = await testLogin('arvjjj@test.com', 'test567');
  console.log('Result 2:', res2.status, res2.body.substring(0, 200));
}

run();
