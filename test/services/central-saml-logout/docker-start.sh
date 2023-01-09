#!/bin/bash

set -euo pipefail

docker run \
  --name app-apache2-slo-test-container \
  --detach \
  --net=host \
  --env 'SERVER_HOSTNAME=0.0.0.0' \
  --env 'SERVER_PORT=8191' \
  --env 'BASE_URL=http://127.0.0.1:8181/slo' \
  --env 'PATH_PREFIX=/app-prefix' \
  --env 'IDP_METADATA=http://127.0.0.1:8190/realms/master/protocol/saml/descriptor' \
  --env 'COOKIES_TO_CLEAR=[{"domain":"127.0.0.1","name":"central-saml-logout-session-client-prefix"}]' \
  central-saml-logout:latest

docker run \
  --name app-nginx-slo-test-container \
  --detach \
  --net=host \
  --env 'SERVER_HOSTNAME=0.0.0.0' \
  --env 'SERVER_PORT=8192' \
  --env 'BASE_URL=http://127.0.0.1:8182/slo' \
  --env 'PATH_PREFIX=/app-prefix' \
  --env 'IDP_METADATA=http://127.0.0.1:8190/realms/master/protocol/saml/descriptor' \
  --env 'COOKIES_TO_CLEAR=[{"domain":"127.0.0.1","name":"central-saml-logout-session-client-prefix"}]' \
  central-saml-logout:latest

while ! nc -z 127.0.0.1 8191 || ! nc -z 127.0.0.1 8192; do
  echo "Waiting 5 seconds for application instances to come up."
  sleep 5
done

exit 0
