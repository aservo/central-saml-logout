#!/bin/bash

set -euo pipefail

docker run \
  --name app-apache2-slo-test-container \
  --detach \
  --net=host \
  --env 'SERVER_HOSTNAME=0.0.0.0' \
  --env 'SERVER_PORT=8191' \
  --env 'BASE_URL=http://localhost:8181/slo' \
  --env 'PATH_PREFIX=/app-prefix' \
  --env 'IDP_METADATA=http://localhost:8190/realms/master/protocol/saml/descriptor' \
  --env 'COOKIES_TO_CLEAR=[{"domain":"localhost","name":"central-saml-logout-session-client-prefix"}]' \
  central-saml-logout:latest

docker run \
  --name app-nginx-slo-test-container \
  --detach \
  --net=host \
  --env 'SERVER_HOSTNAME=0.0.0.0' \
  --env 'SERVER_PORT=8192' \
  --env 'BASE_URL=http://localhost:8182/slo' \
  --env 'PATH_PREFIX=/app-prefix' \
  --env 'IDP_METADATA=http://localhost:8190/realms/master/protocol/saml/descriptor' \
  --env 'COOKIES_TO_CLEAR=[{"domain":"localhost","name":"central-saml-logout-session-client-prefix"}]' \
  central-saml-logout:latest

while ! nc -z localhost 8191 || ! nc -z localhost 8192; do
  echo "Waiting 5 seconds for application instances to come up."
  sleep 5
done

exit 0
