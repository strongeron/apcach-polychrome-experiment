
# Polychrom Plugin Learning Plan

## 1. Project Architecture & Setup (Week 1)

### A. Figma Plugin Structure
- Study the plugin entry points:
  - `src/api/index.ts` - The Figma plugin backend
  - `src/ui/index.tsx` - The React-based UI interface
  - The manifest.json configuration

### B. Build System
- Examine `vite.config.api.ts` and `vite.config.ui.ts` to understand how the plugin is built
- Notice the separate build configurations for UI and API (plugin backend)

### C. Hands-on Exercise:
Add a simple console log to the plugin initialization:
```typescript
// In src/api/index.ts
figma.on('run', () => {
  console.log('Polychrom plugin started!');
  sendSelectionDataToUi();
});
```

## 2. Color Science & Technical Foundations (Week 2)

### A. Color Spaces & Representations
- Study the color representation in `src/types/common.ts` and `src/types/figma.ts`
- Explore the OKLCH color space used in the app

### B. APCA Algorithm Basics
- Understand how APCA works in `src/utils/apca/calculate-apca-score.ts`
- Experiment with the `apcach` library implementation

### C. Hands-on Exercise:
Try converting between color formats using the existing utilities:
```typescript
// Look at formatters.ts for conversion examples
import { hexToRgb } from '~utils/colors/formatters';
const rgbColor = hexToRgb('#FF5500');
console.log(rgbColor); // Outputs the RGB values
```

## 3. React & Component Architecture (Week 3)

### A. Key Components Structure
- Study the component hierarchy starting from `src/ui/components/App.tsx`
- Examine how state is managed in components like `ColorAdjustmentSliders.tsx`

### B. Component Communication Patterns
- Notice how props are passed down through components
- See how callbacks are used for upward communication

### C. Hands-on Exercise:
Modify a component's UI by adding a simple label:
```tsx
// In any component JSX
<div className="text-xs mt-2 text-gray-500">
  Powered by APCA algorithm
</div>
```

## 4. Plugin-to-Figma Communication (Week 4)

### A. Message Passing System
- Study `src/types/messages.ts` to understand the message types
- See how `postMessage` is used in `ColorAdjustmentSliders.tsx` to communicate with Figma
- Examine message handling in `src/api/index.ts`

### B. Selection Handling
- Study how Figma selections are processed in `src/api/services/selection/get-current-page-selection.ts`
- See how selection data is sent to the UI in `send-selection-data-to-ui.ts`

### C. Hands-on Exercise:
Add a new message type for a custom action:
```typescript
// In src/types/messages.ts
export enum MessageTypes {
  // existing types...
  CustomAction = 'Polychrom_CustomAction',
}

// Then use it in a component
parent.postMessage({
  pluginMessage: {
    type: MessageTypes.CustomAction,
    payload: { someData: true }
  }
}, '*');

// Handle in src/api/index.ts
if (message.type === MessageTypes.CustomAction) {
  console.log('Custom action received:', message.payload);
}
```

## 5. Color Manipulation & Adjustments (Week 5)

### A. Color Slider Implementation
- Deep dive into `src/ui/components/ColorAdjustmentSliders.tsx`
- Understand how color adjustments are calculated and applied

### B. Node Color Updates
- Study `src/api/services/figma/update-node-color.ts`
- See how the updated colors are applied to Figma elements

### C. Hands-on Exercise:
Add a simple utility function for color manipulation:
```typescript
// Create a new utility in src/utils/colors/modifiers.ts
export function darkenColor(hex: string, amount: number): string {
  // Implementation goes here, based on existing patterns
  // Use the hexToRgb and other utilities already in the codebase
  return modifiedHexColor;
}
```

## 6. Error Handling & Defensive Programming (Week 6)

### A. Defensive Coding Patterns
- Study the defensive checks in `ColorAdjustmentSliders.tsx`:
```typescript
// Example of defensive check from the codebase
if (bg?.hex == null || fg?.oklch == null) {
  console.error('Background or foreground color is undefined', { bg, fg });
  return;
}
```

### B. Error Recovery Strategies
- Notice how errors are caught and fallbacks are provided:
```typescript
try {
  // Complex operation
} catch (error) {
  console.error('Operation failed:', error);
  // Fallback behavior
}
```

### C. Hands-on Exercise:
Improve error handling in an existing function by adding more specific error messages and recovery options.

## 7. Testing & Debugging (Week 7)

### A. Testing Patterns
- Look at test files like `src/utils/colors/formatters.spec.ts`
- Study how functionality is tested in isolation

### B. Debugging Approaches
- Use console logging strategically as seen throughout the codebase
- Learn how to debug Figma plugins using the developer console

### C. Hands-on Exercise:
Write a simple test for a utility function:
```typescript
// Example test pattern from the project
describe('color utility', () => {
  it('should correctly convert hex to rgb', () => {
    const result = hexToRgb('#FF0000');
    expect(result).toEqual({ r: 1, g: 0, b: 0 });
  });
});
```

## 8. Final Project: Extend the Plugin (Week 8)

### Create a new feature that adds a color palette generator
- Use existing color manipulation utilities
- Create a new UI component
- Add message handling for the new feature
- Apply the defensive programming techniques you've learned

## Reference Materials & Code Examples

### Project Structure
- Plugin backend: `src/api/index.ts`
- UI entry point: `src/ui/index.tsx`
- Type definitions: `src/types/`

### Color Utilities
- Color formatters: `src/utils/colors/formatters.ts`
- APCA calculations: `src/utils/apca/calculate-apca-score.ts`

### React Components
- Main app structure: `src/ui/components/App.tsx`
- Color adjustment UI: `src/ui/components/ColorAdjustmentSliders.tsx` 
- Selection handling: `src/ui/components/Selection.tsx`

### Communication Patterns
- Message types: `src/types/messages.ts`
- Sending data to UI: `src/api/services/messages/send-selection-data-to-ui.ts`
- Updating Figma nodes: `src/api/services/figma/update-node-color.ts`

### Best Practices Demonstrated
- Defensive programming: See null checks throughout `ColorAdjustmentSliders.tsx`
- Error handling: Try/catch blocks in complex operations
- TypeScript usage: Strong typing for all interfaces and functions

This plan will give you a structured approach to learning the codebase, technologies, and best practices used in the Polychrom plugin, along with practical exercises to reinforce what you've learned.
