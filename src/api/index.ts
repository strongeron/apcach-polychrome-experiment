import { sendSelectionDataToUi } from '~api/services/messages/send-selection-data-to-ui';

import { type MessagePayload, MessageTypes } from '../types/messages';
import { updateNodeColor } from './services/figma/update-node-color';
import { sendSavedColorSpaceDisplayMode } from './services/messages/send-saved-color-space-display-mode';
import { ClientStorageKeys } from './types';

figma.skipInvisibleInstanceChildren = true;

figma.showUI(__html__, {
  height: 540,
  themeColors: true,
  width: 328,
});

figma.on('selectionchange', sendSelectionDataToUi);
figma.on('run', sendSelectionDataToUi);
figma.on('documentchange', sendSelectionDataToUi);

figma.on('close', () => {
  figma.off('selectionchange', sendSelectionDataToUi);
  figma.off('run', sendSelectionDataToUi);
  figma.off('documentchange', sendSelectionDataToUi);
});

figma.ui.onmessage = (message: MessagePayload<any>) => {
  if (message.type === MessageTypes.ColorSpaceDisplayModeChange) {
    void figma.clientStorage.setAsync(
      ClientStorageKeys.savedColorSpaceDisplayMode,
      message.payload.colorSpaceDisplayMode
    );
  }

  if (message.type === MessageTypes.UiReady) {
    sendSavedColorSpaceDisplayMode();
  }

  if (message.type === MessageTypes.UpdateNodeColor) {
    try {
      // Validate inputs
      const { nodeId, color, isPreview, isBlended, addNewFill } = message.payload;

      if (nodeId === undefined || color === undefined) {
        console.error('Missing required parameters in UpdateNodeColor message');
        return;
      }

      console.log(
        `DEBUG: Received UpdateNodeColor message: ${JSON.stringify(message)}`
      );

      // Check if the node exists
      const matchingNodes = figma.currentPage.findAll(
        (node) => node.id === nodeId
      );
      console.log(
        `DEBUG: Node existence check for ID ${nodeId}: ${
          matchingNodes.length > 0
        }, found ${matchingNodes.length} matching nodes`
      );

      if (matchingNodes.length === 0) {
        console.error(`Node not found: ${nodeId}`);
        if (isPreview === false) {
          figma.notify('Node not found');
        }
        return;
      }

      // Log current selection for better debugging
      console.log(
        `DEBUG: Current selection before color update - count: ${
          figma.currentPage.selection.length
        }, IDs: ${figma.currentPage.selection.map((n) => n.id).join(', ')}`
      );

      // Proceed with update if node exists
      console.log(
        `DEBUG: Calling updateNodeColor with nodeId: ${String(
          nodeId
        )}, hex: ${String(message.payload.color.hex)}, isPreview: ${String(
          message.payload.isPreview
        )}, isBlended: ${String(isBlended || false)}, addNewFill: ${String(addNewFill || false)}`
      );

      // Pass the matching node directly to updateNodeColor
      if (matchingNodes.length > 0) {
        const targetNode = matchingNodes[0] as SceneNode;
        updateNodeColor(
          message.payload.nodeId,
          message.payload.color,
          message.payload.isPreview,
          targetNode, // Pass the node directly
          isBlended || false, // Pass isBlended flag, default to false if undefined
          addNewFill || false // Pass addNewFill flag, default to false if undefined
        );
      } else {
        // This should never happen due to earlier check, but just in case
        console.error(
          'Unexpected error: Node found but then lost before update'
        );
      }
    } catch (error) {
      console.error('Error in UpdateNodeColor handler:', error);
      if (message.payload.isPreview === false) {
        figma.notify('Failed to update color');
      }
    }
  }
};
