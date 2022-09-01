#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"

cd ${MY_DIR}

source ../../dependencies.git/k8s/configuration.sh
export KUBECONFIG=${K8S_CONFIG_PATH}

cat ../../demos.git/guard/debugging/nginx.yaml | sh <(cat ../../scripts.git/validate.sh)