'use strict';

const bunyan = require('bunyan');
const logger = bunyan.createLogger({
	'name': 'TwitterTrendsStream',
	'level': 'info'
});

const io = require('./server');
require('./stream')(io, logger);