'use strict';

const _ = require('lodash');

module.exports = (tweetObject, tweetObservable) => tweetObservable(tweetObject)
    .filter(tweet => _.get(tweet, 'place') || _.get(tweet, 'coordinates'))
    .map(tweet => {
        let coordinates;
        if(_.get(tweet, 'coordinates.coordinates')) {
            coordinates = _.get(tweet, 'coordinates.coordinates');
        }

        if(_.get(tweet, 'place.bounding_box.coordinates[0][0]')) {
            coordinates = _.get(tweet, 'place.bounding_box.coordinates[0][0]');
        }

        return {
            coordinates: coordinates,
            hashtag: _.get(tweet, 'entities.hashtags[0].text'),
            text: tweet.text,
            id: tweet.id,
            socketId: tweetObject.socketId
        };
    })
    .filter(tweet => tweet.hashtag);