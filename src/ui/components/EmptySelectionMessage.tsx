import ufoImage from '~ui/assets/ufo@2x.webp';
import { type ReactElement } from 'react';

// Ghost version of the sliders for empty state
const GhostSliders = (): ReactElement => {
  // Simplified version of the slider styles from StaticColorAdjustmentSliders
  const sliderStyles = {
    container: {
      backgroundColor: 'var(--figma-color-bg)',
      borderColor: 'var(--figma-color-border)',
      borderWidth: '1px',
      opacity: 0.5, // Reduced opacity for ghost effect
    },
    label: {
      color: 'var(--figma-color-text-secondary)'
    },
    numberInput: {
      backgroundColor: 'var(--figma-color-bg-secondary)',
      border: '1px solid var(--figma-color-border)',
      color: 'var(--figma-color-text-secondary)'
    },
    rangeTrack: {
      backgroundColor: 'var(--figma-color-bg-tertiary)',
    }
  };

  // Default values for the ghost sliders
  const defaultApca = 60;
  const defaultChroma = 0.2;
  const defaultHue = 180;
  const maxChromaDisplay = "0.370";

  return (
    <div
      className="mt-4 rounded-lg p-3"
      style={sliderStyles.container}
    >
      {/* Add New Fill Option */}
      <div className="mb-4 flex items-center">
        <input
          className="mr-2 h-3 w-3 cursor-not-allowed"
          disabled
          id="ghost-add-new-fill"
          type="checkbox"
        />
        <label
          className="text-xxs font-medium opacity-70"
          htmlFor="ghost-add-new-fill"
          style={sliderStyles.label}
        >
          Preserve original fills (add new fill instead of updating)
        </label>
      </div>

      {/* APCA Slider */}
      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="mr-2 text-xxs font-medium opacity-70"
            htmlFor="ghost-apca-slider"
            id="ghost-apca-slider-label"
            style={sliderStyles.label}
          >
            APCA
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-14 rounded px-1 text-right text-xxs cursor-not-allowed"
            disabled
            style={sliderStyles.numberInput}
            type="number"
            value={defaultApca}
          />
          <input
            aria-labelledby="ghost-apca-slider-label"
            className="h-1 w-full appearance-none rounded-full figma-slider cursor-not-allowed"
            disabled
            id="ghost-apca-slider"
            max={108}
            min={0}
            step={0.1}
            style={sliderStyles.rangeTrack}
            type="range"
            value={defaultApca}
          />
        </div>
      </div>

      {/* Chroma Slider */}
      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="mr-2 text-xxs font-medium opacity-70"
            htmlFor="ghost-chroma-slider"
            id="ghost-chroma-slider-label"
            style={sliderStyles.label}
          >
            Chroma (max: {maxChromaDisplay})
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-14 rounded px-1 text-right text-xxs cursor-not-allowed"
            disabled
            style={sliderStyles.numberInput}
            type="number"
            value={defaultChroma}
          />
          <input
            aria-labelledby="ghost-chroma-slider-label"
            className="h-1 w-full appearance-none rounded-full figma-slider cursor-not-allowed"
            disabled
            id="ghost-chroma-slider"
            max={0.37}
            min={0}
            step={0.001}
            style={sliderStyles.rangeTrack}
            type="range"
            value={defaultChroma}
          />
        </div>
      </div>

      {/* Hue Slider */}
      <div className="mb-6">
        <div className="mb-1 flex items-center">
          <label
            className="mr-2 text-xxs font-medium opacity-70"
            htmlFor="ghost-hue-slider"
            id="ghost-hue-slider-label"
            style={sliderStyles.label}
          >
            Hue
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-14 rounded px-1 text-right text-xxs cursor-not-allowed"
            disabled
            style={sliderStyles.numberInput}
            type="number"
            value={defaultHue}
          />
          <input
            aria-labelledby="ghost-hue-slider-label"
            className="h-1 w-full appearance-none rounded-full figma-slider cursor-not-allowed"
            disabled
            id="ghost-hue-slider"
            max={360}
            min={0}
            step={1}
            style={sliderStyles.rangeTrack}
            type="range"
            value={defaultHue}
          />
        </div>
      </div>
    </div>
  );
};

export const EmptySelectionMessage = (): ReactElement => {
  return (
    <div className="flex flex-col items-center">
      <p
        style={{
          backgroundImage: `url(${ufoImage})`,
        }}
        className="mx-auto flex h-[180px] w-[180px] select-none items-end justify-center bg-[length:180px_180px] bg-center bg-no-repeat pt-2 text-center font-martianMono text-xxs text-secondary-75"
      >
        Select a&nbsp;layer with a&nbsp;solid fill
      </p>
      
      {/* Ghost UI to show what's available after selection */}
      <div className="mt-4 w-full max-w-[300px]">
        <GhostSliders />
      </div>
    </div>
  );
};
