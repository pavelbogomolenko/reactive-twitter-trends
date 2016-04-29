'use strict';

const _ = require('lodash');
const Rx = require('rx');

const TestScheduler = Rx.TestScheduler;
const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;

const expect = require('./../../chai').expect;
const sinon = require('sinon');

const trendsStream = require('../../../service/twitter/trendsStream');
const buildTrends = require('./builder').buildTrends;
const buildTweet = require('./builder').buildTweet;
const getExpectedResultByTrendIndex = require('./builder').getExpectedResultByTrendIndex;

describe('trendsStream', () => {
    const io = {
        emit: _.noop,
        on: _.noop
    };
    const logger = {
        info: _.noop,
        warn: _.noop
    };

    it('should not contain #peace (limit to 5 trendis)', () => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createHotObservable(
            onNext(50, buildTrends()),
            onCompleted(55)
        );

        const tweetObservable = () => scheduler.createHotObservable(
            onNext(100, buildTweet(buildTrends()[0].trends[0].name)),
            onNext(100, buildTweet(buildTrends()[0].trends[1].name)),
            onNext(100, buildTweet(buildTrends()[0].trends[2].name)),
            onNext(100, buildTweet(buildTrends()[0].trends[3].name)),
            onNext(100, buildTweet(buildTrends()[0].trends[4].name)),
            onNext(100, buildTweet(buildTrends()[0].trends[5].name)),
            onCompleted(110)
        );

        const results = scheduler.startScheduler(
            () => trendsStream(io, logger, trendsObservable, tweetObservable, scheduler),
            {
                created: 0,
                subscribed: 0,
                disposed: 110
            }
        );

        results.messages.forEach(message => {
            expect(message.value.value).to.be.not.equal(buildTrends()[0].trends[5].name);
        });
    });

    it('should unfollow trending tweets after 300000ms', (done) => {
        const tweetStream = {
            untrack: sinon.spy()
        };

        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createHotObservable(
            onNext(100, buildTrends()),
            onCompleted(300101)
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(120, buildTweet(buildTrends()[0].trends[0].name)),
            onCompleted(130)
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
            expect(observer.messages[0].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(0));

            expect(tweetStream.untrack).to.have.been.calledWith(buildTrends()[0].trends[0].name);

            subscription.dispose();
            scheduler.stop();

            done();
        });

        scheduler.start();
    });
    
    it('should request more trends after 300300 ms', (done) => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createHotObservable(
            onNext(100, [
                {
                    trends: [
                        buildTrends()[0].trends[0]
                    ]
                }
            ]),
            onCompleted(300150, [
                {
                    trends: [
                        buildTrends()[0].trends[1]
                    ]
                }
            ])
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(120, buildTweet(buildTrends()[0].trends[0].name, 'someId1')),
            onNext(300150, buildTweet(buildTrends()[0].trends[1].name, 'someId2')),
            onCompleted(300400)
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

            expect(observer.messages[0].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(0, 'someId1'));
        });

        scheduler.scheduleAbsolute(null, 300300, function() {
            expect(observer.messages.length).to.be.equal(2);

            expect(observer.messages[0].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(0, 'someId1'));
            expect(observer.messages[1].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(1, 'someId2'));

            subscription.dispose();
            scheduler.stop();

            done();
        });

        scheduler.start();
    });

    it('should omit dublicate tweets (similar id)', (done) => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createHotObservable(
            onNext(100, [
                {
                    trends: [
                        buildTrends()[0].trends[0],
                        buildTrends()[0].trends[0]
                    ]
                }
            ]),
            onCompleted(220)
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(120, buildTweet(buildTrends()[0].trends[0].name, '123ds1t5')),
            onNext(150, buildTweet(buildTrends()[0].trends[0].name, '123ds1t5')),
            onCompleted(220)
        );

        const observer = scheduler.createObserver();
        let source;
        let subscription;

        scheduler.scheduleAbsolute(null, 0, function() {
            source = trendsStream(io, logger, trendsObservable, tweetObservable, scheduler);
            subscription = source.subscribe(observer);
        });

        scheduler.scheduleAbsolute(null, 230, function() {
            expect(observer.messages.length).to.be.equal(1);

            expect(observer.messages[0].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(0, '123ds1t5'));

            subscription.dispose();
            scheduler.stop();

            done();
        });

        scheduler.start();
    });
});