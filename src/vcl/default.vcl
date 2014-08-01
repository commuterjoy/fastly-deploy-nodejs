backend next {
    .first_byte_timeout = 15s;
    .connect_timeout = 3s;
    .share_key = "f8585BOxnGQDMbnkJoM1e";
    .port = "80";
    .host = "62.25.64.110"; // ft.com 
}

backend webapp {
    .first_byte_timeout = 15s;
    .connect_timeout = 3s;
    .share_key = "f8585BOxnGQDMbnkJoM1e";
    .port = "80";
    .host = "54.217.215.190"; // commuterjoy.co.uk
}

sub vcl_recv {
  
  # default backend
  set req.backend = next;

  # user-agent sent to the webapp
  if (req.http.User-Agent ~ "(?i)iphone") {
    set req.backend = webapp;
  }
    
}
