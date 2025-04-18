
# Understanding vite.config.ui.ts for Beginners

This file configures how the UI part of your Figma plugin gets built. Let me explain it in simple terms:

## What is Vite?

Vite is a modern tool that helps build web applications quickly. Think of it as a kitchen appliance that takes your raw ingredients (code files) and prepares them into a finished meal (the final plugin).

## Breaking Down the File

### Import Section
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import svgr from 'vite-plugin-svgr';
```
This section brings in tools needed for the configuration:
- `defineConfig`: The main function to create a Vite configuration
- `resolve`: Helps with file paths
- The other imports are plugins that add extra features

### Configuration Object
```typescript
export default defineConfig({
  // Configuration goes here
})
```
This creates and exports the configuration that Vite will use.

### Path Aliases
```typescript
resolve: {
  alias: {
    '~ui': resolve(__dirname, 'src', 'ui'),
    '~test-utils': resolve(__dirname, 'src', 'test-utils'),
    '~types': resolve(__dirname, 'src', 'types'),
    '~utils': resolve(__dirname, 'src', 'utils'),
  },
},
```
This creates shortcuts for importing files:
- Instead of writing `import Button from '../../src/ui/components/Button'` 
- You can write `import Button from '~ui/components/Button'`

It's like creating shortcuts on your desktop to folders deep in your computer.

### Plugins
```typescript
plugins: [react(), svgr(), viteSingleFile()],
```
Plugins add extra capabilities:
- `react()`: Allows using React for the UI
- `svgr()`: Lets you import SVG files as React components
- `viteSingleFile()`: Bundles everything into one HTML file (important for Figma plugins)

### Root Directory
```typescript
root: './src/ui',
```
This tells Vite where to find the source files for the UI. It's saying "start looking for UI files in the './src/ui' folder."

### Build Settings
```typescript
build: {
  emptyOutDir: false,
  outDir: resolve(__dirname, 'dist'),
  target: 'es2015',
},
```
This controls how the final build is created:
- `emptyOutDir: false`: Don't delete existing files in the output directory
- `outDir: resolve(__dirname, 'dist')`: Put the final files in the 'dist' folder
- `target: 'es2015'`: Use JavaScript features supported in browsers from 2015 onwards

### Test Configuration
```typescript
test: {
  name: 'ui',
  environment: 'jsdom',
  coverage: {
    provider: 'v8',
    reportsDirectory: resolve(__dirname, 'coverage', 'ui'),
  },
},
```
This sets up how tests will run:
- `environment: 'jsdom'`: Tests will run in a simulated browser environment
- The coverage section defines how test coverage reports are generated

## How It Works in the Figma Plugin

1. When you build the plugin, Vite reads this configuration
2. It finds all the UI files in `./src/ui` 
3. It processes them using the plugins (React, SVG support, etc.)
4. It combines them into a single file in the `dist` folder
5. This single file becomes the UI part of your Figma plugin

The UI configuration works alongside `vite.config.api.ts` (for the plugin's backend code) to create the complete Figma plugin.
