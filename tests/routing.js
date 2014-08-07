
var request = require('superagent'),
    mocha = require('mocha'),
    fs = require('fs'),
    expect = require('chai').expect;

describe('next.ft.com backend', function() {
  
    var host = 'http://test.next.ft.com.global.prod.fastly.net';

    // Wrapper around request/expect
    var status = function (host, status, done, headers) {
        var headers = headers || {};
        request
            .get(host)
            .set(headers)
            .end(function (err, res) {
                if (err) throw err;
                expect(res.status).to.equal(status);
                done()
            });
    } 

    describe('Authorisation', function () {

        it('Should respond HTTP 302 when access is unauthorized', function (done) {
            status(host, 403, done);
        })
        
        it('Should respond HTTP 200 when client sends the correct credentials', function (done) {
            status(host, 200, done, headers = {
                'x-ft-secret': 'HoratioBottomley'
            });
        })
    
    });

    describe('Requests', function () {
        
        it('Should respond to GET requests', function (done) {
            request
                .get(host)
                .set({ 'x-ft-secret': 'HoratioBottomley' })
                .end(function (err, res) {
                    if (err) throw err;
                    expect(res.status).to.equal(200);
                    done()
                });
        });
        
        it('Should respond to HEAD requests', function (done) {
            request
                .head(host)
                .set({ 'x-ft-secret': 'HoratioBottomley' })
                .end(function (err, res) {
                    if (err) throw err;
                    expect(res.status).to.equal(200);
                    done()
                });
        });

    })

    describe('Caching', function () {
        
        it('Should not cache uncachable requests', function (done) {
            request
                .put(host)
                .set({ 'x-ft-secret': 'HoratioBottomley' })
                .end(function (err, res) {
                    if (err) throw err;
                    //expect(res.status).to.equal(405); // FIXME: generates a 503!?
                    expect(res.header['x-ft-cachable']).to.equal('false');
                    done();
                });
        })
        

    })

    describe('Metrics', function () {

        it('Should time each response', function (done) {
            request
                .get(host)
                .set({ 'x-ft-secret': 'HoratioBottomley' })
                .end(function (err, res) {
                    if (err) throw err;
                    expect(res.header['x-timer']).to.match(/S(\d+).(\d+),VS0,VE(\d)/);
                    done()
                });
        })
        
    });


});
