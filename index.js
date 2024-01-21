const fs = require('fs'),
    http = require('http');

http.createServer((req, res) => {
    let data = '';
    req.on('data', c => data += c);

    req.on('end', () => {

    })
}).listen(8080)