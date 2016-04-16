'use strict';

const bunyan = require('bunyan');
const logger = bunyan.createLogger({
	'name': 'TwitterTrendsStream',
	'level': 'info'
});

const config = require('./config');
const io = require('./server');

require('./service/twitter')(config, io, logger);