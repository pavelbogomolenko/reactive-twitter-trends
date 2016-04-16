'use strict';

const Rx = require('rx');

module.exports = (tweetStream, logger, tweetObject) => Rx.Observable.create(observer => {
    logger.info('tweetName', tweetObject.name);
    tweetStream.track(tweetObject.name);

    tweetStream.on('tweet', tweet => {
        observer.onNext(tweet);
    });

    tweetStream.on('error', error => {
        logger.warn(error);
        observer.onError(error);
    });

    tweetStream.on('reconnect', message => {
        if (message.type === 'rate-limit') {
            logger.warn('rate limit', 'rate limit');
        }
    });
});