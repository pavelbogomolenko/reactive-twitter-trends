'use strict';

const _ = require('lodash');
const Rx = require('Rx');

const TestScheduler = Rx.TestScheduler;
const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;

const expect = require('./../../chai').expect;

const trendsStream = require('../../../service/twitter/trendsStream');

describe('trendsStream', () => {
    const io = {
        emit: _.noop,
        on: _.noop
    };
    const logger = {
        info: _.noop,
        warn: _.noop
    };

    beforeEach(() => {

    });

    it('should get and process 2 trending tweets', () => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createHotObservable(
            onNext(100, [
                {
                    trends: [
                        {
                            tweet_volum: 3200,
                            events: null,
                            name: '#GanaPuntosSi',
                            promoted_content: null,
                            query: '%23GanaPuntosSi',
                            url: 'http://twitter.com/search/?q=%23GanaPuntosSi'
                        },
                        {
                            tweet_volum: 1200,
                            events: null,
                            name: '#test',
                            promoted_content: null,
                            query: '%23test',
                            url: 'http://twitter.com/search/?q=%23test'
                        }
                    ]
                }
            ]),
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

        const results = scheduler.startScheduler(
            () => trendsStream(io, logger, trendsObservable, tweetObservable, scheduler),
            {
                created: 0,
                subscribed: 0,
                disposed: 1100
            }
        );

        expect(results.messages.length).to.be.equal(2);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#GanaPuntosSi',
            socketId: undefined });

        expect(results.messages[1].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#test',
            socketId: undefined });
    });

    it('should omit dublicates', () => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createColdObservable(
            onNext(100, [
                {
                    trends: [
                        {
                            tweet_volum: 3200,
                            events: null,
                            name: '#GanaPuntosSi',
                            promoted_content: null,
                            query: '%23GanaPuntosSi',
                            url: 'http://twitter.com/search/?q=%23GanaPuntosSi'
                        },
                        {
                            tweet_volum: 3200,
                            events: null,
                            name: '#GanaPuntosSi',
                            promoted_content: null,
                            query: '%23GanaPuntosSi',
                            url: 'http://twitter.com/search/?q=%23GanaPuntosSi'
                        }
                    ]
                }
            ]),
            onCompleted(1000)
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(100, {
                coordinates: {
                    coordinates: [12, 11]
                }
            }),
            onCompleted(1000)
        );

        const results = scheduler.startScheduler(
            () => trendsStream(io, logger, trendsObservable, tweetObservable, scheduler),
            {
                created: 0,
                subscribed: 0,
                disposed: 1100
            }
        );

        expect(results.messages.length).to.be.equal(1);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#GanaPuntosSi',
            socketId: undefined });
    });

    it('should request more userTagStream in 300000 ms', () => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createColdObservable(
            onNext(100, [
                {
                    trends: [
                        {
                            tweet_volum: 1000,
                            events: null,
                            name: '#GanaPuntosSi',
                            promoted_content: null,
                            query: '%23GanaPuntosSi',
                            url: 'http://twitter.com/search/?q=%23GanaPuntosSi'
                        }
                    ]
                }
            ]),
            onNext(300000, [
                {
                    trends: [
                        {
                            tweet_volum: 1000,
                            events: null,
                            name: '#qwerqwer',
                            promoted_content: null,
                            query: '%qwerqwer',
                            url: 'http://twitter.com/search/?q=%23GanaPuntosSi'
                        }
                    ]
                }
            ]),
            onCompleted(300100)
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(100, {
                coordinates: {
                    coordinates: [12, 11]
                }
            }),
            onCompleted(300100)
        );

        const results = scheduler.startScheduler(
            () => trendsStream(io, logger, trendsObservable, tweetObservable, scheduler),
            {
                created: 0,
                subscribed: 0,
                disposed: 300200
            }
        );

        expect(results.messages.length).to.be.equal(2);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#GanaPuntosSi',
            socketId: undefined });

        expect(results.messages[1].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#qwerqwer',
            socketId: undefined });
    });
});