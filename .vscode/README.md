# VS Code Configuration

This directory contains VS Code workspace settings for the project.

## Files

### settings.json

Workspace-specific settings that configure:

- **Format on Save**: Automatically formats code when you save files
- **Prettier Integration**: Uses Prettier as the default formatter
- **ESLint Integration**: Auto-fixes ESLint issues on save
- **TypeScript Configuration**: Uses workspace TypeScript version
- **File Associations**: JSON with comments support
- **Exclusions**: Hides build artifacts and dependencies from explorer

### extensions.json

Recommended VS Code extensions for this project:

**Essential:**
- **Prettier** (`esbenp.prettier-vscode`) - Code formatter
- **ESLint** (`dbaeumer.vscode-eslint`) - JavaScript/TypeScript linter

**Recommended:**
- TypeScript language features
- GitLens
- Path Intellisense
- Error Lens
- And more...

## Setup

### 1. Install Prettier Extension

If you don't have the Prettier extension installed:

1. Open VS Code
2. Press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux)
3. Search for "Prettier - Code formatter"
4. Click Install

Or install from command line:
```bash
code --install-extension esbenp.prettier-vscode
```

### 2. Install Recommended Extensions

VS Code will prompt you to install recommended extensions when you open this project.

Or install all at once:
```bash
# Install Prettier
code --install-extension esbenp.prettier-vscode

# Install ESLint
code --install-extension dbaeumer.vscode-eslint
```

### 3. Verify Configuration

After installing extensions:

1. Open any TypeScript/JavaScript file
2. Make a change and save (`Cmd+S` or `Ctrl+S`)
3. Prettier should automatically format the file

## How It Works

### Format on Save

When you save a file:
1. Prettier formats the code according to `.prettierrc`
2. ESLint auto-fixes any fixable issues

### Supported File Types

Prettier will format on save for:
- JavaScript (`.js`)
- TypeScript (`.ts`)
- React/JSX (`.jsx`, `.tsx`)
- JSON (`.json`)
- Markdown (`.md`)

### ESLint Integration

ESLint will:
- Show errors and warnings inline
- Auto-fix issues on save (when possible)
- Validate TypeScript files

## Troubleshooting

### Prettier Not Working

**Issue:** Code is not formatted on save

**Solutions:**

1. **Check extension is installed:**
   - Open Extensions panel (`Cmd+Shift+X`)
   - Search for "Prettier"
   - Verify it's installed and enabled

2. **Check file type is supported:**
   - Prettier only formats certain file types
   - Check the status bar shows "Prettier" as formatter

3. **Reload VS Code:**
   ```
   Cmd+Shift+P → Developer: Reload Window
   ```

4. **Check Output panel:**
   - View → Output
   - Select "Prettier" from dropdown
   - Look for error messages

5. **Verify Prettier is set as default formatter:**
   - Open Command Palette (`Cmd+Shift+P`)
   - Type "Format Document With..."
   - Select "Configure Default Formatter..."
   - Choose "Prettier - Code formatter"

### ESLint Not Working

**Issue:** ESLint not showing errors or auto-fixing

**Solutions:**

1. **Install ESLint extension:**
   ```bash
   code --install-extension dbaeumer.vscode-eslint
   ```

2. **Check ESLint output:**
   - View → Output
   - Select "ESLint" from dropdown

3. **Restart ESLint server:**
   - Cmd+Shift+P → "ESLint: Restart ESLint Server"

### Format on Save Not Working

**Issue:** Files not formatting automatically on save

**Check workspace settings:**

1. Open Settings (`Cmd+,`)
2. Search for "format on save"
3. Ensure "Editor: Format On Save" is checked
4. Check workspace settings override user settings

**Verify settings.json:**
- Should have `"editor.formatOnSave": true`
- Should have `"editor.defaultFormatter": "esbenp.prettier-vscode"`

## Manual Formatting

If you need to format manually:

### Format Entire File
- Mac: `Shift+Option+F`
- Windows/Linux: `Shift+Alt+F`
- Or: Right-click → Format Document

### Format Selection
- Mac: `Cmd+K Cmd+F`
- Windows/Linux: `Ctrl+K Ctrl+F`
- Or: Right-click → Format Selection

### Using Command Palette
1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type "Format Document"
3. Press Enter

## NPM Scripts

You can also format code using npm scripts:

```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check

# Fix ESLint issues
npm run lint:fix
```

## Configuration Files

### .prettierrc

Prettier configuration in the project root:
- Semi-colons: Yes
- Single quotes: Yes
- Print width: 80
- Tab width: 2
- And more...

### eslint.config.js

ESLint configuration with:
- TypeScript support
- React rules
- Prettier integration (no conflicts)

## Customization

### User Settings vs Workspace Settings

**Workspace settings** (`.vscode/settings.json`):
- Applied to this project only
- Shared with team via git

**User settings** (global):
- Applied to all projects
- Not shared

### Override Settings

To override workspace settings for yourself only:

1. Open Settings (`Cmd+,`)
2. Click "Workspace" tab
3. Search for setting
4. Click "Edit in settings.json"
5. Add to user settings instead

## Tips

### Organize Imports on Save

The workspace is configured to:
- Auto-fix ESLint issues on save
- This includes organizing imports

### Keyboard Shortcuts

Useful shortcuts:
- `Cmd+Shift+P` - Command Palette
- `Cmd+P` - Quick Open File
- `Cmd+,` - Settings
- `Shift+Option+F` - Format Document
- `Cmd+Shift+X` - Extensions
- `Cmd+Shift+E` - Explorer
- `Ctrl+` ` - Terminal

### Multi-Cursor Editing

- `Option+Click` - Add cursor
- `Cmd+Option+Down` - Add cursor below
- `Cmd+D` - Select next occurrence

## Team Collaboration

This configuration ensures:
- Consistent code formatting across the team
- Automatic code quality checks
- Same development experience for all developers

All team members should:
1. Install recommended extensions
2. Use workspace TypeScript version
3. Enable format on save

## Related Documentation

- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [VS Code Formatting](https://code.visualstudio.com/docs/editor/codebasics#_formatting)
- [VS Code TypeScript](https://code.visualstudio.com/docs/languages/typescript)
