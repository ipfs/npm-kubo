#!/usr/bin/env bash
set -eu

echo '💫 Checking https://dist.ipfs.io/go-ipfs/versions for new releases...'

# The version in packge.json e.g. "0.4.20"
CURRENT=`node -e 'console.log(require("./package.json").version)'`
# The latest version on dist.ipfs.io e.g. "0.4.21"
LATEST=`curl --silent https://dist.ipfs.io/go-ipfs/versions | tail -n 1 | cut -c 2-`

# Verify $LATEST is valid semver!
if ! npx semver $LATEST; then
  echo "⚠️  Ignoring version $LATEST - Invalid SemVer string"
  exit 1
fi

if [[ "$CURRENT" != "$LATEST" ]]; then
  echo "🎉 New release exists $LATEST"

  echo "::set-output name=publish::true"
else
  echo "💤 $CURRENT is the latest release. Going back to sleep"

  echo "::set-output name=publish::false"
fi
