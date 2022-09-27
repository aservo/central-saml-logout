#!/bin/bash

set -euo pipefail

SELF_PATH="$(dirname "$(readlink -f "$0")")"

docker build \
  --tag slo-with-keycloak-test:latest \
  "$SELF_PATH/docker"

exit 0
