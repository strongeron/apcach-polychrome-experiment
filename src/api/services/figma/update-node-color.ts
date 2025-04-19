import { type FigmaPaint } from '~types/figma';

export const updateNodeColor = (
  nodeId: string,
  color: { hex: string; oklch: any },
  isPreview: boolean = false,
  directNode?: SceneNode
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
      )}`
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
    } else {
      console.error('Node does not have fills property:', nodeId);
      if (!isPreview) {
        figma.notify('Unable to update color: Element has no fill');
      }
    }
  } catch (error) {
    console.error('Failed to update node color:', error);
    if (!isPreview) {
      figma.notify('Failed to update color');
    }
  }
};
