'use strict';

const _ = require('lodash');
const Rx = require('rx');

const TestScheduler = Rx.TestScheduler;
const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;

const expect = require('./../../chai').expect;

const userTagStream = require('../../../service/twitter/userTagStream');

describe('userTagStream', () => {
    const io = {
        emit: _.noop,
        on: _.noop
    };
    const logger = {
        info: _.noop,
        warn: _.noop
    };

    it('should follow user custom tag', () => {
        const scheduler = new TestScheduler();

        const userTagObservable = scheduler.createHotObservable(
            onNext(100, {
                name: '#sometag',
                tweetStream: {
                    untrackAll: _.noop,
                    abort: _.noop
                },
                socketId: 'socketid-1234'
            }),
            onCompleted(1000)
        );

        const tweetObservable = () => scheduler.createHotObservable(
            onNext(100, {
                coordinates: {
                    coordinates: [12, 11]
                }
            }),
            onCompleted(1000)
        );

        const interval = () => scheduler.createHotObservable(
            onCompleted(1000)
        );

        const results = scheduler.startScheduler(
            () => userTagStream(io, logger, tweetObservable, userTagObservable, interval),
            {
                created: 0,
                subscribed: 0,
                disposed: 1200
            }
        );

        expect(results.messages.length).to.be.equal(1);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#sometag',
            socketId: 'socketid-1234' });
    });

    it('should follow 2 user custom tag', () => {
        const scheduler = new TestScheduler();

        const userTagObservable = scheduler.createHotObservable(
            onNext(100, {
                name: '#sometag',
                tweetStream: {
                    untrackAll: _.noop,
                    abort: _.noop
                },
                socketId: 'socketid-1234'
            }),
            onNext(300000, {
                name: '#anothertag',
                tweetStream: {
                    untrackAll: _.noop,
                    abort: _.noop
                },
                socketId: 'socketid-1235'
            }),
            onCompleted(300100)
        );

        const tweetObservable = () => scheduler.createHotObservable(
            onNext(100, {
                coordinates: {
                    coordinates: [12, 11]
                }
            }),
            onCompleted(300100)
        );

        const interval = () => scheduler.createHotObservable(
            onCompleted(300000)
        );

        const results = scheduler.startScheduler(
            () => userTagStream(io, logger, tweetObservable, userTagObservable, interval),
            {
                created: 0,
                subscribed: 0,
                disposed: 300200
            }
        );

        expect(results.messages.length).to.be.equal(2);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#sometag',
            socketId: 'socketid-1234' });

        expect(results.messages[1].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#anothertag',
            socketId: 'socketid-1235' });
    });
});