
probe healthcheck {
    .url = "/";
    .interval = 5s;
    .timeout = 1000ms;
    .window = 10;
    .threshold = 8;
}

backend next {
    .host = "";
    .probe = healthcheck;
    .port = "";
}

backend webapp {
    .host = "";
    .probe = healthcheck;
    .port = "";
}

backend ftdotcom {
    .host = "";
    .probe = healthcheck;
    .port = "";
}

sub vcl_recv {
	set req.backend = online;
 
    // If a beta cookie is set then use the beta backend
    if (req.http.X-Cookie == "next") {
        set req.backend = next;
    }
    
    // If a user is on an iPhone 
    if (req.http.User-Agent ~ "(?i)iphone") {
        set req.backend = webapp;
    }
    
    if (req.restarts == 0) {
        if (req.http.x-forwarded-for) {
            set req.http.X-Forwarded-For =
                req.http.X-Forwarded-For + ", " + client.ip;
        } else {
            set req.http.X-Forwarded-For = client.ip;
        }
    }
    
    if (req.request != "GET" &&
       req.request != "HEAD" &&
       req.request != "PUT" &&
       req.request != "POST" &&
       req.request != "TRACE" &&
       req.request != "OPTIONS" &&
       req.request != "DELETE") {
         /* Non-RFC2616 or CONNECT which is weird. */
         return (pipe);
    }
    if (req.request != "GET" && req.request != "HEAD") {
         /* We only deal with GET and HEAD by default */
         return (pass);
    }
    if (req.http.Authorization || req.http.Cookie) {
         /* Not cacheable by default */
         return (pass);
    }
    return (lookup);
        
}

sub vcl_deliver {
    
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    } 

    return (deliver);
}

sub vcl_pipe {
    return (pipe);
}

sub vcl_hit {
	return (deliver);
}

sub vcl_pass {
	return (pass);
}

sub vcl_fetch {
     if (beresp.ttl <= 0s ||
         beresp.http.Set-Cookie ||
         beresp.http.Vary == "*") {
                /*
                 * Mark as "Hit-For-Pass" for the next 2 minutes
                 */
                set beresp.ttl = 120 s;
                return (hit_for_pass);
     }
     return (deliver);
}

sub vcl_miss {
	return (fetch);
}

sub vcl_hash {
    hash_data(req.url);
    if (req.http.host) {
        hash_data(req.http.host);
    } else {
        hash_data(server.ip);
    }
    return (hash);
}

 sub vcl_error {
     set obj.http.Content-Type = "text/html; charset=utf-8";
     set obj.http.Retry-After = "5";
     synthetic {"
 <?xml version="1.0" encoding="utf-8"?>
 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
 <html>
   <head>
     <title>"} + obj.status + " " + obj.response + {"</title>
   </head>
   <body>
     <h1>Error "} + obj.status + " " + obj.response + {"</h1>
     <p>"} + obj.response + {"</p>
     <h3>Financial Times. :</h3>
     <p>XID: "} + req.xid + {"</p>
     <hr>
     <p>Varnish cache server</p>
   </body>
 </html>
 "};
     return (deliver);
 }
 
 
 
sub vcl_init {
    return (ok);
}

sub vcl_fini {
    return (ok);
}
