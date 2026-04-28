const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/listings/69f04ff1f5d2ada58c2b3893/interaction',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(JSON.stringify({ type: 'views' }));
req.end();
