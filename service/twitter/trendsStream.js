'use strict';

const _ = require('lodash');
const Rx = require('rx');

const filterGeoTweet = require('./filterGeoTweet');

const getTrends = (trendsObservable, tweetStream, logger, scheduler) => trendsObservable
    .concatMap(trends => Rx.Observable.from(_.get(trends, '[0].trends', [])))
    .take(5)
    .flatMap(tweet => {
        return Rx.Observable.return(tweet).merge(
            Rx.Observable.return(tweet)
                .delay(300000, scheduler)
                .filter(tweet => {
                    tweetStream.untrack(tweet.name);
                    logger.info(tweet.name, 'unfollow trending tag');
                    return false;
                })
        );
    });

const trendsPolling = (trendsObservable, tweetStream, logger, scheduler) =>
    getTrends(trendsObservable, tweetStream, logger, scheduler)
        .merge(Rx.Observable.interval(300300, scheduler)
            .flatMap(getTrends(trendsObservable)));

const trendingTweets = (trendsObservable, tweetObservable, tweetStream, logger, scheduler) =>
    trendsPolling(trendsObservable, tweetStream, logger, scheduler)
        .flatMap(tweet => filterGeoTweet(tweet, tweetObservable));

module.exports = (io, logger, trendsObservable, tweetObservable, tweetStream, scheduler) => {
    const trends = trendingTweets(trendsObservable, tweetObservable, tweetStream, logger, scheduler || Rx.Scheduler.default);
    trends.subscribe(tweet => {
        logger.info(tweet, 'trending_tweet');
        io.emit('trending_tweet', tweet);
    });
    return trends;
};