#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"

cd ${MY_DIR}

source ../../dependencies.git/k8s/configuration.sh
export KUBECONFIG=${K8S_CONFIG_PATH}


helm template ingress-nginx ingress-nginx/ingress-nginx | sh <(cat ../../scripts.git/validate.sh)

# helm template my-prometheus bitnami/kube-prometheus | sh <(cat ../../scripts.git/validate.sh)
# helm template my-prometheus bitnami/kube-prometheus | sh <(curl -sfL https://run.kubevious.io/validate.sh)
# helm template my-prometheus bitnami/kube-prometheus | bash <(wget -O - https://run.kubevious.io/validate.sh)
