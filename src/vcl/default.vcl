backend next {
    .first_byte_timeout = 15s;
    .connect_timeout = 3s;
    .share_key = "f8585BOxnGQDMbnkJoM1e";
    .port = "80";
    .host = "62.25.64.110";
}

sub vcl_recv {
  if (req.restarts == 0) {
    if (!req.http.X-Timer) {
      set req.http.X-Timer = "S" time.start.sec "." time.start.usec_frac;
    }
    set req.http.X-Timer = req.http.X-Timer ",VS0";
  }

  set req.backend = next;

}
