#!/bin/sh

# Load DNS environment variable setup script
. /dns-env.sh

# If no arguments, or the first argument is "daemon", start the daemon
if [ $# -eq 0 ] || [ "$1" = "daemon" ]; then
    # Execute the native entrypoint of the acme.sh image, passing the daemon argument
    exec /entry.sh daemon
else
    # Otherwise, execute the passed command (usually acme.sh with its arguments)
    exec /acmebin/acme.sh "$@"
fi
