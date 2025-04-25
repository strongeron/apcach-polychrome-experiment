import { MessageTypes } from '~types/messages';
import { type ContrastConclusion } from '~ui/types';
import { apcach, type ApcachColor, apcachToCss, crTo } from 'apcach';
import React, { useEffect, useRef, useState } from 'react';

// Removed ThemeVariablesKeys import since we'll use Figma CSS variables directly

interface StaticColorAdjustmentSlidersProps {
  apca: number;
  bg: ContrastConclusion['bg'];
  fg: ContrastConclusion['fg'];
  nodeId?: string; // Make nodeId optional since it might not be available in all contexts
}

export const StaticColorAdjustmentSliders: React.FC<
  StaticColorAdjustmentSlidersProps
> = ({ apca, bg, fg, nodeId }) => {
  // Track if component is mounted to prevent operations before ready
  const isMounted = useRef(false);
  // Track if this is the initial render to prevent automatic updates
  const isInitialRender = useRef(true);

  // Simple state for slider values
  const initialApca =
    typeof apca === 'number' && !Number.isNaN(apca) ? Math.abs(apca) : 60;
  const initialHue =
    typeof fg?.oklch?.h === 'number' && !Number.isNaN(fg?.oklch?.h)
      ? fg.oklch.h
      : 0;
  const initialChroma =
    typeof fg?.oklch?.c === 'number' && !Number.isNaN(fg?.oklch?.c)
      ? fg.oklch.c
      : 0.1;

  const [targetApca, setTargetApca] = useState<number>(initialApca);
  const [fgHue, setFgHue] = useState<number>(initialHue);
  const [fgChroma, setFgChroma] = useState<number>(initialChroma);
  const [, setApcachResult] = useState<ApcachColor | null>(null);
  const [shouldAddNewFill, setShouldAddNewFill] = useState<boolean>(false);
  const [chromaMax, setChromaMax] = useState<number>(0.37); // Default max value

  // Add safety check to handle undefined values gracefully
  const safeMaxChroma = (lightness: number): number => {
    try {
      // Ensure lightness is in valid range
      console.log('DEBUG: safeMaxChroma called with lightness:', lightness);
      if (typeof lightness !== 'number' || isNaN(lightness)) {
        console.warn('Invalid lightness value for maxChroma:', lightness);
        return 0.37;
      }
      
      // Instead of using the maxChroma function directly, use a simplified formula
      // that approximates maximum chroma values for given lightness
      // Typical bell curve for max chroma in OkLCH, peaking around L=0.5-0.6
      // Maximum values are usually between 0.3-0.4 for mid-range lightness values
      if (lightness < 0.1) {
        return 0.1; // Very dark colors have limited chroma
      } else if (lightness > 0.95) {
        return 0.1; // Very light colors have limited chroma
      } else {
        // Create a bell curve with max around 0.5-0.6 lightness
        // This is an approximation and can be tuned based on exact requirements
        const chromaMax = 0.4 - 0.6 * Math.abs(lightness - 0.55);
        // Ensure reasonable bounds
        return Math.max(0.05, Math.min(0.4, chromaMax));
      }
    } catch (error) {
      console.warn('Error calculating maxChroma, using fallback value:', error);
      return 0.37; // Default fallback value
    }
  };

  // Helper function to validate APCA value
  const validateApca = (value: number): number => {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn('Invalid APCA value detected:', value, 'using default 60');
      return 60;
    }
    // Ensure APCA is positive and within valid range (0-108)
    return Math.max(0, Math.min(Math.abs(value), 108));
  };

  // Helper function to validate background color
  const validateBgHex = (hex: string): string => {
    // Check if it's a valid hex color
    if (!hex || typeof hex !== 'string') {
      console.warn('Invalid background color:', hex, 'using white');
      return '#FFFFFF';
    }
    
    // Ensure it starts with # and has correct length
    if (!hex.startsWith('#') || ![4, 7, 9].includes(hex.length)) {
      console.warn('Malformed hex color:', hex, 'using white');
      return '#FFFFFF';
    }
    
    return hex;
  };

  // Calculate the maximum chroma for a given APCA and hue
  const calculateMaxChroma = (apca: number, hue: number): number => {
    try {
      console.log(`DEBUG: calculateMaxChroma called with apca=${apca}, hue=${hue}`);
      
      if (!hasValidBgHex()) {
        console.log('DEBUG: No valid background hex, returning default max chroma');
        return 0.37; // Default if no valid bg
      }
      
      // Validate and prepare inputs
      const validatedApca = validateApca(apca);
      console.log('DEBUG: Validated APCA:', validatedApca);
      
      const rawBgHex = getBgHex();
      const validatedBgHex = validateBgHex(rawBgHex);
      console.log('DEBUG: Raw BG hex:', rawBgHex, 'Validated:', validatedBgHex);
      
      try {
        // Create a temporary color with maximum chroma to get the resulting lightness
        const alpha = fg?.oklch?.alpha ?? 1;
        console.log('DEBUG: Using alpha:', alpha);
        
        // Log detailed parameters for crTo function
        console.log('DEBUG: crTo parameters:', {
          bgHex: validatedBgHex,
          apca: validatedApca,
          contrastModel: 'apca',
          searchDirection: 'auto'
        });
        
        // Create contrast configuration
        const contrast = crTo(validatedBgHex, validatedApca, 'apca', 'auto');
        console.log('DEBUG: Contrast configuration created:', contrast);
        
        // Use a reasonable chroma value initially to see what lightness we get
        console.log('DEBUG: Calling apcach with contrast and chroma=0.2, hue=', hue);
        const tempResult = apcach(contrast, 0.2, hue, alpha);
        console.log('DEBUG: apcach tempResult:', tempResult);
        
        if (tempResult && typeof tempResult.lightness === 'number') {
          // Now calculate the max chroma based on our formula
          console.log('DEBUG: Got valid lightness:', tempResult.lightness);
          const newMaxChroma = safeMaxChroma(tempResult.lightness);
          console.log('DEBUG: Calculated max chroma:', newMaxChroma);
          return newMaxChroma;
        }
        
        console.log('DEBUG: No valid tempResult, returning default');
        return 0.37; // Default fallback
      } catch (contrastError) {
        // Handle specific errors with contrast calculation
        console.error('Error in contrast calculation within calculateMaxChroma:', contrastError);
        if (contrastError instanceof Error) {
          console.log('Error message:', contrastError.message);
          if (contrastError.message.includes('contrast') || 
              contrastError.message.includes('Invalid')) {
            console.log('This appears to be a contrast format error');
          }
        }
        return 0.37; // Default fallback
      }
    } catch (error) {
      // Check for specific contrast format errors
      if (error instanceof Error && 
          (error.message.includes('contrast') || 
           error.message.includes('Invalid'))) {
        console.error('Error with contrast format in calculateMaxChroma:', error);
        console.log('APCA value:', apca, 'Hue:', hue, 'BG hex:', getBgHex());
        console.log('Error stack:', error.stack);
      } else {
        console.error('Error calculating max chroma:', error);
        if (error instanceof Error) {
          console.log('Error stack:', error.stack);
        }
      }
      return 0.37; // Default fallback on error
    }
  };

  // Update chroma to stay within bounds when max changes
  const adjustChromaToValidRange = (newMaxChroma: number): number => {
    if (fgChroma > newMaxChroma) {
      return newMaxChroma;
    }
    return fgChroma;
  };

  // Set mounted flag on component mount
  useEffect(() => {
    isMounted.current = true;
    // Log that we're preventing automatic updates on initial render
    console.log('StaticColorAdjustmentSliders mounted - will prevent automatic updates until user interaction');

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

  // Helper function to get the background hex color with a safe default
  const getBgHex = (): string => {
    const hexValue = bg?.hex ?? '#FFFFFF';
    return validateBgHex(hexValue);
  };

  // Helper function to convert ApcachColor to Oklch (from generate-ui-colors.ts)
  const apcachToCulori = (
    apcachColor: ApcachColor
  ): ContrastConclusion['fg']['oklch'] => {
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
        console.log('DEBUG: useEffect recalculating APCACH values');
        
        // Calculate APCACH values using the apcach function
        const alpha = fg?.oklch?.alpha ?? 1;
        const validatedApca = validateApca(targetApca);
        console.log('DEBUG: useEffect using validated APCA:', validatedApca);
        
        const bgHex = getBgHex();
        console.log('DEBUG: useEffect using BG hex:', bgHex);
        
        console.log('DEBUG: useEffect creating contrast with:', {
          bgHex,
          apca: validatedApca,
          model: 'apca',
          direction: 'auto'
        });
        
        const contrast = crTo(bgHex, validatedApca, 'apca', 'auto');
        console.log('DEBUG: useEffect created contrast:', contrast);
        
        console.log('DEBUG: useEffect calling apcach with:', {
          contrast,
          chroma: fgChroma,
          hue: fgHue,
          alpha
        });
        
        const result = apcach(contrast, fgChroma, fgHue, alpha);
        console.log('DEBUG: useEffect apcach result:', result);
        
        setApcachResult(result);

        // Only update Figma if this is not the initial render
        if (!isInitialRender.current && canUpdateFigma(result)) {
          console.log('Updating Figma with slider values after user interaction');
          updateFigmaNode(result, false); // Update with isPreview=false for final updates
        } else if (isInitialRender.current) {
          console.log('Initial render detected, not sending automatic update to Figma');
          isInitialRender.current = false; // Mark that we've completed the initial render
        }
        
        // Calculate and update maxChroma based on the result lightness
        if (result && typeof result.lightness === 'number') {
          console.log('DEBUG: useEffect updating maxChroma based on result lightness:', result.lightness);
          const newMaxChroma = safeMaxChroma(result.lightness);
          console.log('DEBUG: useEffect setting new maxChroma:', newMaxChroma);
          setChromaMax(newMaxChroma);
        }
      }
    } catch (error) {
      // Check for specific contrast format errors
      if (error instanceof Error && 
          (error.message.includes('contrast') || 
           error.message.includes('Invalid'))) {
        console.error('Error with contrast format in useEffect:', error);
        console.log('APCA value:', apca, 'Target APCA:', targetApca, 'BG hex:', getBgHex());
        console.log('Error stack:', error.stack);
      } else {
        console.error('Error calculating APCACH:', error);
        if (error instanceof Error) {
          console.log('Error stack:', error.stack);
        }
      }
      setApcachResult(null);
    }
  }, [bg?.hex, apca, targetApca, fgChroma, fgHue, fg?.oklch?.alpha, nodeId]);

  // Initialize max chroma when component mounts
  useEffect(() => {
    // Initialize max chroma when component mounts or when essential dependencies change
    if (isMounted.current && hasValidBgHex()) {
      try {
        console.log('Initializing max chroma with initial values');
        const newMaxChroma = calculateMaxChroma(targetApca, fgHue);
        console.log('Initial max chroma calculation result:', newMaxChroma);
        
        // Safety check to ensure we got a valid number
        if (typeof newMaxChroma === 'number' && !isNaN(newMaxChroma)) {
          setChromaMax(newMaxChroma);
          
          // Adjust the chroma value if it's higher than the calculated maximum
          if (fgChroma > newMaxChroma) {
            console.log('Adjusting initial chroma to stay within valid bounds');
            setFgChroma(newMaxChroma);
          }
        } else {
          // Fallback to a safe default if calculation failed
          console.warn('Initial max chroma calculation failed, using default value');
          setChromaMax(0.37);
          
          // Adjust the chroma value if it's higher than our default
          if (fgChroma > 0.37) {
            setFgChroma(0.37);
          }
        }
      } catch (error) {
        console.error('Error during initial max chroma calculation:', error);
        // Set fallback values
        setChromaMax(0.37);
        if (fgChroma > 0.37) {
          setFgChroma(0.37);
        }
      }
    }
  }, [isMounted.current, bg?.hex]);

  // Function to update the Figma node with new color
  const updateFigmaNode = (apcachColor: ApcachColor, isPreview: boolean = true): void => {
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
        addNewFill: shouldAddNewFill, // Use state to determine if we should add a new fill
        hexColor: newHex,
        isBlended: fg.isBlended, // Include blend info
        messageType: MessageTypes.UpdateNodeColor,
        nodeId,
        oklchColor: newOklch,
      });

      // Create the message payload for better debugging
      const messagePayload = {
        pluginMessage: {
          payload: {
            addNewFill: shouldAddNewFill, // Use state value instead of hardcoding
            color: {
              hex: newHex,
              oklch: newOklch,
            },
            isBlended: fg.isBlended, // Include if the color is from a blended source
            isPreview,
            nodeId,
          },
          type: MessageTypes.UpdateNodeColor,
        },
      };

      console.log(
        'DEBUG: Sending message to Figma with payload:',
        JSON.stringify(messagePayload)
      );

      // Send update to Figma
      parent.postMessage(messagePayload, '*');

      console.log('DEBUG: Message sent to Figma');
    } catch (error) {
      console.error('Failed to update Figma node color:', error);
    }
  };

  // Helper to validate all inputs before calling apcach
  const safeApcach = (
    contrast: any, 
    chroma: number, 
    hue: number, 
    alpha: number
  ): ApcachColor | undefined => {
    console.log('DEBUG: safeApcach called with:', { contrast, chroma, hue, alpha });
    
    // Validate all inputs to avoid invalid contrast errors
    if (!contrast) {
      console.error('Invalid contrast object in safeApcach:', contrast);
      return undefined;
    }
    
    // Check contrast object structure
    if (typeof contrast !== 'object' || 
        !('contrastModel' in contrast) || 
        !('cr' in contrast) || 
        !('searchDirection' in contrast) ||
        !('bgColor' in contrast)) {
      console.error('Invalid contrast object structure:', contrast);
      return undefined;
    }
    
    // Validate lightness exists in the contrast object (different ways it might exist)
    if ((!('l' in contrast) || typeof contrast.l !== 'number' || isNaN(contrast.l)) &&
        (!('bgColor' in contrast) || typeof contrast.bgColor !== 'string')) {
      console.error('Invalid or missing lightness information in contrast object:', contrast);
      return undefined;
    }
    
    // Validate chroma
    if (typeof chroma !== 'number' || isNaN(chroma) || chroma < 0) {
      console.error('Invalid chroma value in safeApcach:', chroma);
      return undefined;
    }
    
    // Validate hue
    if (typeof hue !== 'number' || isNaN(hue)) {
      console.error('Invalid hue value in safeApcach:', hue);
      return undefined;
    }
    
    // Validate alpha
    if (typeof alpha !== 'number' || isNaN(alpha) || alpha < 0 || alpha > 1) {
      console.error('Invalid alpha value in safeApcach:', alpha);
      alpha = 1; // Default to 1 if invalid
    }
    
    try {
      const result = apcach(contrast, chroma, hue, alpha);
      console.log('DEBUG: safeApcach successful result:', result);
      return result;
    } catch (error) {
      console.error('Error in safeApcach call:', error);
      if (error instanceof Error) {
        console.log('Error details:', error.message);
        console.log('Error stack:', error.stack);
        
        if (error.message.includes('contrast') || error.message.includes('Invalid')) {
          console.log('This is a contrast format error. Contrast object:', contrast);
          
          // Try a fallback approach with a different contrast setup if possible
          try {
            if (typeof contrast.bgColor === 'string' && typeof contrast.cr === 'number') {
              console.log('Attempting fallback with simplified contrast approach');
              // Create a simpler contrast object that may work
              const fallbackContrast = {
                bgColor: contrast.bgColor,
                contrastModel: 'apca',
                cr: Math.min(Math.abs(contrast.cr), 100), // Keep within reasonable bounds
                fgColor: 'apcach', // Add the required fgColor property
                searchDirection: 'auto'
              };
              
              console.log('Using fallback contrast:', fallbackContrast);
              const fallbackResult = apcach(fallbackContrast, Math.min(chroma, 0.2), hue, alpha);
              console.log('Fallback successful:', fallbackResult);
              return fallbackResult;
            }
          } catch (fallbackError) {
            console.log('Fallback attempt failed:', fallbackError);
          }
        }
      }
      return undefined;
    }
  };

  // Simple event handlers for sliders with Figma updates
  const handleApcaChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newApca = parseFloat(e.target.value);
    setTargetApca(newApca);

    // Calculate new max chroma based on APCA change
    try {
      console.log('DEBUG: handleApcaChange with value:', newApca);
      const validatedApca = validateApca(newApca);
      console.log('DEBUG: handleApcaChange validated APCA:', validatedApca);
      
      const newMaxChroma = calculateMaxChroma(validatedApca, fgHue);
      console.log('DEBUG: handleApcaChange new max chroma:', newMaxChroma);
      setChromaMax(newMaxChroma);
      
      // Adjust chroma if needed to stay within valid bounds
      const adjustedChroma = adjustChromaToValidRange(newMaxChroma);
      console.log('DEBUG: handleApcaChange adjusted chroma:', adjustedChroma, 'from:', fgChroma);
      if (adjustedChroma !== fgChroma) {
        setFgChroma(adjustedChroma);
      }

      // Recalculate APCACH and update Figma
      if (hasValidBgHex()) {
        const alpha = fg?.oklch?.alpha ?? 1;
        const bgHex = getBgHex();
        
        console.log('DEBUG: handleApcaChange creating contrast with:', {
          bgHex,
          apca: validatedApca,
          model: 'apca',
          direction: 'auto'
        });
        
        const contrast = crTo(bgHex, validatedApca, 'apca', 'auto');
        console.log('DEBUG: handleApcaChange contrast created:', contrast);
        
        console.log('DEBUG: handleApcaChange calling apcach with:', {
          contrast,
          chroma: adjustedChroma,
          hue: fgHue, 
          alpha
        });
        
        const result = safeApcach(contrast, adjustedChroma, fgHue, alpha);
        if (result) {
          console.log('DEBUG: handleApcaChange apcach result:', result);
          setApcachResult(result);

          // Update Figma if conditions are met
          if (canUpdateFigma(result)) {
            updateFigmaNode(result, true); // Use isPreview=true during slider adjustments
          }
        } else {
          console.error('Failed to generate valid color with apcach in handleApcaChange');
        }
      }
    } catch (error) {
      if (error instanceof Error && 
         (error.message.includes('contrast') || 
          error.message.includes('Invalid'))) {
        console.error('Error with contrast format in handleApcaChange:', error);
        console.log('New APCA value:', newApca, 'BG hex:', getBgHex());
        console.log('Error stack:', error.stack);
      } else {
        console.error('Error updating APCA value:', error);
        if (error instanceof Error) {
          console.log('Error stack:', error.stack);
        }
      }
    }
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newHue = parseFloat(e.target.value);
    setFgHue(newHue);

    // Calculate new max chroma based on hue change
    try {
      console.log('DEBUG: handleHueChange with value:', newHue);
      const validatedApca = validateApca(targetApca);
      console.log('DEBUG: handleHueChange using APCA:', validatedApca);
      
      const newMaxChroma = calculateMaxChroma(validatedApca, newHue);
      console.log('DEBUG: handleHueChange new max chroma:', newMaxChroma);
      setChromaMax(newMaxChroma);
      
      // Adjust chroma if needed to stay within valid bounds
      const adjustedChroma = adjustChromaToValidRange(newMaxChroma);
      console.log('DEBUG: handleHueChange adjusted chroma:', adjustedChroma, 'from:', fgChroma);
      if (adjustedChroma !== fgChroma) {
        setFgChroma(adjustedChroma);
      }

      // Recalculate APCACH and update Figma
      if (hasValidBgHex()) {
        const alpha = fg?.oklch?.alpha ?? 1;
        const bgHex = getBgHex();
        
        console.log('DEBUG: handleHueChange creating contrast with:', {
          bgHex,
          apca: validatedApca,
          model: 'apca',
          direction: 'auto'
        });
        
        const contrast = crTo(bgHex, validatedApca, 'apca', 'auto');
        console.log('DEBUG: handleHueChange contrast created:', contrast);
        
        console.log('DEBUG: handleHueChange calling apcach with:', {
          contrast,
          chroma: adjustedChroma,
          hue: newHue, 
          alpha
        });
        
        const result = safeApcach(contrast, adjustedChroma, newHue, alpha);
        if (result) {
          console.log('DEBUG: handleHueChange apcach result:', result);
          setApcachResult(result);

          // Update Figma if conditions are met
          if (canUpdateFigma(result)) {
            updateFigmaNode(result, true); // Use isPreview=true during slider adjustments
          }
        } else {
          console.error('Failed to generate valid color with apcach in handleHueChange');
        }
      }
    } catch (error) {
      if (error instanceof Error && 
         (error.message.includes('contrast') || 
          error.message.includes('Invalid'))) {
        console.error('Error with contrast format in handleHueChange:', error);
        console.log('New Hue value:', newHue, 'APCA:', targetApca, 'BG hex:', getBgHex());
        console.log('Error stack:', error.stack);
      } else {
        console.error('Error updating Hue value:', error);
        if (error instanceof Error) {
          console.log('Error stack:', error.stack);
        }
      }
    }
  };

  const handleChromaChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newChroma = parseFloat(e.target.value);
    // Ensure chroma doesn't exceed the maximum
    const boundedChroma = Math.min(newChroma, chromaMax);
    setFgChroma(boundedChroma);

    // Recalculate APCACH and update Figma
    try {
      console.log('DEBUG: handleChromaChange with value:', newChroma, 'bounded to:', boundedChroma);
      
      if (hasValidBgHex()) {
        const alpha = fg?.oklch?.alpha ?? 1;
        const validatedApca = validateApca(targetApca);
        const bgHex = getBgHex();
        
        console.log('DEBUG: handleChromaChange creating contrast with:', {
          bgHex,
          apca: validatedApca,
          model: 'apca',
          direction: 'auto'
        });
        
        const contrast = crTo(bgHex, validatedApca, 'apca', 'auto');
        console.log('DEBUG: handleChromaChange contrast created:', contrast);
        
        console.log('DEBUG: handleChromaChange calling apcach with:', {
          contrast,
          chroma: boundedChroma,
          hue: fgHue, 
          alpha
        });
        
        const result = safeApcach(contrast, boundedChroma, fgHue, alpha);
        if (result) {
          console.log('DEBUG: handleChromaChange apcach result:', result);
          setApcachResult(result);

          // Update Figma if conditions are met
          if (canUpdateFigma(result)) {
            updateFigmaNode(result, true); // Use isPreview=true during slider adjustments
          }
        } else {
          console.error('Failed to generate valid color with apcach in handleChromaChange');
        }
      }
    } catch (error) {
      if (error instanceof Error && 
         (error.message.includes('contrast') || 
          error.message.includes('Invalid'))) {
        console.error('Error with contrast format in handleChromaChange:', error);
        console.log('New Chroma value:', newChroma, 'APCA:', targetApca, 'BG hex:', getBgHex());
        console.log('Error stack:', error.stack);
      } else {
        console.error('Error updating Chroma value:', error);
        if (error instanceof Error) {
          console.log('Error stack:', error.stack);
        }
      }
    }
  };

  // Display maximum chroma value for user guidance
  const maxChromaDisplay = chromaMax.toFixed(3);

  // CSS styles for slider components
  const sliderStyles = {
    container: {
      backgroundColor: 'var(--figma-color-bg)',
      borderColor: 'var(--figma-color-border)',
      borderWidth: '1px',
    },
    label: {
      color: 'var(--figma-color-text)'
    },
    numberInput: {
      backgroundColor: 'var(--figma-color-bg)',
      border: '1px solid var(--figma-color-border)',
      color: 'var(--figma-color-text)'
    },
    rangeTrack: {
      backgroundColor: 'var(--figma-color-bg-tertiary)',
    }
  };

  return (
    <div
      className="mt-4 rounded-lg p-3"
      style={sliderStyles.container}
    >
      {/* Add New Fill Option */}
      <div className="mb-4 flex items-center">
        <input
          checked={shouldAddNewFill}
          onChange={(e) => {
            setShouldAddNewFill(e.target.checked);
          }}
          className="mr-2 h-3 w-3"
          id="add-new-fill-checkbox"
          type="checkbox"
        />
        <label
          className="text-xxs font-medium"
          htmlFor="add-new-fill-checkbox"
          style={sliderStyles.label}
        >
          Preserve original fills (add new fill instead of updating)
        </label>
      </div>

      {/* APCA Slider */}
      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="mr-2 text-xxs font-medium"
            htmlFor="static-apca-slider"
            id="static-apca-slider-label"
            style={sliderStyles.label}
          >
            APCA
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            onChange={(e) => {
              let v = Number(e.target.value);
              if (isNaN(v)) v = 0;
              if (v < 0) v = 0;
              if (v > 108) v = 108;
              setTargetApca(v);

              // Trigger APCA change handler
              const event = {
                target: {
                  value: v.toString(),
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleApcaChange(event);
            }}
            className="w-14 rounded px-1 text-right text-xxs"
            max={108}
            min={0}
            step={0.1}
            style={sliderStyles.numberInput}
            type="number"
            value={targetApca}
          />
          <input
            aria-labelledby="static-apca-slider-label"
            className="h-1 w-full cursor-pointer appearance-none rounded-full figma-slider"
            id="static-apca-slider"
            min={0}
            max={108}
            onChange={handleApcaChange}
            step={0.1}
            style={sliderStyles.rangeTrack}
            type="range"
            value={targetApca}
          />
        </div>
      </div>

      {/* Chroma Slider */}
      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="mr-2 text-xxs font-medium"
            htmlFor="static-chroma-slider"
            id="static-chroma-slider-label"
            style={sliderStyles.label}
          >
            Chroma (max: {maxChromaDisplay})
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            onChange={(e) => {
              let v = Number(e.target.value);
              if (isNaN(v)) v = 0;
              if (v < 0) v = 0;
              if (v > chromaMax) v = chromaMax;
              setFgChroma(v);

              // Trigger Chroma change handler
              const event = {
                target: {
                  value: v.toString(),
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleChromaChange(event);
            }}
            className="w-14 rounded px-1 text-right text-xxs"
            max={chromaMax}
            min={0}
            step={0.001}
            style={sliderStyles.numberInput}
            type="number"
            value={fgChroma}
          />
          <input
            aria-labelledby="static-chroma-slider-label"
            className="h-1 w-full cursor-pointer appearance-none rounded-full figma-slider"
            id="static-chroma-slider"
            min={0}
            max={chromaMax}
            onChange={handleChromaChange}
            step={0.001}
            style={sliderStyles.rangeTrack}
            type="range"
            value={fgChroma}
          />
        </div>
      </div>

      {/* Hue Slider */}
      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="mr-2 text-xxs font-medium"
            htmlFor="static-hue-slider"
            id="static-hue-slider-label"
            style={sliderStyles.label}
          >
            Hue
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            onChange={(e) => {
              let v = Number(e.target.value);
              if (isNaN(v)) v = 0;
              if (v < 0) v = 0;
              if (v > 360) v = 360;
              setFgHue(v);

              // Trigger Hue change handler
              const event = {
                target: {
                  value: v.toString(),
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleHueChange(event);
            }}
            className="w-14 rounded px-1 text-right text-xxs"
            max={360}
            min={0}
            step={1}
            style={sliderStyles.numberInput}
            type="number"
            value={fgHue}
          />
          <input
            aria-labelledby="static-hue-slider-label"
            className="h-1 w-full cursor-pointer appearance-none rounded-full figma-slider"
            id="static-hue-slider"
            min={0}
            max={360}
            onChange={handleHueChange}
            step={1}
            style={sliderStyles.rangeTrack}
            type="range"
            value={fgHue}
          />
        </div>
      </div>
    </div>
  );
};
