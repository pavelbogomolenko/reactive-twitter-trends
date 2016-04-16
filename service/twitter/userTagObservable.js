'use strict';

const Rx = require('Rx');
const TwitterTweetStream = require('node-tweet-stream');

module.exports = (config, io, logger) => Rx.Observable.create(observer => {
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

            userTweetStream.untrackAll();
            userTweetStream.abort();
        });

        socket.on('error', (error) => {
            logger.warn('observableUserHashTag error', error);
            observer.onError(error);
        });
    });
});