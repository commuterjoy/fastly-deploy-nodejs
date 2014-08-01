
var request = require('superagent'),
    mocha = require('mocha'),
    fs = require('fs'),
    expect = require('chai').expect;

describe('Next backend', function() {
  
    var host = 'http://test.next.ft.com.global.prod.fastly.net';

    it('Should respond with a HTTP 200', function (done) {

        request
            .get(host + '/hello')
            .end(function (err, res) {
                if (err) throw err;
                console.log(res.text);
                expect(res.status).to.equal(200)
                done();
            });
        })
    
});
