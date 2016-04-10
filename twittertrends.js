'use strict';

const Writable = require('stream').Writable;

const request = require('request');
const split = require('split');

class TwitterTrendsStream extends Writable {
	constructor(oathCredentials) {
		super({objectMode: true});
		this.trendsUrl = 'https://api.twitter.com/1.1/trends/place.json?id=1';
		this.oathCredentials = oathCredentials;
	}

	listen(cb) {
		// request
		// 	.get({
		// 		url: this.trendsUrl,
		// 		oauth: this.oathCredentials
		// 	})
		// 	.on('response', response => {
         //        console.log('response.statusCode', response.statusCode);
		// 		if(response.statusCode > 200) {
		// 			this.emit('error', response);
		// 		}
		// 	})
		// 	.on('error', error => {
		// 		this.emit('error', error);
		// 	})
		// 	.pipe(split(JSON.parse))
		// 	.pipe(this);

        request
            .get({
                url: this.trendsUrl,
                oauth: this.oathCredentials
            },  function (e, r, body) {
                cb(body);
            });
	}

	_write(chunk, enc, next) {
        this.emit('trends', chunk);
		next();
	}
}

module.exports = TwitterTrendsStream;