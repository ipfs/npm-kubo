#!/bin/sh

USAGE="usage $0 <version>\npublish a version of go-ipfs to npm"
if [ "$#" -ne 1 ]; then
  echo $USAGE
  exit 0
fi
# arguments: <version>
version=$1

die() {
  echo >&2 "error: $@"
  exit 1
}

# check the version is indeed a tag in go-ipfs
repo="https://github.com/ipfs/go-ipfs"
git ls-remote -t $repo | egrep "refs/tags/v$version$" >/dev/null 2>&1 ||
  die "$version not a tag in $repo"

# check the bin/ipfs file is less than one MB.
binsize=$(./filesize.js bin/ipfs)
if [ "$binsize" -gt "4096" ]; then
  die "bin directory larger than expected.
did you change bin/ipfs? try: git checkout bin/ipfs"
fi

# ok, publishing now.

echo "--> updating version in package.json"
json -I -f package.json -e "this.version='$version'"

# publish to github + npm
echo "\n--> publishing to git/github"
git add package.json
git commit -m "v$version"
git push origin master

echo "\n--> publishing go-ipfs@$version to npm"
npm publish
