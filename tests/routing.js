
var request = require('superagent'),
    mocha = require('mocha'),
    fs = require('fs'),
    expect = require('chai').expect;

describe('next.ft.com backend', function() {
  
    var host = 'http://test.next.ft.com.global.prod.fastly.net/__gtg',
        auth = { 
            'x-ft-secret': 'HoratioBottomley'
        };

    describe('Authorisation', function () {

        it('Should respond HTTP 302 when access is unauthorized', function (done) {
            request.get(host).end(function (err, res) {
                    expect(res.status).to.equal(403);
                    done();
            })
        })
        
        it('Should respond HTTP 200 when client sends the correct credentials', function (done) {
            request.get(host).set(auth).end(function (err, res) {
                    expect(res.status).to.equal(200);
                    done();
            })
        })
    
    });

    describe('Requests', function () {
        
        it('Should respond to GET requests', function (done) {
            request.get(host).set(auth).end(function (err, res) {
                    expect(res.status).to.equal(200);
                    done();
            })
        });
        
        it('Should respond to HEAD requests', function (done) {
            request.head(host).set(auth).end(function (err, res) {
                    expect(res.status).to.equal(200);
                    done();
            })
        });

    })

    describe('Caching', function () {
        
        it('Should not cache uncachable requests', function (done) {
            request.put(host).set(auth).end(function (err, res) {
                    expect(res.status).to.equal(405);
                    expect(res.header['x-ft-cachable']).to.equal('false');
                    done();
            })
        })

    })

    describe('Metrics and metadata', function () {

        it('Should show the response time of each request', function (done) {
            request.get(host).set(auth).end(function (err, res) {
                    expect(res.header['x-timer']).to.match(/S(\d+).(\d+),VS0,VE(\d)/);
                    done();
            })
        })
       
        it('Should show the country of origin of each request', function (done) {
            request.get(host).set(auth).end(function (err, res) {
                    expect(res.header['x-geoip-continent']).to.match(/EU/);
                    done();
            })
        })
        
        it('Should use the EU region backend when coming from Europe', function (done) {
            request.get(host).set(auth).end(function (err, res) {
                    expect(res.header['x-ft-backend-region']).to.match(/eu/);
                    done();
            })
        })
        
        it('Should use the US region backend when coming from outside of Europe', function (done) {
            request.get(host).set(auth).set('x-ft-region', 'us').end(function (err, res) {
                    expect(res.header['x-ft-backend-region']).to.match(/us/);
                    done();
            })
        })
       
        // ie. us and eu are *regions* capable of serving any edition
        it('Should not couple regions to editions', function (done) {
            request.get(host).set(auth)
                             .set('x-ft-region', 'us')
                             .set('x-ft-edition', 'uk')
                             .end(function (err, res) {
                    expect(res.header['x-ft-backend-region']).to.match(/us/);
                    expect(res.header['x-ft-edition']).to.match(/uk/);
                    done();
            })
        })
    });
       
    describe('Editions', function () {

        // 1. assign a user to a region, then to an edition 
        // 2. annotate the request object so that the backend can see the edition
        // 3. annotate the request object with a vary: x-edition to avoid cache clashes
        // 4. add an edition switch in the heroku app code and send back 'vary: x-edition'
        // 5. annotate the response object with an addition

        it('Users from UK should be shown a UK edition', function (done) {
            request.get(host).set(auth).end(function (err, res) {
                    expect(res.header['x-ft-edition']).to.match(/uk/);
                    done();
            })
        });

        it('Users from US should be shown a US edition', function (done) {
            request.get(host).set(auth).set('x-ft-region', 'us').end(function (err, res) {
                    expect(res.header['x-ft-edition']).to.match(/us/);
                    done();
            })
        });

        it('Users with an edition preference should be shown that edition', function (done) {
            request.get(host).set(auth).set('x-ft-edition', 'india').end(function (err, res) {
                    expect(res.header['x-ft-edition']).to.match(/india/);
                    done();
            })
        })
        
    });

});
