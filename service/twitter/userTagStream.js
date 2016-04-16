'use strict';

const _ = require('lodash');
const Rx = require('Rx');

const filterGeoTweet = require('./filterGeoTweet');

const unfollowTweet = (tweet, logger, scheduler) => Rx.Observable.return(tweet)
    .merge(Rx.Observable.interval(300000, scheduler)
        .map(({
            name: '',
            tweetStream:  _.get(tweet, 'tweetStream')
        })))
    .filter(tweet => {
        if(tweet.name === '') {
            logger.info('unfollow user tag');

            const tweetStream = _.get(tweet, 'tweetStream');
            tweetStream.untrackAll();
            tweetStream.abort();
        }

        return tweet.name !== '';
    });

const userTweets = (tweetObservable, userTagObservable, logger, scheduler) => userTagObservable
    .flatMap(tweet => unfollowTweet(tweet, logger, scheduler))
    .flatMap(tweet => filterGeoTweet(tweet, _.partial(tweetObservable, _.get(tweet, 'tweetStream'), logger)));

module.exports = (io, logger, tweetObservable, userTagObservable, scheduler) => {
    const userCustomTweets = userTweets(tweetObservable, userTagObservable, logger, scheduler || null);
    userCustomTweets.subscribe(tweet => {
        logger.info(`custom_tweet_${tweet.socketId}`, tweet);
        io.emit(`custom_tweet_${tweet.socketId}`, tweet);
    });
    return userCustomTweets;
};