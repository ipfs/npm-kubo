#!/usr/bin/env bash
set -euo pipefail

# Repo to source kubo releases from. Overridable to test against a fork.
KUBO_REPO="${KUBO_REPO:-ipfs/kubo}"

# Platform archives kubo attaches to a release, which npm-kubo serves to npm
# users: src/download.js has no platform allowlist and fetches each on demand as
# kubo_<tag>_<platform>-<arch>.<ext> together with its .sha512 checksum. A
# release is only safe to publish once every one of these archives and its
# checksum is attached and fully uploaded. Keep this list in sync if kubo changes
# the set of platforms it ships; a missing entry is logged by name below.
REQUIRED_PLATFORMS=(
  "darwin-amd64.tar.gz"
  "darwin-arm64.tar.gz"
  "linux-amd64.tar.gz"
  "linux-arm64.tar.gz"
  "linux-riscv64.tar.gz"
  "freebsd-amd64.tar.gz"
  "openbsd-amd64.tar.gz"
  "windows-amd64.zip"
  "windows-arm64.zip"
)

echo "💫 Checking https://github.com/${KUBO_REPO}/releases for new releases..."

# Version currently published from this repo, e.g. "0.42.0".
CURRENT=$(node -e 'console.log(require("./package.json").version)')

# Newest published (non-draft) kubo release, pre-releases included. GitHub lists
# releases newest-first, so the first non-draft entry is the latest one.
RELEASE=$(gh api "repos/${KUBO_REPO}/releases?per_page=20" \
  --jq 'map(select(.draft == false)) | .[0] // empty')

if [[ -z "$RELEASE" ]]; then
  echo "⚠️  No published kubo release found. Going back to sleep"
  echo "publish=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

TAG=$(jq -r '.tag_name' <<< "$RELEASE")   # e.g. "v0.42.0"
LATEST="${TAG#v}"                          # e.g. "0.42.0"

# Guard against a malformed tag rather than trying to publish it.
if ! [[ "$LATEST" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "⚠️  Ignoring $TAG - not a valid SemVer version. Going back to sleep"
  echo "publish=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

if [[ "$CURRENT" == "$LATEST" ]]; then
  echo "💤 $CURRENT is already the latest release. Going back to sleep"
  echo "publish=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

# Every required archive and its .sha512 checksum must be attached and fully
# uploaded before we publish; src/download.js fetches both at install time.
# GitHub marks an asset "uploaded" only once its bytes are in place, so filtering
# on that state also skips a release whose assets are still uploading.
UPLOADED=$(jq -r '.assets[] | select(.state == "uploaded") | .name' <<< "$RELEASE")
MISSING=()
for platform in "${REQUIRED_PLATFORMS[@]}"; do
  archive="kubo_${TAG}_${platform}"
  for asset in "$archive" "$archive.sha512"; do
    if ! grep -qxF -- "$asset" <<< "$UPLOADED"; then
      MISSING+=("$asset")
    fi
  done
done

if (( ${#MISSING[@]} > 0 )); then
  echo "⏳ Ignoring $TAG - release is missing ${#MISSING[@]} required asset(s):"
  printf '     %s\n' "${MISSING[@]}"
  echo "   kubo may still be uploading them; will retry on the next run."
  echo "publish=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

echo "🎉 New kubo release $TAG with all required binaries attached"
echo "publish=true" >> "$GITHUB_OUTPUT"
echo "version=$LATEST" >> "$GITHUB_OUTPUT"
