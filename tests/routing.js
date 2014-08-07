
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
       
        // 1. Implement two backends in different AWS regions (heroku)
        // 2. Switch between them via geoip.continent_code == "EU" 
        // 3. Switch between them via a request header, Eg curl -H 'X-Region: EU' ...
        // 4. Set a region identifier in the response header
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
        
    });

});
