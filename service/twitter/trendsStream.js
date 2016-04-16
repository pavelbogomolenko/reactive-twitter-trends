'use strict';

const _ = require('lodash');
const Rx = require('rx');

const filterGeoTweet = require('./filterGeoTweet');

const getTrends = (trendsObservable) => trendsObservable
    .concatMap(trends => Rx.Observable.from(_.get(trends, '[0].trends', []).slice(0, 2)));

const trendsPolling = (trendsObservable, scheduler) => getTrends(trendsObservable)
    .merge(Rx.Observable.interval(300000, scheduler)
        .flatMap(getTrends(trendsObservable)));

const trendingTweets = (trendsObservable, tweetObservable, scheduler) => trendsPolling(trendsObservable, scheduler)
    .distinct(tweet => _.get(tweet, 'name'))
    .flatMap(tweet => filterGeoTweet(tweet, tweetObservable));

module.exports = (io, logger, trendsObservable, tweetObservable, scheduler) => {
    const trends = trendingTweets(trendsObservable, tweetObservable, scheduler || null);
    trends.subscribe(tweet => {
        logger.info(tweet, 'trending_tweet');
        io.emit('trending_tweet', tweet);
    });
    return trends;
};