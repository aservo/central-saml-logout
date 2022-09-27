#!/bin/bash

set -euo pipefail

docker run \
  --name keycloak-slo-test-container \
  --detach \
  --net=host \
  --env "HTTP_PORT=8190" \
  --env "KEYCLOAK_ADMIN=admin" \
  --env "KEYCLOAK_ADMIN_PASSWORD=password" \
  slo-with-keycloak-test:latest

while ! nc -z localhost 8190; do
  echo "Waiting 5 seconds for Keycloak to come up."
  sleep 5
done

exit 0
