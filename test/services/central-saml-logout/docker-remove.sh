#!/bin/bash

set -euo pipefail

docker rm app-apache2-slo-test-container &
docker rm app-nginx-slo-test-container &

wait

exit 0
