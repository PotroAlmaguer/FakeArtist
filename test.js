// test.js
const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hola Mundo\n');
});

server.listen(3000, () => {
  console.log('Servidor en ejecución en http://localhost:3000');
});
