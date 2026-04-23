#!/usr/bin/env bash
set -eu

echo '💫 Checking https://dist.ipfs.tech/kubo/versions for new releases...'

# The version in package.json e.g. "0.4.20"
CURRENT=$(node -e 'console.log(require("./package.json").version)')
# The latest version on dist.ipfs.tech e.g. "0.4.21"
LATEST=$(curl --silent --show-error --fail https://dist.ipfs.tech/kubo/versions | tail -n 1 | cut -c 2-)

# Verify $LATEST is valid semver!
if ! npx semver "$LATEST"; then
  echo "⚠️  Ignoring version $LATEST - Invalid SemVer string"
  exit 1
fi

if [[ "$CURRENT" != "$LATEST" ]]; then
  echo "🎉 New release exists $LATEST"

  echo "publish=true" >> "$GITHUB_OUTPUT"
else
  echo "💤 $CURRENT is the latest release. Going back to sleep"

  echo "publish=false" >> "$GITHUB_OUTPUT"
fi
