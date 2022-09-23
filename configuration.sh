export SERVER_PORT=4005
export CONTAINER_NAME=kubevious-guard
export NETWORK_NAME=kubevious
export IMAGE_NAME=kubevious-guard
export IMAGE_NAME_UBI=${IMAGE_NAME}-ubi

export BACKEND_BASE_URL=http://localhost:4002

source ../dependencies.git/runtime-configuration.sh
source ../dependencies.git/worldvious/configuration.sh