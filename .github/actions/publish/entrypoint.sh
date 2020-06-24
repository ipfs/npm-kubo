#!/usr/bin/env bash
set -eu

# Set up npm home, so `npm publish` works.
# https://github.com/actions/npm/blob/59b64a598378f31e49cb76f27d6f3312b582f680/entrypoint.sh
if [ -n "$NPM_AUTH_TOKEN" ]; then
  # Respect NPM_CONFIG_USERCONFIG if it is provided, default to $HOME/.npmrc
  NPM_CONFIG_USERCONFIG="${NPM_CONFIG_USERCONFIG-"$HOME/.npmrc"}"
  NPM_REGISTRY_URL="${NPM_REGISTRY_URL-registry.npmjs.org}"
  NPM_STRICT_SSL="${NPM_STRICT_SSL-true}"
  NPM_REGISTRY_SCHEME="https"
  if ! $NPM_STRICT_SSL
  then
    NPM_REGISTRY_SCHEME="http"
  fi

  # Allow registry.npmjs.org to be overridden with an environment variable
  printf "//%s/:_authToken=%s\\nregistry=%s\\nstrict-ssl=%s" "$NPM_REGISTRY_URL" "$NPM_AUTH_TOKEN" "${NPM_REGISTRY_SCHEME}://$NPM_REGISTRY_URL" "${NPM_STRICT_SSL}" > "$NPM_CONFIG_USERCONFIG"

  chmod 0600 "$NPM_CONFIG_USERCONFIG"
fi

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

  # If the version contains a dash it's a pre-release, e.g "0.4.21-rc3"
  # Publish pre-releases under the @next tag and releases @latest tag.
  if [[ $LATEST =~ "-" ]]; then
    NPM_DIST_TAG='next'
    echo "🧪 Found new go-ipfs pre-release $LATEST@$NPM_DIST_TAG"
  else
    NPM_DIST_TAG='latest'
    echo "🎉 Found new go-ipfs release $LATEST@$NPM_DIST_TAG"
  fi

  # The workspace starts as a detached commit for scheduled builds...
  git rev-parse --abbrev-ref HEAD
  git checkout master

  # post-install rewrites bin/ipfs so undo that change
  git checkout -- bin/ipfs

  # Set sensible commit info
  git config --global user.name "${GITHUB_ACTOR}"
  git config --global user.email "${GITHUB_ACTOR}@users.noreply.github.com"

  npm version $LATEST
  npm publish --access public --tag $NPM_DIST_TAG
  echo "📦 Published $LATEST to npm as go-ipfs@$NPM_DIST_TAG"

  git push -u origin master
  git push --tags
  echo "👍 Pushed changes back to master"

else
  echo "💤 $CURRENT is the latest release. Going back to sleep"
  # neutral github action exit... not good, not bad.
  # https://developer.github.com/actions/creating-github-actions/accessing-the-runtime-environment/#exit-codes-and-statuses
  exit 78
fi
