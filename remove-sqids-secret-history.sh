#!/bin/bash
# Remove all traces of SQIDS_ALPHABET from git history and force-push cleaned repo
# WARNING: This rewrites history. All collaborators must re-clone after this.

# 1. Make sure you have git-filter-repo installed
if ! command -v git-filter-repo &> /dev/null; then
  echo "git-filter-repo not found. Install with: brew install git-filter-repo (macOS) or pip install git-filter-repo (Linux)"
  exit 1
fi

# 2. Remove all .env files from history (safer than trying to surgically edit secrets)
git filter-repo --force --path server/.env --invert-paths

# 3. Add .env to .gitignore if not already present
grep -qxF 'server/.env' .gitignore || echo 'server/.env' >> .gitignore

# 4. If 'origin' remote is missing, re-add it (see filter-repo docs)
if ! git remote | grep -q origin; then
  echo "NOTICE: 'origin' remote was removed by git-filter-repo. You must re-add it manually."
  echo "Example: git remote add origin <your-repo-url>"
fi

# 5. Force-push the cleaned history to origin/main (if origin exists)
if git remote | grep -q origin; then
  git push --force origin main
  echo "History rewritten. All collaborators must re-clone the repository."
else
  echo "Skipped push: No 'origin' remote found. Add it and push manually."
fi
