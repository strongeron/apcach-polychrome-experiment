import {
  ThemeVariablesKeys,
  ThemeVariablesProvider,
} from '~ui/components/ThemeVariablesProvider.tsx';
import { type ContrastConclusion } from '~ui/types';
import { isEmpty } from '~utils/not-empty.ts';
import clsx from 'clsx';
import { type ReactElement, useState } from 'react';

import { generateUIColors } from '../services/theme/generate-ui-colors.ts';
import { SegmentedFontStyleDefinition } from './SegmentedFontStyleDefinition.tsx';
import { SelectionContent } from './SelectionContent.tsx';
import { StaticColorAdjustmentSliders } from './StaticColorAdjustmentSliders.tsx';

const CantCalculateMessage = (): ReactElement => (
  <p className="mx-auto mb-4 flex select-none items-end justify-center py-4 text-center font-martianMono text-xxs text-secondary-75">
    Can&apos;t calc
  </p>
);

interface Props {
  id: string;
  isLast?: boolean;
  size: 'large' | 'small';
  userSelection: ContrastConclusion;
}

const SEGMENTED_FONT_STYLES = {
  INITIAL: 1,
  MAX: 2,
};

export const Selection = ({
  id,
  isLast,
  size,
  userSelection: { apca, bg, fg, originalSelectedNodeId },
}: Props): ReactElement => {
  const [currentStyleNumber, setCurrentStyleNumber] = useState(
    SEGMENTED_FONT_STYLES.INITIAL
  );

  // Reference to original fg and apca for display
  const adjustedFg = fg;
  const adjustedApca = apca;

  const handleCurrentStyleNumberChange = (): void => {
    const newStyleNumber = currentStyleNumber + 1;
    if (newStyleNumber > SEGMENTED_FONT_STYLES.MAX) {
      setCurrentStyleNumber(SEGMENTED_FONT_STYLES.INITIAL);
    } else {
      setCurrentStyleNumber(newStyleNumber);
    }
  };

  if (isEmpty(apca)) {
    return <CantCalculateMessage />;
  }

  const uiColors = generateUIColors(
    { hex: adjustedFg.hex, oklch: adjustedFg.oklch },
    { hex: bg.hex, oklch: bg.oklch }
  );

  if (isEmpty(uiColors)) {
    return <CantCalculateMessage />;
  }

  return (
    <div className="w-full">
      <ThemeVariablesProvider theme={uiColors.theme}>
        <div className="w-full">
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
              apca={adjustedApca}
              bg={bg}
              fg={adjustedFg}
              id={id}
              isLast={isLast}
              onApcaDoubleClick={handleCurrentStyleNumberChange}
              originalSelectedNodeId={originalSelectedNodeId}
              size={size}
            />
          </div>

          {/* Render color adjustment sliders outside the main preview div */}
          {size === 'large' && (
            <StaticColorAdjustmentSliders
              apca={apca}
              bg={bg}
              fg={fg}
              key={`slider-${id}`}
              nodeId={originalSelectedNodeId}
            />
          )}
        </div>
      </ThemeVariablesProvider>
    </div>
  );
};
