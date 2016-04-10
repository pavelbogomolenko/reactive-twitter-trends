'use strict';

const Readable = require('stream').Readable;

const expect = require('./chai').expect;
const _ = require('lodash');
const Rx = require('Rx');
const nock = require('nock');
const sinon = require('sinon');


const Observable = Rx.Observable;
const TestScheduler = Rx.TestScheduler;
const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;

// const onError = Rx.ReactiveTest.onError;
const subscribe = Rx.ReactiveTest.subscribe;

const trends = require('../stream');

describe('trends', function() {
    const config = {
        consumer_key: 'process.env.consumer_key',
        consumer_secret: 'process.env.consumer_secret',
        token: 'process.env.token',
        token_secret: 'process.env.token_secret'
    };
    const io = {
        emit: sinon.spy(),
        on: sinon.spy()
    };
    const logger = {
        info: _.noop,
        warn: _.noop
    };

    const trendsResponse = [
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
    ];

    const trendsResponse2 = [
        {
            trends: [
                {
                    tweet_volum: 3200,
                    events: null,
                    name: '#test',
                    promoted_content: null,
                    query: '%test',
                    url: 'http://twitter.com/search/?q=%test'
                }
            ]
        }
    ];

    const tweetResponse = {
        coordinates: [12, 11]
    };

    beforeEach(() => {
        nock('https://api.twitter.com')
            .get('/1.1/trends/place.json?id=1')
            .times(1)
            .reply(200, trendsResponse);

        nock('https://api.twitter.com')
            .get('/1.1/trends/place.json?id=1')
            .times(1)
            .reply(200, trendsResponse2);

        nock('https://api.twitter.com')
            .get('/1.1/trends/place.json?id=1')
            .times(1)
            .reply(200, trendsResponse2);

        nock('https://stream.twitter.com')
            .post('/1.1/statuses/filter.json', {
                track: '#GanaPuntosSi,#test',
                locations: '',
                follow: '',
                language: ''
            })
            .times(1)
            .reply(200, () => {
                const rs = new Readable;
                rs._read = () => {
                    rs.push(JSON.stringify(
                        {
                            text: tweetResponse
                        }
                    ));
                    rs.push('\r\n');
                    rs.push(null);

                };
                return rs;
            });
    });


    it.skip('should request trends each 1 ms', function(done) {
        //this.timeout(15000);
        const scheduler = new TestScheduler();

        const t = trends(config, io, logger, scheduler);

        setTimeout(() => {
            expect(io.emit).to.have.been.calledOnce;
            expect(io.emit).to.have.been.calledWith(
                'trending_tweet',
                { coordinates: [11, 12], hashtag: '#GanaPuntosSi', socketId: undefined }
            );
            done();
        }, 1200);

        scheduler.start();
    });

    it('should request trends each 1 ms', function(done) {
        const t = trends(config, io, logger);

        setTimeout(() => {
            expect(io.emit).to.have.been.calledTwice;

            expect(io.emit.args[0]).to.be.deep.equal(
                ['trending_tweet',  { coordinates: [12, 11], hashtag: '#GanaPuntosSi', socketId: undefined }]
            );

            expect(io.emit.args[1]).to.be.deep.equal(
                ['trending_tweet',  { coordinates: [12, 11], hashtag: '#test', socketId: undefined }]
            );
            done();
        }, 1200);
    });
});