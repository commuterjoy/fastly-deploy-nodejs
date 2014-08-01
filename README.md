
An example of a node.js based Fastly deployment process.

## Usage

You'll need an Fastly API key and also to configure a new service in fastly and
get hold of it's 'service id'.

    npm install https://github.com/commuterjoy/fastly/archive/v2.0.0.tar.gz
   
    export DEBUG=fastly; \
    export fastly_apikey=<your-fastly-api-key>; \
    export fastly_service=<your-fastly-service-id>; \
    node deploy__vcl.js

You should see a trickle of requests being made to the API, 

    fastly Request: GET, /service/f9935BOx.../version +0ms
    fastly Request: PUT, /service/f9935BOx.../version/40/clone +1s
    fastly Request: GET, /service/f9935BOx.../version/41/vcl +669ms
    ...

## Workflow

The workflow to configure the CDN is simple,

 - Update VCL in ./src/vcl
 - Type `make deploy test`

If the tests pass then you've not broken anything and can deploy to production.

## Notes

This is the strategy theguardian.com used when deploying fastly VCL updates,

 - Find the active VCL version.
 - Clone the active version.
 - Delete all the VCL file(s) in the cloned version ready for the new ones.
 - Upload you new VCL file(s).
 - Define the main VCL file.
 - Validate the cloned version.
 - Activate the cloned version.

This is based on the [Fastly node client library](https://github.com/commuterjoy/fastly).

