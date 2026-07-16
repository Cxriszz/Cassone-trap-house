-- Enable pg_net extension to allow outbound HTTP requests from triggers
create extension if not exists pg_net;
