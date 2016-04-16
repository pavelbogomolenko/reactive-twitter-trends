'use strict';

const request = require('request');

class TwitterTrends {
	constructor(oathCredentials) {
		this.trendsUrl = 'https://api.twitter.com/1.1/trends/place.json?id=1';
		this.oathCredentials = oathCredentials;
	}

	fetch(cb) {
        request
            .get({
                url: this.trendsUrl,
                oauth: this.oathCredentials
            },  (error, response, body) => {
				try {
                    const parsedBody = JSON.parse(body);
                    if (response.statusCode === 429) {
                        return cb(parsedBody);
                    }
					cb(null, parsedBody);
				} catch(error) {
					cb(error);
				}
            });
	}
}

module.exports = TwitterTrends;