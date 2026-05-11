#!/bin/sh
set -e

# Change ownership of volume directories to appuser
# Use || true so it doesn't fail if read-only filesystem is enforced on non-volume paths
chown -R appuser:appgroup /app/public/data /app/server/private /app/server/logs 2>/dev/null || true

# Execute the main command as appuser
exec su-exec appuser "$@"
