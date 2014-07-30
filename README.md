
An example of a node.js based Fastly deployment process.

## Usage

    npm install https://github.com/commuterjoy/fastly/archive/v2.0.0.tar.gz
    
    export fastly_apikey=<your-fastly-api-key> \
    export fastly_service=<your-fastly-service-id> \
    node deploy__vcl.js

## Notes

This is the strategy theguardian.com used when deploying fastly VCL updates,

 - Find the active VCL version
 - Clone the active version
 - Delete all the VCL file(s) in the cloned version ready for the new ones
 - Upload you new VCL file(s)
 - Define the main VCL file (if you've got more than one)
 - Validate the cloned version
 - Activate the cloned version

This is based on the [fastly node client library](https://github.com/commuterjoy/fastly).

