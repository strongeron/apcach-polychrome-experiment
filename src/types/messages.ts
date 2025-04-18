import { type PolychromNode } from '~types/common';
import { type FigmaColorSpace } from '~types/figma';

import { type ColorSpaceDisplayModes } from '../constants';

export enum MessageTypes {
  ColorSpaceDisplayModeChange = 'Polychrom_ColorSpaceDisplayModeChange',
  SelectionChange = 'Polychrom_SelectionChange',
  UiReady = 'Polychrom_UiReady',
  UpdateNodeColor = 'Polychrom_UpdateNodeColor',
}

export interface MessagePayload<T> {
  payload: T;
  type: MessageTypes;
}

export interface Message<T> {
  pluginMessage: MessagePayload<T>;
}

export enum SelectionMessageTypes {
  invalidBackground = 'invalidBackground',
  unprocessedBlendModes = 'unprocessedBlendModes',
}

export interface SelectionChangePayload {
  colorSpace: FigmaColorSpace;
  selectedNodePairs: PolychromNode[];
}

export interface SelectionChangeMessage {
  colorSpace: FigmaColorSpace;
  text: SelectionMessageTypes;
}

export type SelectionChangeEvent = SelectionChangeMessage | SelectionChangePayload;

export interface ColorSpaceDisplayModeChangeMessage {
  colorSpaceDisplayMode: ColorSpaceDisplayModes;
}

export interface UpdateNodeColorPayload {
  color: {
    hex: string;
    oklch: {
      alpha?: number;
      c: number;
      h: number;
      l: number;
      mode: string;
    };
  };
  isPreview: boolean;
  nodeId: string;
}
