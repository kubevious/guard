#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"

echo ""
echo "**** KUBEVIOUS CHANGE VALIDATOR ****"
echo ""

start_stage()
{
  echo "👉 *** ${STAGE_NAME}..."
}

finish_stage()
{
  echo "✅     ${STAGE_NAME}. Done."
}

handle_error()
{
  echo "🔴🔴🔴"
  echo "🔴🔴🔴 ERROR: ${1}"
  echo "🔴🔴🔴"
  exit 1;
}

check_dependent_tools()
{
  OUTPUT=$(which yq)
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    handle_error "YQ not found. Please install yq version 4.18+. https://github.com/mikefarah/yq/"
  fi

  OUTPUT=$(which gzip)
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    handle_error "GZIP not found. Please install gzip command line tool."
  fi

  OUTPUT=$(which base64)
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    handle_error "BASE64 not found. Please install base64 command line tool."
  fi

  OUTPUT=$(which kubectl)
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    handle_error "KUBECTL not found. Please install kubectl command line tool."
  fi
}

generate_uuid()
{
  if [[ -f "/proc/sys/kernel/random/uuid" ]]; then
    cat "/proc/sys/kernel/random/uuid";
    return;
  else 
    OUTPUT=$(which uuidgen)
    RESULT=$?
    if [ $RESULT -eq 0 ]; then
        uuidgen;
        return;
    fi
    handle_error "Could not generate UUID."
  fi
}

read_input() 
{
  STAGE_NAME="Reading Input"
  start_stage

  YAML_STREAM=""
  IFS='';
  while read line; do
    YAML_STREAM+="${line}"
    YAML_STREAM+="
"
  done < /dev/stdin

  finish_stage
}

parse_input() 
{
  STAGE_NAME="Parsing Input"
  start_stage

  FORMATTED_YAML_STREAM=$(echo ${YAML_STREAM} | yq -o yaml --no-colors)
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    handle_error "Malformed YAML streamed"
  fi

  finish_stage
}

build_package() 
{
  STAGE_NAME="Building Package"
  start_stage

  YAML_DATA=$(echo "${FORMATTED_YAML_STREAM}" | gzip | base64)

  NAMESPACE="default"

  CHANGE_PACKAGE_NAME="change-$(generate_uuid)"
  CHANGE_PACKAGE_NAME=$(echo "${CHANGE_PACKAGE_NAME}" | tr "[:upper:]" "[:lower:]")

  MANIFEST=""
  MANIFEST+="apiVersion: kubevious.io/v1\n"
  MANIFEST+="kind: ChangePackage\n"
  MANIFEST+="metadata:\n"
  MANIFEST+="  name: ${CHANGE_PACKAGE_NAME}\n"
  MANIFEST+="  namespace: ${NAMESPACE}\n"
  MANIFEST+="data:\n"
  MANIFEST+="  changes:\n"
  MANIFEST+="    - data: ${YAML_DATA}\n"

  finish_stage
}

apply_package() 
{
  STAGE_NAME="Apply Package"
  start_stage

  echo -e "${MANIFEST}" | kubectl apply -f -
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    handle_error "Could not apply change request. Make sure you have write access to kubevious.io/v1 ChangePackage"
  fi

  finish_stage
}

query_validation_status()
{
  VALIDATION_STATE_DATA=$(kubectl get ValidationState.v1.kubevious.io ${CHANGE_PACKAGE_NAME} -n ${NAMESPACE} -o yaml 2>/dev/null)
  RESULT=$?

  if [[ ${RESULT} -eq 0 ]]; then
    return 0;
  elif [[ ${RESULT} -eq 1 ]]; then
    return 1;
  else
    handle_error "Unknown error with kubectl. CODE: ${RESULT}"
  fi
}

wait_validation() 
{
  STAGE_NAME="Waiting Validation"
  start_stage

  while true
  do
    query_validation_status
    RESULT=$?
    if [[ ${RESULT} -eq 0 ]]; then

      VALIDATION_STATE=$(echo ${VALIDATION_STATE_DATA} | yq '.status.state')
      echo "⏳     State: ${VALIDATION_STATE}..."

      if [[ ${VALIDATION_STATE} == "failed" || ${VALIDATION_STATE} == "completed" ]]; then
        break;
      fi;
    else
      echo "⏳     State: pending..."
    fi
    # sleep 5
  done

  # echo "VALIDATION_STATE_DATA: ${VALIDATION_STATE_DATA}"

  finish_stage
}

output_success_status() 
{
  VALIDATION_STATE=$(echo ${VALIDATION_STATE_DATA} | yq '.status.state')

  if [[ ${VALIDATION_STATE} == "failed" || ${VALIDATION_STATE} == "completed" ]]; then
    break;
  fi;
}

handle_validation_result() 
{
  VALIDATION_STATE=$(echo ${VALIDATION_STATE_DATA} | yq '.status.state')

  if [[ ${VALIDATION_STATE} == "failed" ]]; then
    handle_error "Failed to validate changes. Make sure Kubevious is running properly."
    exit 1.
  fi;

  if [[ ${VALIDATION_STATE} != "completed" ]]; then
    handle_error "Unknown State ${VALIDATION_STATE}. Something went wrong."
    exit 1.
  fi;

  RAISED_ERRORS=$(echo ${VALIDATION_STATE_DATA} | yq '.status.summary.issues.raised.errors')
  RAISED_WARNINGS=$(echo ${VALIDATION_STATE_DATA} | yq '.status.summary.issues.raised.warnings')
  CLEARED_ERRORS=$(echo ${VALIDATION_STATE_DATA} | yq '.status.summary.issues.cleared.errors')
  CLEARED_WARNINGS=$(echo ${VALIDATION_STATE_DATA} | yq '.status.summary.issues.cleared.warnings')

  echo ""
  echo "Issue Summary Summary:"
  echo "👎 🔴 Raised Errors: ${RAISED_ERRORS}"
  echo "👎 ⚠️  Raised Warnings: ${RAISED_WARNINGS}"
  echo "👍 🔴 Cleared Errors: ${CLEARED_ERRORS}"
  echo "👍 ⚠️  Cleared Warnings: ${CLEARED_WARNINGS}"
  echo ""

  VALIDATION_SUCCESS=$(echo ${VALIDATION_STATE_DATA} | yq '.status.success')
  if [[ ${VALIDATION_SUCCESS} == "true" ]]; then
    echo "Change validation passed successfully."
    exit 0
  fi;
  handle_error "Change validation failed."
  exit 1
}

###
check_dependent_tools

###
read_input

###
parse_input

###
build_package

###
apply_package

###
wait_validation

###
handle_validation_result
