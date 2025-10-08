# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflows

### ci-cd.yml - Test and Release

Automated testing and NPM package publishing workflow.

#### Triggers

- **Push to main branch**: Runs tests and releases
- **Pull requests to main**: Runs tests only
- **Merged PRs**: Runs tests and releases

#### Jobs

##### 1. Test Job

Runs on every push and PR. Tests against multiple Node.js versions:

- Node.js 20.x
- Node.js 22.x

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies (`npm ci`)
4. Run type checking (`npm run typecheck`)
5. Run linting (`npm run lint`)
6. Run unit tests (`npm run test:run`)
7. Build project (`npm run build`)

**Note:** Integration tests are NOT run in CI/CD as they require a live indexer endpoint.

##### 2. Check for Release Job

Determines if a release should be triggered based on:

- Commit message (skips if contains `[skip ci]` or `[skip-ci]`)
- PR status (only merged PRs trigger releases)
- Extracts version from `package.json`

**Outputs:**
- `should_release`: Boolean indicating if release should proceed
- `version`: Current version from package.json
- `version_tag`: Git tag (e.g., `v0.0.1`)

##### 3. Release NPM Job

**Runs only if:**
- Test job passes
- Check for release job indicates release should proceed

**Steps:**
1. Checkout code
2. Setup Node.js with NPM registry
3. Verify package version
4. Install dependencies
5. Run tests with coverage
6. Build project
7. Verify build output
8. Create GitHub Release with auto-generated notes
9. Publish to NPM registry
10. Notify success/failure

**Required Secrets:**
- `NPM_TOKEN`: NPM authentication token for publishing

## Configuration

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NPM_MODULE_NAME` | `@johnqh/indexer_client` | Package name |

### Required Repository Secrets

#### NPM_TOKEN

NPM authentication token with publish permissions.

**To create:**

1. Login to npmjs.com
2. Go to Account → Access Tokens
3. Generate New Token → Classic Token
4. Select "Automation" type
5. Copy the token
6. Go to GitHub repository → Settings → Secrets → Actions
7. Create new secret named `NPM_TOKEN`
8. Paste the token value

### Permissions

The release job requires:

- `contents: write` - Create GitHub releases and tags
- `id-token: write` - Publish to NPM with provenance

## Usage

### Triggering a Release

1. **Update version in package.json:**
   ```bash
   npm version patch  # 0.0.1 -> 0.0.2
   # or
   npm version minor  # 0.0.1 -> 0.1.0
   # or
   npm version major  # 0.0.1 -> 1.0.0
   ```

2. **Commit and push:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to 0.0.2"
   git push origin main
   ```

3. **Workflow automatically:**
   - Runs tests
   - Creates GitHub release with tag
   - Publishes to NPM

### Skipping CI/CD

To commit without triggering CI/CD:

```bash
git commit -m "docs: update README [skip ci]"
```

### Manual Trigger

Workflows can also be manually triggered from:

GitHub → Actions → CI/CD - Test and Release → Run workflow

## Monitoring

### Check Workflow Status

1. Go to repository on GitHub
2. Click "Actions" tab
3. View workflow runs and logs

### Notifications

The workflow provides notifications:

**Success:**
```
🚀 Release X.Y.Z deployed successfully!
• NPM: https://www.npmjs.com/package/@johnqh/indexer_client/v/X.Y.Z
• GitHub: https://github.com/OWNER/REPO/releases/tag/vX.Y.Z
```

**Failure:**
```
❌ Release deployment FAILED for commit SHA
Check: https://github.com/OWNER/REPO/actions/runs/RUN_ID
```

## Troubleshooting

### Test Failures

If tests fail in CI but pass locally:

1. Check Node.js version compatibility (test runs on 20.x and 22.x)
2. Verify dependencies are properly locked in `package-lock.json`
3. Check for environment-specific issues
4. Review test logs in Actions tab

### Release Failures

Common issues:

#### NPM_TOKEN Invalid

**Error:** `401 Unauthorized`

**Solution:**
1. Generate new NPM token
2. Update `NPM_TOKEN` secret in repository settings

#### Version Already Published

**Error:** `You cannot publish over the previously published versions`

**Solution:**
1. Bump version in package.json
2. Commit and push again

#### Build Failures

**Error:** Build step fails

**Solution:**
1. Run `npm run build` locally
2. Fix any TypeScript errors
3. Commit fixes and push

#### GitHub Release Fails

**Error:** `Resource not accessible by integration`

**Solution:**
1. Check repository Settings → Actions → General
2. Ensure "Read and write permissions" is enabled
3. Re-run the workflow

## Best Practices

### Version Management

- Use semantic versioning (SemVer)
- Patch (0.0.X): Bug fixes
- Minor (0.X.0): New features, backward compatible
- Major (X.0.0): Breaking changes

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
chore: maintenance tasks
test: add tests
refactor: code refactoring
```

### Pre-Release Checklist

Before pushing to main:

- [ ] All tests pass locally (`npm run check-all`)
- [ ] Version bumped in package.json
- [ ] CHANGELOG updated (if applicable)
- [ ] Documentation updated
- [ ] Breaking changes documented

## Integration Tests

**Important:** Integration tests are NOT run in CI/CD because they require:

- Live indexer endpoint configuration
- Environment variable `INTEGRATION_TEST_INDEXER_URL`
- Network access to external API

Integration tests should be run manually:

```bash
# Local integration testing
cp .env.example .env.test
# Edit .env.test with test endpoint
npm run test:integration
```

## Related Documentation

- [Main README](../../README.md) - Project overview
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [INTEGRATION_TESTS.md](../../INTEGRATION_TESTS.md) - Integration test guide

## Support

For issues with GitHub Actions:

1. Check workflow logs in Actions tab
2. Review this documentation
3. Check GitHub Actions documentation
4. Open an issue on GitHub
