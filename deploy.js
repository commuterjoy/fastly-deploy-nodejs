
// deploy --stage|prod

var argv = require('minimist')(process.argv.slice(2));

var service = (argv.prod) ? process.env.fastly_service_prod : process.env.fastly_service_stage;
var fastly = require('fastly')(process.env.fastly_apikey, encodeURIComponent(service));
var Q = require('q')
var fs = require('fs')
var version;

// The VCL we want to deploy
var vcl = fs.readFileSync('./src/vcl/default.vcl', { encoding: 'utf-8' });

fastly
    .getVersions()                                          //   1. Get the latest version
    .then( function (res) {                                 //   2. Derive the last version number and clone it
        var lastVersion = JSON.parse(res).pop().number;
        return fastly.cloneVcl(lastVersion); 
    })
    .then(function (res) {                                  //   3. List VCLs
        version = JSON.parse(res).number;
        return fastly.getVcl(version)
    })
    .then(function (res) {                                  //   4. Delete the VCL (all of them)
        return Q.all(
            JSON.parse(res).map(function (vcl) {
                return fastly.deleteVcl(version, vcl.name);
            })
        )
    })
    .then(function (res) {                                  //   5. Upload a VCL for a particular service and version
        return fastly.updateVcl(version, {
            name: 'next',
            content: vcl
        });
    })
    .then(function (res) {                                  //    6. Set the 'next' VCL as the main one
        return fastly.setVclAsMain(version, 'next'); 
    })
    .then(function (res) {                                  //    7. Validate the new VCL
        return fastly.validateVcl(version);
    })
    .then(function (res) {                                  //    8. Activate the new VCL or report an error 
        if (JSON.parse(res).status === 'ok') {
            return fastly.activateVcl(version); 
        } else {
            throw new Error('VCL is invalid: ' +  res)
        }
    })
    .then(function (res) { 
        console.log('New VCL installed and activated');     //    9. Complete!
    })
    .catch(function (err) {
        throw new Error(err); 
    })
    .done();
