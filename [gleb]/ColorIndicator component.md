

1. **Initial Selection from Figma**:
   - When the Figma plugin loads or a selection changes, the API sends a message (`MessageTypes.SelectionChange`) with the selected nodes.
   - This message is received by the UI and stored in the `$userSelection` atom in `selected-nodes.ts`.

2. **Processing Raw Figma Selection**:
   - The `blendColors` function in `blend-colors.ts` is called when the `$userSelection` changes.
   - For each selected node pair, the `blendSelectionPair` function:
     - Creates an OffscreenCanvas to render the nodes
     - Draws the nodes onto the canvas using SVG
     - Extracts color data using `getFillFromCtx` and `getColorData`
     - Identifies if the fills are blended
     - Calculates the APCA contrast score

3. **Color Data Formatting**:
   - The extracted color data (in RGB format) is processed by `formatColorData` in `format-color-data.ts`
   - This function converts the RGB values to:
     - Hex format using `formatHex` from Culori
     - OKLCH format using `converter('oklch')` from Culori
   - The formatted data, along with the blended status and the APCA score, is returned as a `ContrastConclusion` object

4. **Store and Component Flow**:
   - The `ContrastConclusion` objects are stored in the `$contrastConclusion` atom
   - The `AppContent` component checks states like `isMultiSelection` and renders either a `SelectionsList` or a single `Selection`
   - The `Selection` component receives the `ContrastConclusion` as `userSelection` prop and destructures it into `{ apca, bg, fg }`
   - It then passes these values to the `SelectionContent` component
   - The `SelectionContent` component formats the colors using `formatColorForTheme` and passes them to the `ColorIndicator` component

5. **Final Display in ColorIndicator**:
   - The `ColorIndicator` component receives:
     - `fill`: The color object containing both hex and OKLCH values
     - `indicatorColor`: The formatted color for display
     - `isBlended`: Whether the fill has blend modes
     - `borderColor` and `textColor`: For styling
   - It uses the current `colorSpaceDisplayMode` to determine how to format the color for display
   - For OKLCH mode, it uses `formatForOklchDisplay` which formats the values as `"33% 0.16 266.9"`

To summarize, the values in the ColorIndicator component come from:
1. Figma selection → 
2. Canvas rendering → 
3. Color data extraction → 
4. Conversion to OKLCH (using Culori) → 
5. Formatting for display

The specific values (33%, 0.16, 266.9) represent:
- Lightness (L): Formatted as a percentage (0-100%)
- Chroma (C): Formatted to 2 decimal places (measure of colorfulness)
- Hue (H): Formatted to 1 decimal place (color angle in degrees, 0-360°)

This entire process ensures that the Polychrom plugin can accurately display and work with colors from Figma, while providing a perceptually uniform color space (OKLCH) that's well-suited for the APCA contrast calculations.
