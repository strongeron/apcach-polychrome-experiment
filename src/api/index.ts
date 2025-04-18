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
      console.log('DEBUG: Received UpdateNodeColor message:', JSON.stringify(message));

      // Check if the node is still in the current selection or document
      const nodeId = message.payload.nodeId;


      // Ensure nodeId is defined
      if (nodeId === undefined || nodeId === '') {
        console.warn('Invalid nodeId provided - skipping color update');
        return;
      }

      // Use findAll to reliably find the node anywhere in the document
      // This is necessary because findOne only searches direct children
      const matchingNodes = figma.currentPage.findAll(node => node.id === nodeId);
      const nodeExists = matchingNodes.length > 0;

      console.log({matchingNodes, nodeExists})

      console.log(`DEBUG: Node existence check for ID ${String(nodeId)}: ${String(nodeExists)}, found ${matchingNodes.length} matching nodes`);

      if (!nodeExists) {
        console.warn(`Node with ID ${nodeId as string} not found in document - skipping color update`);

        // Only notify on non-preview updates
        if (message.payload.isPreview === false) {
          figma.notify('Cannot update color: Element no longer exists');
        }
        return;
      }

      // Log current selection for debugging
      const currentSelection = figma.currentPage.selection;
      console.log(`DEBUG: Current selection before color update - count: ${currentSelection.length}, IDs: ${currentSelection.map(n => n.id).join(', ')}`);

      // Proceed with update if node exists
      console.log(`DEBUG: Calling updateNodeColor with nodeId: ${String(nodeId)}, hex: ${String(message.payload.color.hex)}, isPreview: ${String(message.payload.isPreview)}`);

      // Pass the matching node directly to updateNodeColor
      if (matchingNodes.length > 0) {
        const targetNode = matchingNodes[0] as SceneNode;
        updateNodeColor(
          message.payload.nodeId,
          message.payload.color,
          message.payload.isPreview,
          targetNode // Pass the node directly
        );
      } else {
        // This should never happen due to earlier check, but just in case
        console.error('Unexpected error: Node found but then lost before update');
      }
    } catch (error) {
      console.error('Error in UpdateNodeColor handler:', error);
      if (message.payload.isPreview === false) {
        figma.notify('Failed to update color');
      }
    }
  }
};
