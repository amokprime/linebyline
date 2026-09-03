#!/bin/bash
snippet() {
    if [ -z "$(ls -A "$upload")" ]; then
        echo "Nothing to zip: $upload is empty" >&2
        exit 1
    fi
}
# shellcheck source=.base.sh
. "$(dirname "$(readlink -f "$0")")/.base.sh"
