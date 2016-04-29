'use strict';

const _ = require('lodash');
const Rx = require('rx');

const TestScheduler = Rx.TestScheduler;
const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;

const expect = require('./../../chai').expect;

const userTagStream = require('../../../service/twitter/userTagStream');
const buildTweet = require('./builder').buildTweet;
const getExpectedResultByTrendIndex = require('./builder').getExpectedResultByTrendIndex;
const buildUserTagResponse = require('./builder').buildUserTagResponse;

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
            onNext(100, buildUserTagResponse('#sometag')),
            onCompleted(1000)
        );

        const tweetObservable = () => scheduler.createHotObservable(
            onNext(100, buildTweet('#sometag', '2ds1')),
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
        expect(results.messages[0].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(
            0,
            '2ds1',
            '#sometag',
            buildUserTagResponse('#sometag').socketId
        ));
    });

    it('should listen for next socket opened', (done) => {
        const scheduler = new TestScheduler();

        const userTagObservable = scheduler.createHotObservable(
            onNext(100, buildUserTagResponse('#sometag', 'socId1')),
            onCompleted(300150, buildUserTagResponse('#another', 'socId1'))
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(150, buildTweet('#sometag', '2ds1')),
            onNext(300150, buildTweet('#another', '2ds2')),
            onCompleted(300250)
        );

        const observer = scheduler.createObserver();
        let source;
        let subscription;

        scheduler.scheduleAbsolute(null, 0, function() {
            source = userTagStream(io, logger, tweetObservable, userTagObservable, scheduler);
            subscription = source.subscribe(observer);
        });

        scheduler.scheduleAbsolute(null, 290000, function() {
            expect(observer.messages.length).to.be.equal(1);

            expect(observer.messages[0].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(
                0,
                '2ds1',
                '#sometag',
                'socId1'
            ));
        });

        scheduler.scheduleAbsolute(null, 300300, function() {
            expect(observer.messages[0].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(
                0,
                '2ds1',
                '#sometag',
                'socId1'
            ));
            expect(observer.messages[1].value.value).to.be.deep.equal(getExpectedResultByTrendIndex(
                1,
                '2ds2',
                '#another',
                'socId1'
            ));

            subscription.dispose();
            scheduler.stop();

            done();
        });

        scheduler.start();
    });
});