
Okay, let's look at the components in `src/ui/components` like different tools or display panels in a workshop. Here’s what each one generally does, explained simply:

**Core App Structure:**

*   **`App.tsx`**: Think of this as the **main workbench**. It's the top-level container that holds everything else together. It usually sets up the basic layout and includes the main content area.
*   **`AppContent.tsx`**: This is like the **main area on your workbench**. It sits inside `App.tsx` and usually decides *what specific tools or displays* to show based on what's happening (e.g., show selection details if something is selected, or show a message if nothing is).
*   **`ThemeVariablesProvider.tsx`**: This is like the **lighting and color scheme** for your workshop. It manages the colors (like light mode vs. dark mode) used by all the other components so they look consistent with Figma's interface.

**Displaying Selection Info & Color Details:**

*   **`Selection.tsx`**: This component is responsible for **displaying the details of what you've selected** in Figma. It likely receives information about the selected item(s) and then uses other components (like `SelectionContent`, `ColorAdjustmentSliders`) to show that info.
*   **`SelectionContent.tsx`**: Sits inside `Selection.tsx`. It probably **arranges the specific details** about the selected pair (like the foreground and background), showing their contrast score, color previews, etc.
*   **`SelectionsList.tsx`**: If you select multiple items, this component probably **shows a list** of those selected pairs.
*   **`ColorPreview.tsx`**: A simple display panel that **shows a block of color**. Used to visually represent the foreground or background color.
*   **`BasicColorPreviewIcon.tsx`**: Similar to `ColorPreview`, but probably a **smaller, icon-sized version** of a color block.
*   **`LayeredColorPreviewIcon.tsx`**: Shows a color preview, but likely with **two colors layered** (like text on a background) to give a quick visual sense of the pair.
*   **`ColorIndicator.tsx`**: This probably shows the **APCA contrast score** along with some visual indicator (maybe a color bar or icon) showing if the contrast is good or bad.
*   **`ContrastSample.tsx`**: Displays **sample text** ("Aa") using the selected foreground and background colors so you can see what the contrast actually looks like.
*   **`TextMetrics.tsx`**: Likely displays **calculated text properties** related to the APCA score, perhaps showing recommended font sizes or weights based on the contrast.
*   **`SegmentedFontStyleDefinition.tsx`**: This might display different **APCA contrast levels** (like for Fluent Text, Body Text, etc.) and show if the current contrast meets those levels.

**User Interaction & Controls:**

*   **`ColorAdjustmentSliders.tsx`**: A **key control panel**. This shows the sliders (APCA, Chroma, Hue) that let you **modify the colors** of the selected item directly from the plugin. It handles the complex logic of calculating new colors based on slider input.
*   **`SettingsButton.tsx`**: A button, likely with a gear icon, that probably **opens a settings menu** or view within the plugin.
*   **`Tooltip.tsx`**: Not a visible component itself, but provides the logic for **pop-up hints** that appear when you hover over other elements (like buttons or icons).

**Messages & Status:**

*   **`EmptySelectionMessage.tsx`**: A sign that shows up saying something like "**Please select something in Figma**" when you haven't selected any items.
*   **`InvalidBackgroundSelectionMessage.tsx`**: A specific warning sign telling you "**The background you selected isn't suitable**" (maybe it's an image or gradient).
*   **`UnprocessedBlendModesSelectionMessage.tsx`**: Another warning sign indicating that the selected items use **complex blend modes** that the plugin might not be able to calculate contrast for accurately.
*   **`ProgressBar.tsx`**: Shows a **progress bar**. This might be used if there's a calculation or process happening that takes a little time.

**Icons & Links (Visual Elements & Navigation):**

*   **`HelpIcon.tsx`**: Just displays a **question mark icon (?)**. Often used with `HelpLink`.
*   **`HelpLink.tsx`**: Probably combines the `HelpIcon` with a clickable link to provide **access to help documentation** or information.
*   **`LurkersIcon.tsx`**: Displays the **Evil Martians "Lurkers" logo**.
*   **`LurkersLink.tsx`**: Combines the `LurkersIcon` with a clickable link, likely **linking to the Evil Martians website** or related resources.
*   **`PictureIcon.tsx`**: Displays a generic **picture or image icon**. Might be used to indicate image fills.
*   **`SettingsIcon.tsx`**: Displays a **gear or settings icon (⚙️)**. Used inside the `SettingsButton`.
*   **`StopIcon.tsx`**: Displays a **stop icon (⏹️)**. Might be used for cancelling an action.
*   **`WarningIcon.tsx`**: Displays a **warning icon (⚠️)**. Used in the warning messages.

**Fancy Text Effects (Less Critical):**

*   **`RewardingAnimationBodyText.tsx`**
*   **`RewardingAnimationContentText.tsx`**
*   **`RewardingAnimationFluentText.tsx`**: These likely handle some kind of **animated or styled text display**, perhaps used for feedback or special messages, but aren't core to the color calculation itself.

In summary, you have components for:
*   Overall structure (`App`, `AppContent`)
*   Displaying selection details and colors (`Selection`, `SelectionContent`, `ColorPreview`, `ContrastSample`)
*   Controlling and adjusting colors (`ColorAdjustmentSliders`)
*   Showing status or messages (`EmptySelectionMessage`, `ProgressBar`, `WarningIcon`)
*   Settings and help (`SettingsButton`, `HelpLink`)
*   Basic visual elements (`...Icon`, `Tooltip`)
*   Theme management (`ThemeVariablesProvider`)
