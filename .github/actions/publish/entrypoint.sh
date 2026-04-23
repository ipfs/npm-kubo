#!/usr/bin/env bash
set -eu

# Current version in package.json (e.g. "0.4.20")
CURRENT=$(node -e 'console.log(require("./package.json").version)')
# Latest version on dist.ipfs.tech (e.g. "0.4.21")
LATEST=$(curl --silent --show-error --fail https://dist.ipfs.tech/kubo/versions | tail -n 1 | cut -c 2-)

# Verify $LATEST is valid semver
if ! npx semver "$LATEST"; then
  echo "⚠️  Ignoring version $LATEST - Invalid SemVer string"
  exit 1
fi

if [[ "$CURRENT" == "$LATEST" ]]; then
  echo "💤 $CURRENT is already the latest release. Nothing to do."
  exit 0
fi

# If the version contains a dash it's a pre-release (e.g. "0.4.21-rc3").
# Publish pre-releases under the @next tag and full releases under @latest.
if [[ "$LATEST" =~ - ]]; then
  NPM_DIST_TAG='next'
  echo "🧪 Found new kubo pre-release $LATEST@$NPM_DIST_TAG"
else
  NPM_DIST_TAG='latest'
  echo "🎉 Found new kubo release $LATEST@$NPM_DIST_TAG"
fi

# The workspace starts as a detached commit for scheduled builds.
git checkout master

# post-install rewrites bin/ipfs, so undo that change before committing.
git checkout -- bin/ipfs

# Set sensible commit info
git config --global user.name  "${GITHUB_ACTOR}"
git config --global user.email "${GITHUB_ACTOR}@users.noreply.github.com"

npm version "$LATEST"

# --provenance emits a sigstore attestation alongside the tarball.
# Authentication is handled by npm via OIDC (Trusted Publishing) using the
# id-token permission granted to this job; no NPM_AUTH_TOKEN is needed.
npm publish --provenance --access public --tag "$NPM_DIST_TAG"
echo "📦 Published $LATEST to npm as kubo@$NPM_DIST_TAG"

git push -u origin master
git push --tags
echo "👍 Pushed changes back to master"
