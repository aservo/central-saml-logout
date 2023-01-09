#!/bin/bash

set -euo pipefail

docker run \
  --name keycloak-slo-test-container \
  --detach \
  --net=host \
  --env "KC_HTTP_PORT=8190" \
  --env "KEYCLOAK_ADMIN=admin" \
  --env "KEYCLOAK_ADMIN_PASSWORD=password" \
  slo-with-keycloak-test:latest

while ! nc -z 127.0.0.1 8190; do
  echo "Waiting 5 seconds for Keycloak to come up."
  sleep 5
done

exit 0
