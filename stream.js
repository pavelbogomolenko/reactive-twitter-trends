'use strict';

const _ = require('lodash');
const Rx = require('rx');
const TwitterTweetStream = require('node-tweet-stream');

const TwitterTrendsStream = require('./twittertrends');

const getTrends = (trendsStream, logger) => Rx.Observable.create(observer => {
        trendsStream.listen(body => {
            try {
                const parsedReponse = JSON.parse(body);

                observer.onNext(parsedReponse);
            } catch(error) {
                logger.warn('getTrends error', error);
                observer.onError(error);
            }
        });

        // trendsStream.on('trends', trends => {
        //     console.log(1);
        //
        //     observer.onNext(trends);
        //     //observer.onCompleted();
        // });
        //
        // trendsStream.on('error', error => {
        //     logger.warn('getTrends error', error);
        //     observer.onError(error);
        // });
    })
    .concatMap(trends => Rx.Observable.from(_.get(trends, '[0].trends', []).slice(0, 2)));

const trendsPolling = (trendsStream, logger) => getTrends(trendsStream, logger)
        .merge(Rx.Observable.interval(500) //5 min 300000
            .flatMap(getTrends(trendsStream, logger)));

const observableTweet = (tweetObject, tweetStream, logger) => Rx.Observable.create(observer => {
        logger.info('tweetName', tweetObject.name);
        tweetStream.track(tweetObject.name);

        tweetStream.on('tweet', tweet => {
            observer.onNext(tweet);
        });

        tweetStream.on('error', error => {
            logger.warn('observableTweet error', error);
            observer.onError(error);
        });

        tweetStream.on('reconnect', message => {
            if (message.type === 'rate-limit') {
                logger.warn('error', 'rate limit');
            }
        });
    })
    .filter(tweet => _.get(tweet, 'place') || _.get(tweet, 'text.coordinates'))
    .map(tweet => {
        let coordinates;
        if(_.get(tweet, 'place.bounding_box.coordinates[0][0]')) {
            coordinates = _.get(tweet, 'place.bounding_box.coordinates[0][0]') || [0, 0];
        }

        if(_.get(tweet, 'text.coordinates')) {
            coordinates = _.get(tweet, 'text.coordinates') || [0, 0];
        }

        return {
            coordinates: coordinates.reverse(),
            hashtag: tweetObject.name,
            socketId: tweetObject.socketId
        };
    });

const observableUserHashTag = (config, io, logger) => Rx.Observable.create(observer => {
        io.on('connection', (socket) => {
            const socketId = socket.id.replace('/#', '');
            const userTweetStream = new TwitterTweetStream(config);

            logger.info('connection', `new client connected ${socketId}`);

            socket.on(`user_tweet_${socketId}` , (user_tweet) => {
                logger.info(`user_tweet_${socketId}`, user_tweet);

                observer.onNext({
                    name: user_tweet,
                    tweetStream: userTweetStream,
                    socketId
                });
            });

            socket.on('disconnect', () => {
                logger.info('disconnect', `remove all tracking tweets for ${socketId}`);
                abortTweetStream(userTweetStream);
            });

            socket.on('error', (error) => {
                logger.warn('observableUserHashTag error', error);
                observer.onError(error);
            });
        });
    });

const abortTweetStream = (tweetStream) => {
    tweetStream.untrackAll();
    tweetStream.abort();
};

const emptyTweet = (tweetStream) => {
    return {
        name: '',
        tweetStream
    };
};

const unfollowAllTweetAfter = (ms, tweet) => {
    return Rx.Observable.return(tweet)
        .merge(Rx.Observable.interval(ms)
            .map(emptyTweet(_.get(tweet, 'tweetStream'))));
};

const uniqueTrendingTweets = (trendsStream, tweetStream, logger) => trendsPolling(trendsStream, logger)
    .distinct(tweet => _.get(tweet, 'name'))
    .flatMap(tweet => observableTweet(tweet, tweetStream, logger));

const userTweets = (config, io, logger) => observableUserHashTag(config, io, logger)
    .flatMap(tweet => unfollowAllTweetAfter(60000, tweet))
    .filter(tweet => {
        if(tweet.name === '') {
            logger.info('unfollow user tag');
            const tweetStream = _.get(tweet, 'tweetStream');

            abortTweetStream(tweetStream);
        }

        return tweet.name !== '';
    })
    .distinct(tweet => _.get(tweet, 'name'))
    .flatMap(tweet => observableTweet(tweet, _.get(tweet, 'tweetStream'), logger));

module.exports = (config, io, logger) => {
    const tweetStream = new TwitterTweetStream(config);
    tweetStream.timeoutInterval = 0;
    const trendsStream = new TwitterTrendsStream(config);

    const trends = uniqueTrendingTweets(trendsStream, tweetStream, logger);
    trends.subscribe(tweet => {
        logger.info('trending_tweet', tweet);
        io.emit('trending_tweet', tweet);
    });

    // const userCustomTweets = userTweets(config, io, logger);
    // userCustomTweets.subscribe(tweet => {
    //     logger.info(`custom_tweet_${tweet.socketId}`, tweet);
    //     io.emit(`custom_tweet_${tweet.socketId}`, tweet);
    // });

    return trends;
};