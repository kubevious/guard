#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"

cd ${MY_DIR}

# helm repo add bitnami https://charts.bitnami.com/bitnami

# helm repo update

helm template my-prometheus bitnami/kube-prometheus | ../cli/validate-change.sh
