# CI/CD Setup Guide

This document explains the CI/CD setup for automated testing and NPM package releases.

## Overview

The project uses GitHub Actions to automatically:
- Run tests on multiple Node.js versions
- Verify code quality (linting, type checking)
- Build the package
- Create GitHub releases
- Publish to NPM registry

## Workflow File

**Location:** `.github/workflows/ci-cd.yml`

**Based on:** Similar workflows from `@johnqh/di` and `@johnqh/types` packages

## Workflow Jobs

### 1. Test Job

**Runs on:** Every push and pull request to `main`

**Node.js versions tested:**
- 20.x
- 22.x

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies with `npm ci`
4. Run type checking: `npm run typecheck`
5. Run linting: `npm run lint`
6. Run unit tests: `npm run test:run`
7. Build project: `npm run build`

**Important:** Integration tests are NOT run in CI/CD as they require external API configuration.

### 2. Check for Release Job

**Purpose:** Determine if a release should be created

**Logic:**
- ✅ Release if push to `main` branch
- ✅ Release if PR is merged to `main`
- ❌ Skip if commit message contains `[skip ci]` or `[skip-ci]`
- ❌ Skip if PR is not merged

**Outputs:**
- `should_release`: Boolean flag
- `version`: Version from package.json (e.g., `0.0.1`)
- `version_tag`: Git tag format (e.g., `v0.0.1`)

### 3. Release NPM Job

**Runs when:**
- Test job passes
- Check for release outputs `should_release=true`

**Steps:**
1. Checkout code
2. Setup Node.js with NPM registry authentication
3. Verify package version
4. Install dependencies
5. Run tests with coverage: `npm run test:coverage`
6. Build project: `npm run build`
7. Verify build output (list dist/ contents)
8. Create GitHub Release with auto-generated notes
9. Publish to NPM: `npm publish --access public`
10. Notify success or failure

**Required Permissions:**
- `contents: write` - For creating GitHub releases
- `id-token: write` - For NPM provenance

## Required Setup

### 1. GitHub Repository Settings

#### Actions Permissions

1. Go to repository Settings → Actions → General
2. Enable "Allow all actions and reusable workflows"
3. Set "Workflow permissions" to "Read and write permissions"
4. Enable "Allow GitHub Actions to create and approve pull requests"

#### Secrets

Add the following secret:

**NPM_TOKEN**
- Type: Repository secret
- Purpose: Authenticate with NPM registry for publishing
- How to get:
  1. Login to [npmjs.com](https://www.npmjs.com)
  2. Go to Account Settings → Access Tokens
  3. Generate New Token → Classic Token
  4. Select "Automation" type
  5. Copy the token
  6. Add to GitHub: Settings → Secrets and variables → Actions → New repository secret
  7. Name: `NPM_TOKEN`
  8. Value: Paste the token

### 2. NPM Package Setup

#### Package Scope

The package is published under the `@johnqh` scope:
- Package name: `@johnqh/indexer_client`
- Access: Public
- Registry: npmjs.com

#### First-Time Publishing

If the package has never been published:

1. Ensure you have access to the `@johnqh` scope on NPM
2. The workflow will create the package on first publish
3. Set package to public: `npm publish --access public`

#### Version Management

Follow semantic versioning (SemVer):
- **Patch** (0.0.X): Bug fixes, no breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Major** (X.0.0): Breaking changes

## Usage

### Triggering a Release

#### Method 1: Version Bump and Push

```bash
# Bump version (choose one)
npm version patch  # 0.0.1 -> 0.0.2
npm version minor  # 0.0.1 -> 0.1.0
npm version major  # 0.0.1 -> 1.0.0

# This updates package.json and package-lock.json
# and creates a git commit

# Push to trigger workflow
git push origin main
git push --tags  # Optional: push version tag
```

#### Method 2: Manual Version Update

```bash
# Edit package.json manually
# Update "version": "0.0.2"

# Commit changes
git add package.json package-lock.json
git commit -m "chore: bump version to 0.0.2"

# Push to trigger workflow
git push origin main
```

### Skipping CI/CD

To commit without triggering the workflow:

```bash
git commit -m "docs: update README [skip ci]"
git push origin main
```

### Monitoring Releases

#### GitHub Actions UI

1. Go to repository on GitHub
2. Click "Actions" tab
3. View workflow runs
4. Click on a run to see detailed logs

#### Release Notifications

**Success Output:**
```
🚀 Release 0.0.1 deployed successfully!
• NPM: https://www.npmjs.com/package/@johnqh/indexer_client/v/0.0.1
• GitHub: https://github.com/USER/REPO/releases/tag/v0.0.1
• Documentation: https://github.com/USER/REPO#readme
```

**Failure Output:**
```
❌ Release deployment FAILED for commit abc123
Check: https://github.com/USER/REPO/actions/runs/123456789
```

## Release Process Flow

```
┌─────────────────┐
│ Push to main    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test Job       │
│  - Node 20.x    │
│  - Node 22.x    │
│  - Typecheck    │
│  - Lint         │
│  - Unit Tests   │
│  - Build        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Release   │
│  - Parse commit │
│  - Check PR     │
│  - Get version  │
└────────┬────────┘
         │
    [should_release?]
         │
         ├─ No ──► Stop
         │
         └─ Yes
            │
            ▼
┌─────────────────┐
│ Release Job     │
│  - Test         │
│  - Build        │
│  - GitHub Rel   │
│  - NPM Publish  │
└─────────────────┘
```

## What Gets Published

### NPM Package Contents

The published package includes only the `dist/` directory:

```json
{
  "files": [
    "dist/**/*"
  ]
}
```

**Included:**
- `dist/index.js` - Main entry point
- `dist/index.d.ts` - TypeScript definitions
- `dist/**/*.js` - All compiled JavaScript
- `dist/**/*.d.ts` - All type definitions

**Excluded:**
- Source files (`src/`)
- Tests (`__tests__/`, `__integration__/`)
- Configuration files
- Documentation (except what's in dist/)

### GitHub Release Contents

Each GitHub release includes:
- Release notes (auto-generated from commits)
- Package description and features
- Installation instructions
- Quick start guide
- Links to documentation
- API coverage summary

## Troubleshooting

### Test Failures

**Issue:** Tests pass locally but fail in CI

**Possible causes:**
- Node.js version differences (CI tests on 20.x and 22.x)
- Missing dependencies in package-lock.json
- Environment-specific code

**Solution:**
```bash
# Test with multiple Node versions locally
nvm use 20
npm test

nvm use 22
npm test
```

### NPM Publishing Failures

#### Error: 401 Unauthorized

**Cause:** Invalid or expired NPM_TOKEN

**Solution:**
1. Generate new NPM token
2. Update `NPM_TOKEN` secret in GitHub repository settings

#### Error: 403 Forbidden

**Cause:** No permission to publish to `@johnqh` scope

**Solution:**
1. Request access to the `@johnqh` NPM organization
2. Verify your NPM account has publish permissions

#### Error: Version Already Published

**Cause:** Attempting to publish same version twice

**Solution:**
```bash
# Bump version
npm version patch
git push origin main
```

### Build Failures

**Issue:** Build fails in CI but works locally

**Solution:**
1. Delete `node_modules/` and `dist/`
2. Run `npm ci` (not `npm install`)
3. Run `npm run build`
4. Check for TypeScript errors
5. Commit fixes

### GitHub Release Failures

**Issue:** `Resource not accessible by integration`

**Solution:**
1. Check Settings → Actions → General
2. Set "Workflow permissions" to "Read and write permissions"
3. Save and re-run workflow

## Best Practices

### Before Releasing

Checklist:
- [ ] All tests pass: `npm run check-all`
- [ ] Version bumped in package.json
- [ ] Documentation updated
- [ ] CHANGELOG updated (if applicable)
- [ ] Breaking changes documented
- [ ] Commit message is clear

### Version Strategy

**For v0.x.x (pre-1.0):**
- Patch: Bug fixes only
- Minor: New features or breaking changes
- Consider any change carefully

**For v1.x.x and beyond:**
- Patch: Bug fixes, backward compatible
- Minor: New features, backward compatible
- Major: Breaking changes only

### Commit Messages

Use conventional commits:

```
feat: add new feature
fix: correct bug
docs: update documentation
chore: maintenance tasks
test: add tests
refactor: code improvements
perf: performance improvements
ci: CI/CD changes
```

## Differences from Unit Tests

| Aspect | CI/CD Tests | Integration Tests |
|--------|-------------|-------------------|
| **Run in CI** | ✅ Yes | ❌ No |
| **Requires API** | ❌ No | ✅ Yes |
| **Speed** | Fast (~3s) | Slower (~30s) |
| **Mocked** | ✅ Yes | ❌ No |
| **Environment** | Any | Configured |
| **Command** | `npm run test:run` | `npm run test:integration` |

## Maintenance

### Updating Workflow

To update the workflow:

1. Edit `.github/workflows/ci-cd.yml`
2. Test locally with [act](https://github.com/nektos/act) (optional)
3. Commit changes
4. Push to a test branch first
5. Verify workflow runs correctly
6. Merge to main

### Monitoring

Set up monitoring:
- Watch GitHub Actions for failures
- Monitor NPM downloads: `npm info @johnqh/indexer_client`
- Check GitHub releases page
- Review workflow run history

## Related Documentation

- [.github/workflows/README.md](.github/workflows/README.md) - Detailed workflow documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [README.md](README.md) - Project overview
- [INTEGRATION_TESTS.md](INTEGRATION_TESTS.md) - Integration testing guide

## Summary

The CI/CD pipeline provides:
- ✅ Automated testing on multiple Node.js versions
- ✅ Code quality checks (linting, types)
- ✅ Automated NPM publishing
- ✅ GitHub releases with detailed notes
- ✅ Version tracking and tagging
- ✅ Fast feedback on pull requests
- ✅ Consistent release process

Every push to `main` triggers the workflow, ensuring quality and automating the release process.
