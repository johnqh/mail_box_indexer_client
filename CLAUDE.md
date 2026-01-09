# CLAUDE.md - AI Assistant Guide

This file provides guidance for AI assistants working with this repository.

## Project Overview

`@sudobility/indexer_client` is a React and React Native compatible client library for blockchain mail indexer API with TypeScript support. It provides hooks and utilities for interacting with the mail indexer service.

**Package**: `@sudobility/indexer_client`
**Type**: ES Module (TypeScript)
**Compatibility**: React 18+, React Native

## Package Manager

**This project uses Bun as the package manager.** Always use `bun` commands instead of `npm`:

```bash
# Install dependencies
bun install

# Run any script
bun run <script-name>
```

## Development Commands

```bash
# Build the library
bun run build

# Watch mode compilation
bun run build:watch

# Clean dist directory
bun run clean

# Type checking
bun run typecheck
bun run typecheck:watch

# Testing
bun run test           # Watch mode
bun run test:run       # Run once
bun run test:coverage  # Coverage report
bun run test:watch     # Watch mode
bun run test:integration      # Integration tests
bun run test:integration:watch

# Code Quality
bun run lint           # Run ESLint
bun run lint:fix       # Auto-fix ESLint issues
bun run format         # Format code with Prettier
bun run format:check   # Check formatting

# Full check (lint + typecheck + test)
bun run check-all
```

## Project Structure

```
src/
├── index.ts              # Main entry point
├── types.ts              # Type definitions
├── hooks/                # React hooks for API interaction
├── business/             # Business logic layer
├── network/              # Network/API client layer
├── utils/                # Utility functions
└── __integration__/      # Integration tests
dist/                     # Compiled output (auto-generated)
```

## Architecture

### Core Modules

1. **Hooks** (`hooks/`)
   - React hooks for data fetching with TanStack Query
   - Cross-platform support (React and React Native)

2. **Business Layer** (`business/`)
   - Business logic for mail indexer operations
   - Data transformation and validation

3. **Network Layer** (`network/`)
   - API client for indexer service
   - Request/response handling

4. **Utils** (`utils/`)
   - Utility functions and helpers

### Dependencies

**Peer Dependencies**:
- `@sudobility/di` - Dependency injection interfaces
- `@sudobility/mail_box_types` - Mail box type definitions
- `@sudobility/types` - Shared type definitions
- `@tanstack/react-query` - Data fetching library
- `react` - React 18+

## Development Guidelines

### Adding New Hooks

1. Create hook file in `src/hooks/`
2. Use TanStack Query patterns
3. Export from `src/hooks/index.ts`
4. Add to main exports in `src/index.ts`
5. Add tests

### Testing Strategy

- Use Vitest for testing
- Integration tests in `__integration__/`
- Test hooks with React Testing Library
- Use happy-dom for DOM testing

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier
- **Linting**: ESLint with React hooks plugin
- **Query Pattern**: Use TanStack Query for data fetching

## AI Assistant Instructions

### Quick Start

1. **Read this file first** - Contains project context
2. **Check existing hooks** - Before adding new functionality
3. **Follow TanStack Query patterns** - Consistent data fetching
4. **Test everything** - Run `bun run test` after changes
5. **Full check** - Run `bun run check-all` before committing

### Common Tasks

**Adding a new API hook**:
1. Create `use<Feature>.ts` in `src/hooks/`
2. Implement using TanStack Query
3. Export from `src/hooks/index.ts`
4. Add to `src/index.ts`
5. Add tests

**Running integration tests**:
1. Ensure indexer service is running
2. Run `bun run test:integration`

### Project Invariants

1. **Cross-platform** - Must work on React and React Native
2. **Peer dependencies** - Don't bundle core dependencies
3. **TanStack Query** - Use for all data fetching
4. **ESM only** - Module type is ESM
