#!/bin/bash

set -euo pipefail

SELF_PATH="$(dirname "$(readlink -f "$0")")"

docker build \
  --tag slo-with-proxy-test:latest \
  "$SELF_PATH/docker"

exit 0
