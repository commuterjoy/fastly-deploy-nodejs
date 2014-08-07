
backend next_us {
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

backend next_eu {
    .connect_timeout = 1s;
    .dynamic = true;
    .port = "80";
    .host = "eu-ft-next-sample.herokuapp.com";
    .host_header = "eu-ft-next-sample.herokuapp.com";
    .first_byte_timeout = 15s;
    .max_connections = 200;
    .between_bytes_timeout = 10s;
    .share_key = "f8585BOxnGQDMbnkJoM1e";
      
    .probe = {
        .request = "HEAD /__gtg HTTP/1.1" "Host: eu-ft-next-sample.herokuapp.com" "Connection: close""User-Agent: Varnish/fastly (healthcheck)";
        .threshold = 1;
        .window = 2;
        .timeout = 5s;
        .initial = 1;
        .expected_response = 200;
        .interval = 60s;
      }
}

sub vcl_recv {
  
    # Default backend (US)
    set req.backend = next_us;
    set req.http.Host = "us-ft-next-sample.herokuapp.com";

    # ... use EU if the request comes from Europe
    if (geoip.continent_code == "EU" || req.http.X-FT-Region == "eu") {
        set req.backend = next_eu;
        set req.http.Host = "eu-ft-next-sample.herokuapp.com";
    }

    # ... us US if the request has asked for it
    if (req.http.X-FT-Region == "us") {
        set req.backend = next_us;
        set req.http.Host = "us-ft-next-sample.herokuapp.com";
    }

    # geoip
    set req.http.X-Geoip-Continent = geoip.continent_code;

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
    
    if (req.http.X-Geoip-Continent) {
        set resp.http.X-Geoip-Continent = req.http.X-Geoip-Continent; 
    }

    return(deliver);
}
