
var fastly = require('fastly')(process.env.fastly_apikey);
var service = encodeURIComponent(process.env.fastly_service);
var Q = require('q')
var fs = require('fs')
var version;

// the VCL we want to deploy
var vcl = readFileSync('./src/vcl/default.vcl', { encoding: 'utf-8' });

// 1. Get the latest version

fastly
    .request('GET', '/service/' + service + '/version')
    .then(function (res) {
        
        //  2. Derive the last version number and clone it

        var lastVersion = JSON.parse(res).pop().number;
        return fastly.request('PUT', '/service/' + service + '/version/' + lastVersion + '/clone');
    
    })
    .then(function (res) {
        
        // 3. List VCLs
        
        version = JSON.parse(res).number;
        return fastly.request('GET', '/service/'+service+'/version/'+version+'/vcl');
    })
    .then(function (res) {
     
        // 4. Delete the VCL (all of them)
        return Q.all(
            JSON.parse(res).map(function (vcl) {
                return fastly.request('DELETE', '/service/'+service+'/version/'+version+'/vcl/'+vcl.name);
            })
        )

    })
    .then(function (res) {

        // 5. Upload a VCL for a particular service and version
        
        return fastly.request('POST', '/service/'+service+'/version/'+version+'/vcl', {
            name: 'main',
            content: vcl
        })

    })
    .then(function (res) {
        console.log('uploaded', res);

        // 6. Validate the new VCL
        
        return fastly.request('GET', '/service/'+service+'/version/'+version+'/validate')

    })
    .then(function (res) {
        
        // 7. Activate the new VCL 
        
        if (JSON.parse(res).status === 'ok') {
            return fastly.request('PUT', '/service/'+service+'/version/'+version+'/activate')
        } else {
            throw new Error('vcl is invalid: ' +  res)
        }

    })
    .then(function (res) { 
        console.log('all done', res)
    })
    .catch(function (err) {
        throw new Error(err); 
    })
    .done();


