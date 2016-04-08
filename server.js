'use strict';

const http = require('http');
const fs = require('fs');

const httpServer = http.createServer((req, res) => {
	const stream = fs.createReadStream(__dirname + '/index.html');
	stream.pipe(res);
});

const io = require('socket.io')(httpServer);
httpServer.listen(process.env.PORT || 5000);

module.exports = io;