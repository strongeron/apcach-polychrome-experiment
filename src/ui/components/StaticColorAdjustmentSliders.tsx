import { MessageTypes } from '~types/messages';
import { type ContrastConclusion } from '~ui/types';
import { apcach, type ApcachColor, apcachToCss, crTo } from 'apcach';
import React, { useEffect, useRef, useState } from 'react';

import { ThemeVariablesKeys } from './ThemeVariablesProvider';

interface StaticColorAdjustmentSlidersProps {
  apca: number;
  bg: ContrastConclusion['bg'];
  fg: ContrastConclusion['fg'];
  nodeId?: string; // Make nodeId optional since it might not be available in all contexts
}

export const StaticColorAdjustmentSliders: React.FC<StaticColorAdjustmentSlidersProps> = ({
  apca,
  bg,
  fg,
  nodeId,
}) => {
  // Track if component is mounted to prevent operations before ready
  const isMounted = useRef(false);
  
  // Simple state for slider values
  const initialApca = typeof apca === 'number' && !Number.isNaN(apca) ? Math.abs(apca) : 60;
  const initialHue = typeof fg?.oklch?.h === 'number' && !Number.isNaN(fg?.oklch?.h) ? fg.oklch.h : 0;
  const initialChroma = typeof fg?.oklch?.c === 'number' && !Number.isNaN(fg?.oklch?.c) ? fg.oklch.c : 0.1;
  
  const [targetApca, setTargetApca] = useState<number>(initialApca);
  const [fgHue, setFgHue] = useState<number>(initialHue);
  const [fgChroma, setFgChroma] = useState<number>(initialChroma);
  const [apcachResult, setApcachResult] = useState<ApcachColor | null>(null);
  
  // Set mounted flag on component mount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // For debugging - log when nodeId changes
  useEffect(() => {
    if (nodeId !== undefined && nodeId !== '') {
      console.log('StaticColorAdjustmentSliders received nodeId:', nodeId);
    }
  }, [nodeId]);
  
  // Simple getters for display
  const getFgHex = (): string => fg?.hex ?? '#000000';
  const getBgHex = (): string => bg?.hex ?? '#FFFFFF';
  
  // Get OKLCH values with safe defaults
  const getFgLightness = (): number => fg?.oklch?.l ?? 0.5;
  const getFgChroma = (): number => fg?.oklch?.c ?? 0.1;
  const getFgHue = (): number => fg?.oklch?.h ?? 0;
  
  const getBgLightness = (): number => bg?.oklch?.l ?? 1.0;
  const getBgChroma = (): number => bg?.oklch?.c ?? 0;
  const getBgHue = (): number => bg?.oklch?.h ?? 0;
  
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
  
  // Helper function to check if we can proceed with updating Figma
  const canUpdateFigma = (result: ApcachColor | null): boolean => {
    // We can only update if:
    // 1. Component is mounted
    // 2. We have a valid nodeId (not null, undefined or empty string)
    // 3. We have a valid result
    if (!isMounted.current) {
      console.log('Cannot update Figma: component not mounted');
      return false;
    }
    
    if (nodeId === undefined || nodeId === '') {
      console.log('Cannot update Figma: missing nodeId');
      return false;
    }
    
    if (result === null) {
      console.log('Cannot update Figma: missing color result');
      return false;
    }
    
    return true;
  };

  // Helper function to check if we have a valid background hex color
  const hasValidBgHex = (): boolean => {
    return typeof bg?.hex === 'string' && bg.hex !== '';
  };

  // Calculate APCACH values based on current OKLCH values
  useEffect(() => {
    try {
      if (hasValidBgHex() && typeof apca === 'number' && !Number.isNaN(apca)) {
        // Calculate APCACH values using the apcach function
        const alpha = fg?.oklch?.alpha ?? 1;
        const contrast = crTo(getBgHex(), targetApca);
        const result = apcach(contrast, fgChroma, fgHue, alpha);
        setApcachResult(result);
        
        // Update Figma if conditions are met
        if (canUpdateFigma(result)) {
          updateFigmaNode(result);
        }
      }
    } catch (error) {
      console.error('Error calculating APCACH:', error);
      setApcachResult(null);
    }
  }, [bg?.hex, apca, targetApca, fgChroma, fgHue, fg?.oklch?.alpha, nodeId]);
  
  // Function to update the Figma node with new color
  const updateFigmaNode = (apcachColor: ApcachColor): void => {
    // Skip if component not mounted or no nodeId
    if (!isMounted.current) {
      console.log('Not updating Figma: component not mounted');
      return;
    }
    
    if (nodeId === undefined || nodeId === '') {
      console.log('Not updating Figma: missing nodeId');
      return;
    }
    
    try {
      // Convert APCACH to required formats
      const newHex = apcachToCss(apcachColor, 'hex');
      const newOklch = apcachToCulori(apcachColor);
      
      // Enhanced debugging - log all relevant data
      console.log('DEBUG: Preparing to update node color. Details:', { 
        hexColor: newHex,
        isPreview: true,
        messageType: MessageTypes.UpdateNodeColor,
        nodeId,
        oklchColor: newOklch
      });
      
      // Create the message payload for better debugging
      const messagePayload = {
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
      };
      
      console.log('DEBUG: Sending message to Figma with payload:', JSON.stringify(messagePayload));
      
      // Send update to Figma
      parent.postMessage(messagePayload, '*');
      
      console.log('DEBUG: Message sent to Figma');
    } catch (error) {
      console.error('Failed to update Figma node color:', error);
    }
  };
  
  // Format OKLCH as string
  const formatOklch = (l: number, c: number, h: number): string => {
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${Math.round(h)}°)`;
  };
  
  // Format APCACH as string
  const formatApcach = (color: ApcachColor | null): string => {
    if (color === null) return 'Not available';
    
    return `L: ${color.lightness.toFixed(3)}, C: ${color.chroma.toFixed(3)}, H: ${Math.round(color.hue)}°, A: ${color.alpha.toFixed(2)}`;
  };
  
  // Format APCACH as function call syntax
  const formatApcachCall = (): string => {
    if (apcachResult === null) return '';
    
    // Extract necessary values
    const { alpha, chroma, contrastConfig, hue } = apcachResult;
    const alphaString = alpha !== 1 ? `, ${alpha}` : '';
    
    // Format as function call
    return `apcach(crTo("${contrastConfig.bgColor}", ${Math.abs(contrastConfig.cr)}), ${chroma.toFixed(3)}, ${Math.round(hue)}${alphaString})`;
  };
  
  // Get hex representation of APCACH result
  const getApcachHex = (): string => {
    if (apcachResult === null) return '';
    
    try {
      return apcachToCss(apcachResult, 'hex');
    } catch (error) {
      console.error('Error converting APCACH to hex:', error);
      return '';
    }
  };
  
  // Simple event handlers for sliders with Figma updates
  const handleApcaChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newApca = parseFloat(e.target.value);
    setTargetApca(newApca);
    
    // Recalculate APCACH and update Figma
    try {
      if (hasValidBgHex()) {
        const alpha = fg?.oklch?.alpha ?? 1;
        const contrast = crTo(getBgHex(), newApca);
        const result = apcach(contrast, fgChroma, fgHue, alpha);
        setApcachResult(result);
        
        // Update Figma if conditions are met
        if (canUpdateFigma(result)) {
          updateFigmaNode(result);
        }
      }
    } catch (error) {
      console.error('Error updating APCA value:', error);
    }
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newHue = parseFloat(e.target.value);
    setFgHue(newHue);
    
    // Recalculate APCACH and update Figma
    try {
      if (hasValidBgHex()) {
        const alpha = fg?.oklch?.alpha ?? 1;
        const contrast = crTo(getBgHex(), targetApca);
        const result = apcach(contrast, fgChroma, newHue, alpha);
        setApcachResult(result);
        
        // Update Figma if conditions are met
        if (canUpdateFigma(result)) {
          updateFigmaNode(result);
        }
      }
    } catch (error) {
      console.error('Error updating Hue value:', error);
    }
  };

  const handleChromaChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newChroma = parseFloat(e.target.value);
    setFgChroma(newChroma);
    
    // Recalculate APCACH and update Figma
    try {
      if (hasValidBgHex()) {
        const alpha = fg?.oklch?.alpha ?? 1;
        const contrast = crTo(getBgHex(), targetApca);
        const result = apcach(contrast, newChroma, fgHue, alpha);
        setApcachResult(result);
        
        // Update Figma if conditions are met
        if (canUpdateFigma(result)) {
          updateFigmaNode(result);
        }
      }
    } catch (error) {
      console.error('Error updating Chroma value:', error);
    }
  };

  // Add an "Apply to Figma" button handler for non-preview updates
  const handleApplyToFigma = (): void => {
    // Skip if we can't update
    if (!isMounted.current) {
      console.log('Not applying to Figma: component not mounted');
      return;
    }
    
    if (nodeId === undefined || nodeId === '') {
      console.log('Not applying to Figma: missing nodeId');
      return;
    }
    
    if (apcachResult === null) {
      console.log('Not applying to Figma: missing color result');
      return;
    }
    
    try {
      // Convert APCACH to required formats - apcachResult is guaranteed not null here
      const newHex = apcachToCss(apcachResult, 'hex');
      const newOklch = apcachToCulori(apcachResult);
      
      console.log(`Sending final color update to Figma for node ${nodeId}:`, { 
        hex: newHex,
        isPreview: false,
        oklch: newOklch
      });
      
      // Send update to Figma (non-preview)
      parent.postMessage(
        {
          pluginMessage: {
            payload: {
              color: {
                hex: newHex,
                oklch: newOklch,
              },
              isPreview: false,
              nodeId,
            },
            type: MessageTypes.UpdateNodeColor,
          },
        },
        '*'
      );
    } catch (error) {
      console.error('Failed to apply Figma node color:', error);
    }
  };

  const displayApca = typeof apca === 'number' && !Number.isNaN(apca) ? Math.round(apca) : 0;

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
        Color Values
      </h3>
      
      {/* Display color swatches and values */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <div className="mb-2">
            <span
              className="text-xs font-medium"
              style={{ color: `var(${ThemeVariablesKeys.fg})` }}
            >
              Foreground
            </span>
          </div>
          <div className="mb-1 flex items-center">
            <div 
              className="mr-2 h-10 w-10 rounded-md border"
              style={{ backgroundColor: getFgHex() }}
            ></div>
            <div className="flex flex-col">
              <span 
                className="text-xxs"
                style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
              >
                HEX: {getFgHex()}
              </span>
              <span 
                className="text-xxs"
                style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
              >
                OKLCH: {formatOklch(getFgLightness(), getFgChroma(), getFgHue())}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-2">
            <span
              className="text-xs font-medium"
              style={{ color: `var(${ThemeVariablesKeys.fg})` }}
            >
              Background
            </span>
          </div>
          <div className="mb-1 flex items-center">
            <div 
              className="mr-2 h-10 w-10 rounded-md border"
              style={{ backgroundColor: getBgHex() }}
            ></div>
            <div className="flex flex-col">
              <span 
                className="text-xxs"
                style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
              >
                HEX: {getBgHex()}
              </span>
              <span 
                className="text-xxs"
                style={{ color: `var(${ThemeVariablesKeys.secondary})` }}
              >
                OKLCH: {formatOklch(getBgLightness(), getBgChroma(), getBgHue())}
              </span>
            </div>
          </div>
        </div>
        
        <div className="col-span-2 my-2">
          <div 
            className="rounded py-1 text-center text-xs font-medium"
            style={{color: `var(${ThemeVariablesKeys.fg})` }}
          >
            APCA: {displayApca}
          </div>
          
          {/* Display APCACH calculation results */}
          <div className="mt-2">
            <div className="mb-1 text-xxs font-medium" style={{ color: `var(${ThemeVariablesKeys.fg})` }}>
              APCACH Result:
            </div>
            <div className="flex items-center">
              {apcachResult !== null && getApcachHex() !== '' && (
                <div 
                  className="mr-2 h-6 w-6 rounded border"
                  style={{ backgroundColor: getApcachHex() }}
                ></div>
              )}
              <div className="flex-1">
                <div className="text-xxs" style={{ color: `var(${ThemeVariablesKeys.secondary})` }}>
                  {formatApcach(apcachResult)}
                </div>
                {getApcachHex() !== '' && (
                  <div className="text-xxs" style={{ color: `var(${ThemeVariablesKeys.secondary})` }}>
                    HEX: {getApcachHex()}
                  </div>
                )}
                {apcachResult !== null && (
                  <div className="mt-1 font-mono text-xxs" style={{ color: `var(${ThemeVariablesKeys.secondary})` }}>
                    {formatApcachCall()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="text-xxs font-medium mr-2"
            htmlFor="static-apca-slider"
            id="static-apca-slider-label"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            APCA
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            onChange={e => {
              let v = Number(e.target.value);
              if (isNaN(v)) v = 0;
              if (v < 0) v = 0;
              if (v > 108) v = 108;
              setTargetApca(v);
              
              // Trigger APCA change handler
              const event = { 
                target: { 
                  value: v.toString() 
                } 
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleApcaChange(event);
            }}
            className="w-14 rounded border px-1 text-xxs text-right"
            max={108}
            min={0}
            step={0.1}
            style={{ backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`, color: `var(${ThemeVariablesKeys.fg})` }}
            type="number"
            value={targetApca}
          />
          <input
            style={{
              backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
            }}
            aria-labelledby="static-apca-slider-label"
            className="h-1 w-full cursor-pointer appearance-none rounded-full"
            id="static-apca-slider"
            max={108}
            min={0}
            onChange={handleApcaChange}
            step={0.1}
            type="range"
            value={targetApca}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="text-xxs font-medium mr-2"
            htmlFor="static-chroma-slider"
            id="static-chroma-slider-label"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            Chroma
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            onChange={e => {
              let v = Number(e.target.value);
              if (isNaN(v)) v = 0;
              if (v < 0) v = 0;
              if (v > 0.37) v = 0.37;
              setFgChroma(v);
              
              // Trigger Chroma change handler
              const event = { 
                target: { 
                  value: v.toString() 
                } 
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleChromaChange(event);
            }}
            className="w-14 rounded border px-1 text-xxs text-right"
            max={0.37}
            min={0}
            step={0.001}
            style={{ backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`, color: `var(${ThemeVariablesKeys.fg})` }}
            type="number"
            value={fgChroma}
          />
          <input
            style={{
              backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
            }}
            aria-labelledby="static-chroma-slider-label"
            className="h-1 w-full cursor-pointer appearance-none rounded-full"
            id="static-chroma-slider"
            max={0.37}
            min={0}
            onChange={handleChromaChange}
            step={0.001}
            type="range"
            value={fgChroma}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="text-xxs font-medium mr-2"
            htmlFor="static-hue-slider"
            id="static-hue-slider-label"
            style={{ color: `var(${ThemeVariablesKeys.fg})` }}
          >
            Hue
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            onChange={e => {
              let v = Number(e.target.value);
              if (isNaN(v)) v = 0;
              if (v < 0) v = 0;
              if (v > 360) v = 360;
              setFgHue(v);
              
              // Trigger Hue change handler
              const event = { 
                target: { 
                  value: v.toString() 
                } 
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleHueChange(event);
            }}
            className="w-14 rounded border px-1 text-xxs text-right"
            max={360}
            min={0}
            step={1}
            style={{ backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`, color: `var(${ThemeVariablesKeys.fg})` }}
            type="number"
            value={fgHue}
          />
          <input
            style={{
              backgroundColor: `var(${ThemeVariablesKeys.bgBorder})`,
            }}
            aria-labelledby="static-hue-slider-label"
            className="h-1 w-full cursor-pointer appearance-none rounded-full"
            id="static-hue-slider"
            max={360}
            min={0}
            onChange={handleHueChange}
            step={1}
            type="range"
            value={fgHue}
          />
        </div>
      </div>
      
      {/* Add "Apply to Figma" button for permanent updates */}
      {nodeId !== undefined && nodeId !== '' && (
        <div className="mt-4 flex justify-end">
          <button
            style={{ 
              backgroundColor: `var(${ThemeVariablesKeys.fg})`,
              color: `var(${ThemeVariablesKeys.bg})`,
            }}
            className="rounded px-3 py-1 text-xxs font-medium"
            onClick={handleApplyToFigma}
          >
            Apply to Figma
          </button>
        </div>
      )}
    </div>
  );
}; 