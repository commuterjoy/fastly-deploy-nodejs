backend next {
    .connect_timeout = 1s;
    .dynamic = true;
    .port = "80";
    .host = "us-ft-next-sample.herokuapp.com";
    .host_header = "us-ft-next-sample.herokuapp.com";
    .first_byte_timeout = 15s;
    .max_connections = 200;
    .between_bytes_timeout = 10s;
    .share_key = "f8585BOxnGQDMbnkJoM1e";
      
    .probe = {
        .request = "HEAD /__gtg HTTP/1.1" "Host: us-ft-next-sample.herokuapp.com" "Connection: close""User-Agent: Varnish/fastly (healthcheck)";
        .threshold = 1;
        .window = 2;
        .timeout = 5s;
        .initial = 1;
        .expected_response = 200;
        .interval = 60s;
      }

}

sub vcl_recv {
  
    # Default backend
    set req.backend = next;

    # ...
    set req.http.Host = "us-ft-next-sample.herokuapp.com";

    if (req.restarts == 0) {
        if (!req.http.X-Timer) {
            set req.http.X-Timer = "S" time.start.sec "." time.start.usec_frac;
        }
        set req.http.X-Timer = req.http.X-Timer ",VS0";
    }

    # Block access to anyone without the secret key
    if (req.http.X-FT-Secret != "HoratioBottomley") {
        error 403 "Forbidden";
    }

    # Don't cache uncachable requests
    if (req.request != "HEAD" && req.request != "GET" && req.request != "FASTLYPURGE") {
        set req.http.X-FT-Cachable = "false";
        error 405 ": Requested Method is not supported by this server.";        
    }

    return (lookup);

}

sub vcl_deliver {

    if (req.http.X-FT-Cachable) {
        set resp.http.X-FT-Cachable = req.http.X-FT-Cachable; 
    }

    if (req.http.X-Timer) {
        set resp.http.X-Timer = req.http.X-Timer ",VE" time.elapsed.msec;
    }

    return(deliver);
}
