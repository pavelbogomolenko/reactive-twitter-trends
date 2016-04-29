'use strict';

const _ = require('lodash');

const buildTrends = () => ([
    {
        trends: [
            {
                name: '#GanaPuntosSi'
            },
            {
                name: '#test'
            },
            {
                name: '#another'
            },
            {
                name: '#war'
            },
            {
                name: '#love'
            },
            {
                name: '#peace'
            }
        ]
    }
]);

const buildTweet = (hashtag, id) => ({
    id: id || '12r345567898',
    text: 'some tweet',
    entities: {
        hashtags: [
            {
                text: hashtag
            }
        ]
    },
    coordinates: {
        coordinates: [12, 11]
    }
});

const getExpectedResultByTrendIndex = (index, tweeitId, hashtag, socketId) => {
    return {
        coordinates: buildTweet().coordinates.coordinates,
        id: tweeitId || buildTweet().id,
        text: buildTweet().text,
        hashtag: hashtag || buildTrends()[0].trends[index].name,
        socketId: socketId || undefined
    };
};

const buildUserTagResponse = (userTag, socketId) => ({
    name: userTag,
    tweetStream: {
        untrackAll: _.noop,
        abort: _.noop
    },
    socketId: socketId || 'socketid-1234'
});

module.exports.buildTrends = buildTrends;
module.exports.buildTweet = buildTweet;
module.exports.getExpectedResultByTrendIndex = getExpectedResultByTrendIndex;
module.exports.buildUserTagResponse = buildUserTagResponse;