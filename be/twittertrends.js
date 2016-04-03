'use strict';

const Writable = require('stream').Writable;

const request = require('request');
const bunyan = require('bunyan');
const split = require('split');

class TwitterTrendsStream extends Writable {
	constructor(oathCredentials, logger) {
		super({objectMode: true});
		this.logger = logger || bunyan.createLogger({
				'name': 'TwitterTrendsStream',
				'level': 'warn'
			});
		this.trendsUrl = 'https://api.twitter.com/1.1/trends/place.json?id=1';
		this.oathCredentials = oathCredentials;
		this.rateLimitTimeout = 1000 * 60;
	}

	listen() {
		request
			.get({
				url: this.trendsUrl,
				oauth: this.oathCredentials
			})
			.on('response', response => {
				if(response.statusCode > 200) {
					this.logger.warn('trying re-connect....');
					setTimeout(this.listen.bind(this), this.rateLimitTimeout);
				}
			})
			.on('error', error => {
				this.logger.warn('trying re-connect....');
				this.emit('error', error);
				setTimeout(this.listen.bind(this), this.rateLimitTimeout);
			})
			.pipe(split(JSON.parse))
			.pipe(this);
	}

	_write(chunk, enc, next) {
		this.emit('trends', chunk);
		//schedule next request
		setTimeout(this.listen.bind(this), this.rateLimitTimeout);
		next();
	}
}

module.exports = TwitterTrendsStream;