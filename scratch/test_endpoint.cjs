const http = require('http');

const data = JSON.stringify({ name: 'Test', model: 'openai' });

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/ai/generate-comp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
