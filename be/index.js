'use strict';

const _ = require('lodash');
const Rx = require('rx');
const io = require('socket.io')(2001);
const TwitterTweetStream = require('node-tweet-stream');
const bunyan = require('bunyan');

const config = require('./config.json');
const TwitterTrendsStream = require('./twittertrends');

const logger = bunyan.createLogger({
	'name': 'TwitterTrendsStream',
	'level': 'info'
});

const observableTrends = () =>
	Rx.Observable.create(observer => {
			const trendsStream = new TwitterTrendsStream(config, logger);
			trendsStream.listen();

			trendsStream.on('trends', trends => {
				observer.onNext(trends);
			});

			trendsStream.on('error', error => {
				logger.warn('error', error);
				observer.onError(error);
			});

		})
		.take(1);

const observableTweet = tweetName =>
	Rx.Observable.create(observer => {
			logger.info('tweetName', tweetName);

			const tweetStream = new TwitterTweetStream(config);
			tweetStream.track(tweetName);

			tweetStream.on('tweet', tweet => {
				observer.onNext(tweet);
			});

			tweetStream.on('error', error => {
				logger.warn('error', error);
				observer.onError(error);
			})
		})
		.filter(tweet => _.get(tweet, 'place') || _.get(tweet, 'coordinates'))
		.map(tweet => ({
			coordinates: _.get(tweet, 'place.bounding_box.coordinates[0][0]', []).reverse() ||
				_.get(tweet, 'coordinates', []).reverse(),
			hashtag: tweetName
		}));

const trends = observableTrends()
	.flatMap(trends => Rx.Observable.from(_.get(trends, '[0].trends')))
	.take(5)
	.flatMap(trend => observableTweet(_.get(trend, 'name')));

trends.subscribe(tweet => {
	logger.info('tweet', tweet);
	io.emit('tweet', tweet)
});

