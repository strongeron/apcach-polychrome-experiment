import { type FigmaPaint } from '~types/figma';

export const updateNodeColor = (
  nodeId: string,
  color: { hex: string; oklch: any },
  isPreview: boolean = false,
  directNode?: SceneNode,
  isBlended: boolean = false,
  addNewFill: boolean = false
): void => {
  try {
    // Input validation
    if (nodeId === undefined || nodeId === '' || typeof nodeId !== 'string') {
      console.error('Invalid node ID provided:', nodeId);
      return;
    }

    if (
      color === undefined ||
      color.hex === undefined ||
      color.hex === '' ||
      typeof color.hex !== 'string' ||
      !color.hex.startsWith('#')
    ) {
      console.error('Invalid color format:', color);
      return;
    }

    console.log(
      `DEBUG: updateNodeColor called with nodeId: ${nodeId}, hex: ${
        color.hex
      }, isPreview: ${String(isPreview)}, directNode provided: ${String(
        directNode !== undefined
      )}, isBlended: ${String(isBlended)}, addNewFill: ${String(addNewFill)}`
    );

    // Use the direct node if provided, otherwise try to find it
    let node: null | SceneNode = null;
    if (directNode !== undefined) {
      node = directNode;
      console.log('DEBUG: Using direct node reference provided to function');
    } else {
      // Try multiple methods to find the node

      // Method 1: Check current selection
      const currentSelection = figma.currentPage.selection;
      console.log(
        `DEBUG: Current selection count: ${
          currentSelection.length
        }, selection IDs: ${currentSelection.map((n) => n.id).join(', ')}`
      );

      for (const selectedNode of currentSelection) {
        if (selectedNode.id === nodeId) {
          node = selectedNode;
          console.log('DEBUG: Node found in current selection');
          break;
        }
      }

      // Method 2: Use findAll on current page
      if (node === null) {
        console.log(
          'DEBUG: Node not found in selection, searching entire page...'
        );
        const nodes = figma.currentPage.findAll((n) => n.id === nodeId);
        console.log(
          `DEBUG: Found ${nodes.length} nodes matching ID: ${nodeId}`
        );

        if (nodes.length > 0) {
          node = nodes[0] as SceneNode;
          console.log('DEBUG: Node found in document search, type:', node.type);

          // Select the node to ensure it's targeted
          figma.currentPage.selection = [node];
          console.log('DEBUG: Node has been explicitly selected');
        }
      }

      // Method 3: Try getNodeById as a last resort
      if (node === null) {
        try {
          console.log('DEBUG: Trying getNodeById as a last resort');

          // Use any to bypass type checking for this Figma API method
          const figmaAny = figma as any;
          if (typeof figmaAny.getNodeById === 'function') {
            const foundNode = figmaAny.getNodeById(nodeId);
            if (foundNode !== null && foundNode !== undefined) {
              node = foundNode as SceneNode;
              console.log(
                'DEBUG: Node found via getNodeById, type:',
                node.type
              );

              // Select the node to ensure it's targeted
              figma.currentPage.selection = [node];
              console.log('DEBUG: Node has been explicitly selected');
            }
          } else {
            console.log('DEBUG: getNodeById method not available');
          }
        } catch (e) {
          console.error('DEBUG: Error using getNodeById:', e);
        }
      }
    }

    // If still not found, exit
    if (node === null) {
      console.error('Node not found in document:', nodeId);

      if (!isPreview) {
        figma.notify('Unable to update color: Element not found');
      }
      return;
    }

    // Check if node has fills property
    if ('fills' in node) {
      console.log('DEBUG: Node has fills property, updating color...');

      // Convert hex to RGB
      const r = parseInt(color.hex.slice(1, 3), 16) / 255;
      const g = parseInt(color.hex.slice(3, 5), 16) / 255;
      const b = parseInt(color.hex.slice(5, 7), 16) / 255;
      console.log(
        `DEBUG: Converting hex ${color.hex} to RGB: r=${r}, g=${g}, b=${b}`
      );

      // Get current fills
      const fills = JSON.parse(JSON.stringify(node.fills)) as FigmaPaint[];
      console.log(
        `DEBUG: Current fills count: ${fills.length}, types: ${fills
          .map((f) => f.type)
          .join(', ')}`
      );

      // Handle the case when we want to add a new fill rather than update existing ones
      if (addNewFill && fills.length > 1 && !isPreview) {
        // Only add a new fill when:
        // 1. User has chosen to add a new fill (addNewFill is true)
        // 2. The node has multiple fills (fills.length > 1)
        // 3. This is a final update, not a preview (isPreview is false)
        console.log('DEBUG: Adding new fill on top of existing fills (final update)');
        
        // Check if the topmost fill was already added by our plugin
        const existingTopFill = fills.length > 0 ? fills[fills.length - 1] : null;
        const hasExistingTopFill = existingTopFill !== null && 
                                  existingTopFill !== undefined &&
                                  typeof existingTopFill === 'object' &&
                                  'type' in existingTopFill && 
                                  existingTopFill.type === 'SOLID' && 
                                  'visible' in existingTopFill &&
                                  existingTopFill.visible === true &&
                                  'opacity' in existingTopFill &&
                                  existingTopFill.opacity === 1;
        
        // Create a new fills array preserving the originals
        const newFills = JSON.parse(JSON.stringify(fills));
        
        if (hasExistingTopFill) {
          // Update the existing top fill instead of adding another one
          console.log('DEBUG: Updating existing top fill instead of adding a new one');
          newFills[newFills.length - 1] = {
            ...newFills[newFills.length - 1],
            color: { b, g, r },
          };
        } else {
          // Create a new solid fill
          const newFill: FigmaPaint = {
            color: { b, g, r },
            opacity: 1,
            type: 'SOLID',
            visible: true
          };
          
          // Add the new fill to the top
          newFills.push(newFill);
          
          // Use a fixed index value that's guaranteed to be a number
          const newIndex = newFills.length - 1;
          console.log(
            `DEBUG: Added new fill at index ${newIndex}`,
            newFill
          );
        }
        
        // Apply the updated fills
        node.fills = newFills;
        
        figma.notify('New fill added');
        console.log('DEBUG: New fill added/updated (final)');
      }
      // For preview updates or when handling single fills or when not adding new fills
      else {
        // Handle blended nodes with multiple fills when in preview mode or when not adding new fills
        if (fills.length > 1 && (isBlended || (addNewFill && isPreview))) {
          console.log('DEBUG: Node has multiple fills - updating topmost solid fill (preview or update)');
          
          // Find all visible solid fills
          const solidFillIndices = fills
            .map((fill, index) => ({ fill, index }))
            .filter(({ fill }) => fill.type === 'SOLID' && fill.visible !== false)
            .map(({ index }) => index);
          
          console.log(`DEBUG: Found ${solidFillIndices.length} visible solid fills to update`);
          
          if (solidFillIndices.length > 0) {
            // Create a new fills array with the updated color
            const newFills = JSON.parse(JSON.stringify(fills));
            
            // Update the topmost visible fill
            const lastIndex = solidFillIndices.length - 1;
            if (lastIndex >= 0) {
              const topFillIndex = solidFillIndices[lastIndex];
              
              // TypeScript safety: ensure topFillIndex is a number and is valid
              if (typeof topFillIndex === 'number' && topFillIndex >= 0 && topFillIndex < newFills.length) {
                console.log(`DEBUG: Updating topmost fill at index ${topFillIndex}`);
                console.log(
                  `DEBUG: Current color at index ${topFillIndex}:`,
                  newFills[topFillIndex].color
                );
                
                newFills[topFillIndex] = {
                  ...newFills[topFillIndex],
                  color: { b, g, r },
                };
                
                console.log(
                  `DEBUG: New color at index ${topFillIndex}:`,
                  newFills[topFillIndex].color
                );
                
                // Apply the updated fills
                node.fills = newFills;
                
                if (!isPreview) {
                  figma.notify('Multiple fills color updated');
                  console.log('DEBUG: Color update applied to blended node (final)');
                } else {
                  console.log('DEBUG: Color update applied to blended node (preview)');
                }
              } else {
                console.error(`Invalid fill index: ${topFillIndex} for fills array of length ${newFills.length}`);
                if (!isPreview) {
                  figma.notify('Unable to update color: Invalid fill index');
                }
              }
            } else {
              console.error('Could not determine top fill index for multiple fills:', nodeId);
              if (!isPreview) {
                figma.notify('Unable to update color: Fill structure issue');
              }
            }
          } else {
            console.error('No visible solid fills found in node with multiple fills:', nodeId);
            if (!isPreview) {
              figma.notify('Unable to update color: No visible solid fills found');
            }
          }
        } else {
          // Original behavior for single fill nodes
          // Find the first solid fill
          const solidFillIndex = fills.findIndex(
            (fill) => fill.type === 'SOLID' && fill.visible !== false
          );

          console.log(`DEBUG: Found solid fill index: ${solidFillIndex}`);

          if (solidFillIndex !== -1) {
            // Create a new fills array with the updated color
            const newFills = JSON.parse(JSON.stringify(fills));
            console.log(
              `DEBUG: Current color at index ${solidFillIndex}:`,
              newFills[solidFillIndex].color
            );

            newFills[solidFillIndex] = {
              ...newFills[solidFillIndex],
              color: { b, g, r },
            };

            console.log(
              `DEBUG: New color at index ${solidFillIndex}:`,
              newFills[solidFillIndex].color
            );

            // Apply the updated fills
            node.fills = newFills;

            // Notify if this is a final (non-preview) update
            if (!isPreview) {
              figma.notify('Color updated');
              console.log('DEBUG: Color update applied (final)');
            } else {
              console.log('DEBUG: Color update applied (preview)');
            }
          } else {
            console.error('No solid fill found in node:', nodeId);
            if (!isPreview) {
              figma.notify('Unable to update color: No solid fill found');
            }
          }
        }
      }
    } else {
      console.error('Node does not have fills property:', nodeId);
      if (!isPreview) {
        figma.notify('Unable to update color: Element has no fill');
      }
    }
  } catch (error) {
    console.error('Error updating node color:', error);
    if (!isPreview) {
      figma.notify('Error updating node color');
    }
  }
};
