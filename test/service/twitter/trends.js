'use strict';

const _ = require('lodash');
const Rx = require('Rx');
const sinon = require('sinon');

const TestScheduler = Rx.TestScheduler;
const onNext = Rx.ReactiveTest.onNext;

const expect = require('./../../chai').expect;

const trends = require('../../../service/twitter/trends');

describe.only('trends2', function() {
    const io = {
        emit: sinon.spy(),
        on: sinon.spy()
    };
    const logger = {
        info: _.noop,
        warn: _.noop
    };

    beforeEach(() => {

    });

    it('should get and process 2 trending tweets', (done) => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createColdObservable(
            onNext(0, [
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
            ])
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(150, {
                coordinates: [12, 11]
            })
        );

        const results = scheduler.startScheduler(
            () => trends(io, logger, trendsObservable, tweetObservable, scheduler),
            {
                created: 0,
                subscribed: 200,
                disposed: 1000
            }
        );

        expect(results.messages.length).to.be.equal(2);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#GanaPuntosSi',
            socketId: undefined });

        expect(results.messages[1].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#test',
            socketId: undefined });

        done();
    });


    it('should omit dublicates in trends', (done) => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createColdObservable(
            onNext(0, [
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
            ])
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(150, {
                coordinates: [12, 11]
            })
        );

        const results = scheduler.startScheduler(
            () => trends(io, logger, trendsObservable, tweetObservable, scheduler),
            {
                created: 0,
                subscribed: 200,
                disposed: 1000
            }
        );

        expect(results.messages.length).to.be.equal(1);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#GanaPuntosSi',
            socketId: undefined });

        done();
    });

    it('should request more trends in 300000 ms', (done) => {
        const scheduler = new TestScheduler();

        const trendsObservable = scheduler.createColdObservable(
            onNext(290000, [
                {
                    trends: [
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
            onNext(300001, [
                {
                    trends: [
                        {
                            tweet_volum: 34466,
                            events: null,
                            name: '#test',
                            promoted_content: null,
                            query: '%test',
                            url: 'http://twitter.com/search/?q=%23test'
                        }
                    ]
                }
            ])
        );

        const tweetObservable = () => scheduler.createColdObservable(
            onNext(150, {
                coordinates: [12, 11]
            }),
            onNext(300000, {
                coordinates: [13, 11]
            })
        );

        const results = scheduler.startScheduler(
            () => trends(io, logger, trendsObservable, tweetObservable, scheduler),
            {
                created: 0,
                subscribed: 200,
                disposed: 300550
            }
        );

        expect(results.messages.length).to.be.equal(2);

        expect(results.messages[0].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#GanaPuntosSi',
            socketId: undefined });

        expect(results.messages[1].value.value).to.be.deep.equal({ coordinates: [ 11, 12 ],
            hashtag: '#test',
            socketId: undefined });

        done();
    });
});