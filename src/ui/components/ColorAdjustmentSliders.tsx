// Import in correct order
import { MessageTypes } from '~types/messages';
import { type ContrastConclusion } from '~ui/types';
import {
  apcach,
  type ApcachColor,
  apcachToCss,
  crTo,
  maxChroma
} from 'apcach';
import React, { useEffect, useRef, useState } from 'react';

import { ThemeVariablesKeys } from './ThemeVariablesProvider';

interface ColorAdjustmentSlidersProps {
  apca: number;
  bg: ContrastConclusion['bg'];
  fg: ContrastConclusion['fg'];
  nodeId: string;
  onColorChange: (newFg: ContrastConclusion['fg'], newApca: number) => void;
}

export const ColorAdjustmentSliders: React.FC<ColorAdjustmentSlidersProps> = ({
  apca,
  bg,
  fg,
  nodeId,
  onColorChange,
}) => {
  // Early return with null if essential props are missing
  if (bg === undefined || fg === undefined) {
    console.warn('Missing essential color data, cannot render color adjustment UI');
    return null;
  }

  // Track if component is mounted to prevent operations before ready
  const isMounted = useRef(false);

  // Track if library functions are available
  const hasLibraryFunctions = useRef(
    typeof apcach === 'function' && 
    typeof apcachToCss === 'function' && 
    typeof maxChroma === 'function' &&
    typeof crTo === 'function'
  );

  // Helper function to convert ApcachColor to Oklch (from generate-ui-colors.ts)
  const apcachToCulori = (apcachColor: ApcachColor): ContrastConclusion['fg']['oklch'] => {
    return {
      alpha: apcachColor.alpha,
      c: apcachColor.chroma,
      h: apcachColor.hue,
      l: apcachColor.lightness,
      mode: 'oklch',
    };
  };

  // Add safety check to handle undefined values gracefully
  const safeMaxChroma = (l: number): number => {
    try {
      return typeof maxChroma === 'function' ? maxChroma(l) : 0.4;
    } catch (error) {
      console.warn('Error calculating maxChroma, using fallback value:', error);
      return 0.4; // Default fallback value
    }
  };

  // Initialize state with values from selected color, with defensive null checks
  const [targetApca, setTargetApca] = useState<number>(typeof apca === 'number' ? Math.abs(apca) : 0);
  const [fgHue, setFgHue] = useState<number>(fg?.oklch?.h !== undefined ? fg.oklch.h : 0);
  const [fgChroma, setFgChroma] = useState<number>(fg?.oklch?.c !== undefined ? fg.oklch.c : 0);
  const [chromaMax, setChromaMax] = useState<number>(safeMaxChroma(fg?.oklch?.l !== undefined ? fg.oklch.l : 0));

  // Set mounted flag on component mount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset values when input props change
  useEffect(() => {
    // Only run if component is mounted
    if (!isMounted.current) return;
    
    // Only update if we have valid values
    if (typeof apca === 'number') {
      setTargetApca(Math.abs(apca));
    }

    // Only update if we have a valid fg.oklch object
    if (fg?.oklch !== undefined) {
      setFgHue(fg.oklch.h !== undefined ? fg.oklch.h : 0);
      setFgChroma(fg.oklch.c !== undefined ? fg.oklch.c : 0);
      setChromaMax(safeMaxChroma(fg.oklch.l !== undefined ? fg.oklch.l : 0));
    }
  }, [fg, bg, apca]);

  // Calculate new color based on slider values - simplified based on generate-ui-colors.ts pattern
  const updateColor = (hue: number, chroma: number, targetApca: number): void => {
    // Early return if component not mounted or library functions missing
    if (!isMounted.current || !hasLibraryFunctions.current) {
      console.warn('Cannot update color: component not mounted or missing library functions');
      return;
    }
    
    // Validate inputs are proper numeric values
    if (typeof hue !== 'number' || typeof chroma !== 'number' || typeof targetApca !== 'number') {
      console.error('Invalid input types for updateColor', { chroma, hue, targetApca });
      return;
    }
  
    try {
      // Check for required data using optional chaining
      if (
        bg?.hex === undefined || 
        (typeof bg?.hex === 'string' && bg.hex.length === 0) || 
        fg === undefined || 
        fg.oklch === undefined
      ) {
        console.error('Missing required color data', { bg, fg });
        return;
      }

      // Simplified color generation using pattern from transformFgColor in generate-ui-colors.ts
      const alpha = fg.oklch.alpha ?? 1;
      
      // Generate the new contrast-based color
      const apcachColor = apcach(
        crTo(bg.hex, targetApca),
        chroma,
        hue,
        alpha
      );

      // Convert to required formats
      const newHex = apcachToCss(apcachColor, 'hex');
      const newOklch = apcachToCulori(apcachColor);
      
      // Create new foreground color object
      const newFg = {
        hex: newHex,
        isBlended: fg.isBlended,
        oklch: newOklch,
      };

      // Preserve sign of original APCA value
      const newApca = targetApca * (apca < 0 ? -1 : 1);

      // Update UI via callback
      onColorChange(newFg, newApca);

      // Send update to Figma
      parent.postMessage(
        {
          pluginMessage: {
            payload: {
              color: {
                hex: newHex,
                oklch: newOklch,
              },
              isPreview: true,
              nodeId,
            },
            type: MessageTypes.UpdateNodeColor,
          },
        },
        '*'
      );
    } catch (error) {
      console.error('Failed to update color:', error);
      // Simple fallback if calculation fails - only attempt if component is still mounted
      if (isMounted.current && fg !== undefined && typeof fg.hex === 'string' && fg.hex.length > 0 && fg.oklch !== undefined) {
        onColorChange(fg, targetApca * (apca < 0 ? -1 : 1));
      }
    }
  };

  // Event handlers for sliders
  const handleApcaChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newApca = parseFloat(e.target.value);
    setTargetApca(newApca);
    updateColor(fgHue, fgChroma, newApca);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newHue = parseFloat(e.target.value);
    setFgHue(newHue);
    updateColor(newHue, fgChroma, targetApca);
  };

  const handleChromaChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newChroma = parseFloat(e.target.value);
    setFgChroma(newChroma);
    updateColor(fgHue, newChroma, targetApca);
  };

  // Handle apply button click for permanent update
  const handleApply = (): void => {
    // Skip if component not mounted
    if (!isMounted.current) {
      console.warn('Component not mounted, skipping apply');
      return;
    }
    
    // Ensure we have the necessary data before sending the message
    if (
      fg === undefined || 
      fg.hex === undefined || 
      (typeof fg.hex === 'string' && fg.hex.length === 0) || 
      fg.oklch === undefined || 
      nodeId.length === 0
    ) {
      console.error('Missing data required for color update');
      return;
    }

    // Create deep copies to prevent mutation
    const safeColor = {
      hex: fg.hex,
      oklch: {
        ...fg.oklch
      }
    };

    parent.postMessage(
      {
        pluginMessage: {
          payload: {
            color: safeColor,
            isPreview: false,
            nodeId,
          },
          type: MessageTypes.UpdateNodeColor,
        },
      },
      '*'
    );
  };

  return (
    <div
      style={{
        backgroundColor: `var(${ThemeVariablesKeys.bg})`,
        borderColor: `var(${ThemeVariablesKeys.bgBorder})`,
        borderWidth: '1px',
      }}
      className="mt-4 rounded-lg p-3"
    >
      <h3
        className="mb-3 text-xs font-medium"
        style={{ color: `var(${ThemeVariablesKeys.fg})` }}
      >
        Adjust Color
      </h3>

      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <label
            className="text-xxs font-medium"
            htmlFor="apca-slider"
            id="apca-slider-label"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            APCA
          </label>
          <span
            className="text-xxs"
            style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
          >
            {Math.round(targetApca)}
          </span>
        </div>
        <input
          style={{
            backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
          }}
          aria-labelledby="apca-slider-label"
          className="h-1 w-full cursor-pointer appearance-none rounded-full"
          id="apca-slider"
          max="105"
          min="15"
          onChange={handleApcaChange}
          step="1"
          type="range"
          value={targetApca}
        />
      </div>

      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <label
            className="text-xxs font-medium"
            htmlFor="chroma-slider"
            id="chroma-slider-label"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            Chroma
          </label>
          <span
            className="text-xxs"
            style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
          >
            {fgChroma.toFixed(3)}
          </span>
        </div>
        <input
          style={{
            backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
          }}
          aria-labelledby="chroma-slider-label"
          className="h-1 w-full cursor-pointer appearance-none rounded-full"
          id="chroma-slider"
          max={chromaMax}
          min="0"
          onChange={handleChromaChange}
          step="0.001"
          type="range"
          value={fgChroma}
        />
      </div>

      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <label
            className="text-xxs font-medium"
            htmlFor="hue-slider"
            id="hue-slider-label"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            Hue
          </label>
          <span
            className="text-xxs"
            style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
          >
            {Math.round(fgHue)}
          </span>
        </div>
        <input
          style={{
            backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
          }}
          aria-labelledby="hue-slider-label"
          className="h-1 w-full cursor-pointer appearance-none rounded-full"
          id="hue-slider"
          max="360"
          min="0"
          onChange={handleHueChange}
          step="1"
          type="range"
          value={fgHue}
        />
      </div>

      <button
        style={{
          backgroundColor: `var(${ThemeVariablesKeys.fg})`,
          color: `var(${ThemeVariablesKeys.bg})`,
        }}
        className="mt-3 w-full rounded px-3 py-1.5 text-xxs font-semibold transition-colors"
        onClick={handleApply}
      >
        Apply to Selection
      </button>
    </div>
  );
};
