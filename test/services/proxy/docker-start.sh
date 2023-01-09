#!/bin/bash

set -euo pipefail

docker run \
  --name apache2-slo-test-container \
  --detach \
  --net=host \
  --env "PROXY=apache2" \
  slo-with-proxy-test:latest

docker run \
  --name nginx-slo-test-container \
  --detach \
  --net=host \
  --env "PROXY=nginx" \
  slo-with-proxy-test:latest

while ! nc -z 127.0.0.1 8181 || ! nc -z 127.0.0.1 8182 || ! nc -z 127.0.0.1 8183 || ! nc -z 127.0.0.1 8184; do
  echo "Waiting 5 seconds for the proxy servers to come up."
  sleep 5
done

exit 0
