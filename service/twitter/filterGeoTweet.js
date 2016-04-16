'use strict';

const _ = require('lodash');

module.exports = (tweetObject, tweetObservable) => tweetObservable(tweetObject)
    .filter(tweet => _.get(tweet, 'place') || _.get(tweet, 'coordinates'))
    .map(tweet => {
        let coordinates;
        if(_.get(tweet, 'coordinates.coordinates')) {
            coordinates = _.get(tweet, 'coordinates.coordinates') || [0, 0];
        }

        if(_.get(tweet, 'place.bounding_box.coordinates[0][0]')) {
            coordinates = _.get(tweet, 'place.bounding_box.coordinates[0][0]') || [0, 0];
        }

        return {
            coordinates: coordinates.reverse(),
            hashtag: tweetObject.name,
            socketId: tweetObject.socketId
        };
    });