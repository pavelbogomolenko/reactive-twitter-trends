'use strict';

const _ = require('lodash');
const Rx = require('rx');

const TestScheduler = Rx.TestScheduler;
const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;

const expect = require('./../../chai').expect;
const sinon = require('sinon');

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

    it('should get and process exactly 5 trending tweets', () => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createHotObservable(
            onNext(100, [
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

        expect(results.messages.length).to.be.equal(5);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#GanaPuntosSi',
            socketId: undefined });

        expect(results.messages[1].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#test',
            socketId: undefined });

        expect(results.messages[2].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#another',
            socketId: undefined });

        expect(results.messages[3].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#war',
            socketId: undefined });

        expect(results.messages[4].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#love',
            socketId: undefined });
    });

    it('should unfollow trending tweets after 300000ms', (done) => {
        const tweetStream = {
            untrack: sinon.spy()
        };

        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createHotObservable(
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
            onCompleted(300101)
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(120, {
                coordinates: {
                    coordinates: [12, 11]
                }
            })
        );

        const observer = scheduler.createObserver();
        let source;
        let subscription;

        scheduler.scheduleAbsolute(null, 0, function() {
            source = trendsStream(io, logger, trendsObservable, tweetObservable, tweetStream, scheduler);
            subscription = source.subscribe(observer);
        });

        scheduler.scheduleAbsolute(null, 290000, function() {
        });

        scheduler.scheduleAbsolute(null, 300200, function() {
            expect(observer.messages.length).to.be.equal(1);

            expect(observer.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
                hashtag: '#GanaPuntosSi',
                socketId: undefined });

            expect(tweetStream.untrack).to.have.been.calledWith('#GanaPuntosSi');

            subscription.dispose();
            scheduler.stop();

            done();
        });

        scheduler.start();
    });


    it('should request more trends after 300100 ms', (done) => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createHotObservable(
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
            onNext(300100, [
                {
                    trends: [
                        {
                            tweet_volum: 999,
                            events: null,
                            name: '#test',
                            promoted_content: null,
                            query: '%test',
                            url: 'http://twitter.com/search/?q=%test'
                        }
                    ]
                }
            ]),
            onCompleted(300201)
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(120, {
                coordinates: {
                    coordinates: [12, 11]
                }
            })
        );

        const observer = scheduler.createObserver();
        let source;
        let subscription;

        scheduler.scheduleAbsolute(null, 0, function() {
            source = trendsStream(io, logger, trendsObservable, tweetObservable, scheduler);
            subscription = source.subscribe(observer);
        });

        scheduler.scheduleAbsolute(null, 290000, function() {
            expect(observer.messages.length).to.be.equal(1);

            expect(observer.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
                hashtag: '#GanaPuntosSi',
                socketId: undefined });
        });

        scheduler.scheduleAbsolute(null, 300300, function() {
            expect(observer.messages.length).to.be.equal(2);

            expect(observer.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
                hashtag: '#GanaPuntosSi',
                socketId: undefined });
            expect(observer.messages[1].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
                hashtag: '#test',
                socketId: undefined });

            subscription.dispose();
            scheduler.stop();

            done();
        });

        scheduler.start();
    });
});