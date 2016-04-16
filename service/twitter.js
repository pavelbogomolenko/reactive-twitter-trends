'use strict';

const _ = require('lodash');
const TwitterTweetStream = require('node-tweet-stream');

const trendsStream = require('./twitter/trendsStream');
const userTagStream = require('./twitter/userTagStream');

const Trends = require('./twitter/api/twitterTrends');

const trendsObservable = require('./twitter/trendsObservable');
const tweetObservable = require('./twitter/tweetObservable');
const userTagObservable = require('./twitter/userTagObservable');

module.exports = (config, io, logger) => {
    const trends = new Trends(config);
    const ts = new TwitterTweetStream(config);

    trendsStream(io, logger, trendsObservable(trends, logger), _.partial(tweetObservable, ts, logger));

    userTagStream(io, logger, tweetObservable, userTagObservable(config, io, logger));
};