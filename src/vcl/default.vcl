
backend next {
    .first_byte_timeout = 15s;
    .connect_timeout = 3s;
    .share_key = "f8585BOxnGQDMbnkJoM1e";
    .port = "80";
    .host = "54.217.215.190"; // commuterjoy.co.uk
    .probe = {
            .url = "/";
            .interval = 20s;
            .timeout = 2s;
            .window = 5;
            .threshold = 3;
    }
}

sub vcl_recv {
  
    # Default backend
    set req.backend = next;

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
        return(pass);
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
