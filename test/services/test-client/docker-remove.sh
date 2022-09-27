#!/bin/bash

set -euo pipefail

docker rm client-apache2-slo-test-container &
docker rm client-nginx-slo-test-container &

wait

exit 0
