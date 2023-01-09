#!/bin/bash

set -euo pipefail

docker run \
  --name client-apache2-slo-test-container \
  --detach \
  --net=host \
  --env 'SERVER_HOSTNAME=0.0.0.0' \
  --env 'SERVER_PORT=8193' \
  --env 'BASE_URL=http://127.0.0.1:8183/test-client' \
  --env 'PATH_PREFIX=/client-prefix' \
  --env 'IDP_METADATA=http://127.0.0.1:8190/realms/master/protocol/saml/descriptor' \
  central-saml-logout:latest

docker run \
  --name client-nginx-slo-test-container \
  --detach \
  --net=host \
  --env 'SERVER_HOSTNAME=0.0.0.0' \
  --env 'SERVER_PORT=8194' \
  --env 'BASE_URL=http://127.0.0.1:8184/test-client' \
  --env 'PATH_PREFIX=/client-prefix' \
  --env 'IDP_METADATA=http://127.0.0.1:8190/realms/master/protocol/saml/descriptor' \
  central-saml-logout:latest

while ! nc -z 127.0.0.1 8193 || ! nc -z 127.0.0.1 8194; do
  echo "Waiting 5 seconds for test clients to come up."
  sleep 5
done

exit 0
