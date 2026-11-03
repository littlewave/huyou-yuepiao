#!/bin/sh
# Build and publish dist/ to the gh-pages branch (GitHub Pages serves it).
# Run from the repo root: sh scripts/deploy-pages.sh
set -e
npm test
npm run build
touch dist/.nojekyll
remote=$(git remote get-url origin)
tmp=$(mktemp -d)
cp -R dist/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name)" -c user.email="$(git -C "$OLDPWD" config user.email)" commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f "$remote" gh-pages
cd - >/dev/null
rm -rf "$tmp"
echo "Published to gh-pages."
