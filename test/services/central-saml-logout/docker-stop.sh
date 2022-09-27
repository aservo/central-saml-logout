#!/bin/bash

set -euo pipefail

docker stop app-apache2-slo-test-container &
docker stop app-nginx-slo-test-container &

wait

exit 0
