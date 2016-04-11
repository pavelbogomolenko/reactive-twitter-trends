'use strict';

const _ = require('lodash');
const Rx = require('rx');

const getTrends = (trendsObservable) => trendsObservable
    .concatMap(trends => Rx.Observable.from(_.get(trends, '[0].trends', []).slice(0, 2)));

const trendsPolling = (trendsObservable, scheduler) => getTrends(trendsObservable)
        .merge(Rx.Observable.interval(300000, scheduler)
            .flatMap(getTrends(trendsObservable)));

const getTweet = (tweetObject, tweetObservable) => tweetObservable(tweetObject)
    .filter(tweet => _.get(tweet, 'place') || _.get(tweet, 'coordinates'))
    .map(tweet => {
        let coordinates;
        if(_.get(tweet, 'place.bounding_box.coordinates[0][0]')) {
            coordinates = _.get(tweet, 'place.bounding_box.coordinates[0][0]') || [0, 0];
        }

        if(_.get(tweet, 'coordinates')) {
            coordinates = _.get(tweet, 'coordinates') || [0, 0];
        }

        return {
            coordinates: coordinates.reverse(),
            hashtag: tweetObject.name,
            socketId: tweetObject.socketId
        };
    });

const trendingTweets = (trendsObservable, tweetObservable, scheduler) => trendsPolling(trendsObservable, scheduler)
    .distinct(tweet => _.get(tweet, 'name'))
    .flatMap(tweet => getTweet(tweet, tweetObservable));

module.exports = (io, logger, trendsObservable, tweetObservable, scheduler) => {
    const trends = trendingTweets(trendsObservable, tweetObservable, scheduler);
    trends.subscribe(tweet => {
            logger.info('trending_tweet', tweet);
            io.emit('trending_tweet', tweet);
        });
    return trends;
};