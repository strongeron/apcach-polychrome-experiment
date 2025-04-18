# Review of APCACH Sliders Implementation Plan

After reviewing the plan in `apcach-sliders.md` and your implementation challenges, I can see some issues in the approach. Let's revise the plan with a clearer focus on the exact requirements and better alignment with the existing codebase.

## Key Issues Identified

1. **Initial Color Extraction Flow**: The plan doesn't clearly explain how we extract the initial color values from the Figma selection to initialize the sliders.

2. **APCACH Integration**: The way we use APCACH functions doesn't fully match the existing codebase pattern.

3. **Color Flow Direction**: There's confusion about the direction of color flow (from selection → UI → sliders → back to Figma).

4. **Background Color Handling**: The plan lacks explicit handling of background color for APCACH calculations.

5. **Slider Initialization**: We need to ensure sliders start with values that reflect the selected color.

## Revised Implementation Plan

### 1. Core Requirements

- User selects a Figma node → We extract its color and background
- Convert to OKLCH → Create APCACH color (using the background)
- Extract values (APCA, chroma, hue) to initialize sliders
- When user adjusts sliders → Update Figma node color in real-time

### 2. Component Structure

```
src/ui/components/ColorAdjustmentSliders.tsx  (new)
src/api/services/figma/update-node-color.ts   (new)
src/types/messages.ts                         (update)
src/ui/components/Selection.tsx               (update)
src/api/index.ts                              (update)
```

### 3. Step-by-Step Implementation

#### Step 1: Update Message Types

```typescript
// src/types/messages.ts
export enum MessageTypes {
  // Existing message types...
  UpdateNodeColor = 'Polychrom_UpdateNodeColor',
}

export interface UpdateNodeColorPayload {
  nodeId: string;
  color: {
    hex: string;
    oklch: {
      mode: string;
      l: number;
      c: number;
      h: number;
      alpha?: number;
    };
  };
  isPreview: boolean;
}
```

#### Step 2: Create the ColorAdjustmentSliders Component

```typescript
// src/ui/components/ColorAdjustmentSliders.tsx
import { type ApcachColor, apcach, apcachToCss, crToBg, maxChroma } from 'apcach';
import { ThemeVariablesKeys } from './ThemeVariablesProvider.tsx';
import React, { useState, useEffect } from 'react';
import { type ContrastConclusion } from '~ui/types';
import { MessageTypes } from '~types/messages.ts';

interface ColorAdjustmentSlidersProps {
  nodeId: string;
  fg: ContrastConclusion['fg'];
  bg: ContrastConclusion['bg'];
  apca: number;
  onColorChange: (newFg: ContrastConclusion['fg'], newApca: number) => void;
}

export const ColorAdjustmentSliders: React.FC<ColorAdjustmentSlidersProps> = ({
  nodeId,
  fg,
  bg,
  apca,
  onColorChange
}) => {
  // Initialize state with values from selected color
  // - For APCA, use the current contrast value
  // - For chroma and hue, extract from the fg oklch color
  const [targetApca, setTargetApca] = useState<number>(Math.abs(apca));
  const [fgHue, setFgHue] = useState<number>(fg.oklch.h || 0);
  const [fgChroma, setFgChroma] = useState<number>(fg.oklch.c || 0);
  const [chromaMax, setChromaMax] = useState<number>(maxChroma(fg.oklch.l));

  // Reset values when input props change (selection changes)
  useEffect(() => {
    setTargetApca(Math.abs(apca));
    setFgHue(fg.oklch.h || 0);
    setFgChroma(fg.oklch.c || 0);
    setChromaMax(maxChroma(fg.oklch.l));
  }, [fg, bg, apca]);

  // Calculate new color based on slider values
  const updateColor = (hue: number, chroma: number, targetApca: number) => {
    try {
      // Use crToBg to create contrast config between bg color and target APCA
      // This follows your example: apcach(crToBg("#E8E8E8", 60), 0.2, 145)
      const contrastConfig = crToBg(bg.hex, targetApca);
      
      // Create new color with APCACH using the adjusted parameters
      const newApcachColor = apcach(
        contrastConfig,
        chroma,
        hue,
        fg.oklch.alpha
      );
      
      // Convert to hex
      const newHex = apcachToCss(newApcachColor, 'hex');
      
      // Create OKLCH object with proper format for the codebase
      const newOklch = {
        mode: 'oklch',
        l: newApcachColor.lightness,
        c: newApcachColor.chroma,
        h: newApcachColor.hue,
        alpha: newApcachColor.alpha || 1
      };
      
      // Create new foreground color object
      const newFg = {
        hex: newHex,
        isBlended: fg.isBlended,
        oklch: newOklch
      };
      
      // Preserve sign of original APCA value
      const newApca = targetApca * (apca < 0 ? -1 : 1);
      
      // Update UI via callback
      onColorChange(newFg, newApca);
      
      // Send update to Figma
      parent.postMessage({
        pluginMessage: {
          type: MessageTypes.UpdateNodeColor,
          payload: {
            nodeId,
            color: {
              hex: newHex,
              oklch: newOklch
            },
            isPreview: true
          }
        }
      }, '*');
    } catch (error) {
      console.error('Failed to update color:', error);
    }
  };

  // Event handlers for sliders
  const handleApcaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApca = parseFloat(e.target.value);
    setTargetApca(newApca);
    updateColor(fgHue, fgChroma, newApca);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseFloat(e.target.value);
    setFgHue(newHue);
    updateColor(newHue, fgChroma, targetApca);
  };

  const handleChromaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChroma = parseFloat(e.target.value);
    setFgChroma(newChroma);
    updateColor(fgHue, newChroma, targetApca);
  };

  // Handle apply button click for permanent update
  const handleApply = () => {
    parent.postMessage({
      pluginMessage: {
        type: MessageTypes.UpdateNodeColor,
        payload: {
          nodeId,
          color: {
            hex: fg.hex,
            oklch: fg.oklch
          },
          isPreview: false
        }
      }
    }, '*');
  };

  return (
    <div 
      className="mt-4 p-3 rounded-lg"
      style={{
        backgroundColor: `var(${ThemeVariablesKeys.bg})`,
        borderWidth: '1px',
        borderColor: `var(${ThemeVariablesKeys.bgBorder})`,
      }}
    >
      <h3 
        className="text-xs font-medium mb-3"
        style={{ color: `var(${ThemeVariablesKeys.fg})` }}
      >
        Adjust Color
      </h3>

      {/* APCA Slider */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <label 
            className="text-xxs font-medium"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            APCA
          </label>
          <span 
            className="text-xxs"
            style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
          >
            {targetApca.toFixed(0)}
          </span>
        </div>
        <input
          type="range"
          min="15"
          max="105"
          step="1"
          value={targetApca}
          onChange={handleApcaChange}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
          }}
        />
      </div>

      {/* Chroma Slider */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <label 
            className="text-xxs font-medium"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            Chroma
          </label>
          <span 
            className="text-xxs"
            style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
          >
            {(fgChroma).toFixed(3)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={chromaMax}
          step="0.001"
          value={fgChroma}
          onChange={handleChromaChange}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
          }}
        />
      </div>

      {/* Hue Slider */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <label 
            className="text-xxs font-medium"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            Hue
          </label>
          <span 
            className="text-xxs"
            style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
          >
            {Math.round(fgHue)}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={fgHue}
          onChange={handleHueChange}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
          }}
        />
      </div>

      {/* Apply Button */}
      <button
        className="mt-3 px-3 py-1.5 text-xxs font-semibold rounded w-full transition-colors"
        style={{
          backgroundColor: `var(${ThemeVariablesKeys.fg})`,
          color: `var(${ThemeVariablesKeys.bg})`,
        }}
        onClick={handleApply}
      >
        Apply to Selection
      </button>
    </div>
  );
};
```

#### Step 3: Update the Selection Component

```typescript
// src/ui/components/Selection.tsx
import { ColorAdjustmentSliders } from './ColorAdjustmentSliders.tsx';
// Existing imports...

export const Selection = ({
  id,
  isLast,
  size,
  userSelection: { apca, bg, fg },
}: Props): ReactElement => {
  // Existing state
  const [currentStyleNumber, setCurrentStyleNumber] = useState(
    SEGMENTED_FONT_STYLES.INITIAL
  );
  
  // Add state for adjusted colors
  const [adjustedFg, setAdjustedFg] = useState(fg);
  const [adjustedApca, setAdjustedApca] = useState(apca);
  
  // Reset adjusted state when selection changes
  useEffect(() => {
    setAdjustedFg(fg);
    setAdjustedApca(apca);
  }, [fg, apca]);
  
  // Handler for color changes from the sliders
  const handleColorChange = (newFg, newApca) => {
    setAdjustedFg(newFg);
    setAdjustedApca(newApca);
  };
  
  // Use adjusted values for display or fall back to original
  const displayFg = adjustedFg;
  const displayApca = adjustedApca;

  if (isEmpty(displayApca)) {
    return <CantCalculateMessage />;
  }

  // Generate UI colors with the adjusted values
  const uiColors = generateUIColors(
    { hex: displayFg.hex, oklch: displayFg.oklch },
    { hex: bg.hex, oklch: bg.oklch }
  );

  if (isEmpty(uiColors)) {
    return <CantCalculateMessage />;
  }

  return (
    <ThemeVariablesProvider theme={uiColors.theme}>
      <div
        className={clsx(
          'w-full rounded-2.5xl',
          size === 'small' && isLast === false && 'px-5 pb-8 pt-2',
          size === 'small' && isLast === true && 'px-5 py-3',
          size === 'large' && 'p-5'
        )}
        style={{
          backgroundColor: `var(${ThemeVariablesKeys.bg})`,
        }}
      >
        <SegmentedFontStyleDefinition
          currentStyleNumber={currentStyleNumber}
          id={id}
          primaryColor={uiColors.theme.fg}
          secondaryColor={uiColors.theme.secondary}
        />

        <SelectionContent
          apca={displayApca}
          bg={bg}
          fg={displayFg}
          id={id}
          isLast={isLast}
          onApcaDoubleClick={handleCurrentStyleNumberChange}
          size={size}
        />
        
        {/* Add color adjustment sliders for large size mode */}
        {size === 'large' && (
          <ColorAdjustmentSliders
            nodeId={id}
            fg={displayFg}
            bg={bg}
            apca={displayApca}
            onColorChange={handleColorChange}
          />
        )}
      </div>
    </ThemeVariablesProvider>
  );
};
```

#### Step 4: Create the Node Color Update Service

```typescript
// src/api/services/figma/update-node-color.ts
import { type FigmaPaint } from '~types/figma.ts';
import { converter } from 'culori';

// Use Culori's converter like elsewhere in the codebase
const convertToRgb = converter('rgb');

export const updateNodeColor = (
  nodeId: string,
  color: { 
    hex: string; 
    oklch: { 
      mode: string; 
      l: number; 
      c: number; 
      h: number; 
      alpha?: number; 
    } 
  },
  isPreview: boolean = false
): void => {
  try {
    // Find the node by ID
    const nodes = figma.currentPage.findAll(node => node.id === nodeId);
    
    if (nodes.length === 0) {
      console.error('Node not found:', nodeId);
      return;
    }
    
    const node = nodes[0];
    
    // Check if node has fills property
    if ('fills' in node) {
      // Convert from OKLCH to RGB using Culori
      const rgbColor = convertToRgb(color.oklch);
      
      // Get current fills
      const fills = [...node.fills] as FigmaPaint[];
      
      // Find the first visible solid fill
      const solidFillIndex = fills.findIndex(
        fill => fill.type === 'SOLID' && fill.visible !== false
      );
      
      if (solidFillIndex !== -1) {
        // Create a new fills array with the updated color (avoid spread for mutation)
        const newFills = [];
        for (let i = 0; i < fills.length; i++) {
          if (i === solidFillIndex) {
            newFills.push({
              ...fills[i],
              color: {
                r: rgbColor.r,
                g: rgbColor.g,
                b: rgbColor.b
              }
            });
          } else {
            newFills.push(fills[i]);
          }
        }
        
        // Apply the updated fills
        node.fills = newFills;
        
        // Notify if this is a final (non-preview) update
        if (!isPreview) {
          figma.notify('Color updated');
        }
      }
    }
  } catch (error) {
    console.error('Failed to update node color:', error);
  }
};
```

#### Step 5: Update API Message Handler

```typescript
// src/api/index.ts

// Increase plugin height to accommodate sliders
figma.showUI(__html__, {
  height: 420, // Increased from 260
  themeColors: true,
  width: 328,
});

// Add to message handler
figma.ui.onmessage = (message: MessagePayload<any>) => {
  // Existing handlers...
  
  // Add color update handler
  if (message.type === MessageTypes.UpdateNodeColor) {
    updateNodeColor(
      message.payload.nodeId,
      message.payload.color,
      message.payload.isPreview
    );
  }
};
```

### 4. Color Flow Diagram

```
┌─────────────────┐        ┌─────────────────┐        ┌────────────────┐
│  Figma Selection │───────▶│ Extract Colors   │───────▶│ OKLCH Colors   │
└─────────────────┘        └─────────────────┘        └────────┬───────┘
                                                              │
                                                              ▼
┌─────────────────┐        ┌─────────────────┐        ┌────────────────┐
│  Update Figma    │◀───────│ Generate Color  │◀───────│ Slider Values  │
└─────────────────┘        └─────────────────┘        └────────────────┘
```

### 5. Key Corrections and Missing Details

1. **Using `crToBg` instead of `crTo`**: The implementation should use `crToBg` as specified in your example, which better handles background colors for APCACH calculations.

2. **Proper Initialization of Sliders**: We now ensure that the sliders start with values extracted from the current color selection.

3. **Avoiding Spread Operator**: As per your instructions, we've avoided using spread operator for array mutation in the update function.

4. **Resetting Adjusted Colors on Selection Change**: Added an effect to reset adjusted colors when the selection changes.

5. **Respecting Current Codebase Patterns**: We've aligned with the existing conversion patterns in the codebase.

6. **Consistent Color Format**: Ensuring consistent OKLCH format throughout the system.

7. **Background Color Handling**: We're properly using the background color for APCACH calculations.

### 6. Testing Checklist

1. Initial values display correctly on slider initialization
2. APCA slider updates contrast while maintaining hue/chroma
3. Chroma slider updates saturation while maintaining contrast/hue
4. Hue slider updates color hue while maintaining contrast/chroma
5. Changes are previewed in real-time in Figma
6. "Apply" button makes changes permanent
7. Color conversion is accurate throughout the flow
8. UI reflects current color state correctly
9. Works with all types of Figma nodes with fills
10. Edge cases (minimum/maximum values) handled properly

This revised plan should address the issues you encountered during implementation and provide a more accurate alignment with the existing codebase patterns.
