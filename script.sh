#!/bin/bash

# Define the URLs of extensions to install
urls=(
    https://github.com/hatchways/live-interviewing/releases/download/v0.0.2/hatchways-0.0.2.vsix
)

# Temporary directory for downloading
tdir=/tmp/exts
mkdir -p "${tdir}"
cd "${tdir}"

# Download extensions
wget "${urls[@]}"

# List downloaded extensions
exts=("${tdir}"/*)

# Install extensions
for ext in "${exts[@]}"; do
    ${OPENVSCODE} --install-extension "${ext}"
done

# Start openvscode-server
exec ${OPENVSCODE_SERVER_ROOT}/bin/openvscode-server --host 0.0.0.0 --without-connection-token "$@"
