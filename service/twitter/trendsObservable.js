'use strict';

const Rx = require('rx');

module.exports = (trends, logger) => Rx.Observable.create(observer => {
    trends.fetch((error, body) => {
        if(error) {
            logger.warn(error, 'trendsStream');
            return observer.onError(error);
        }
        observer.onNext(body);
    });
});