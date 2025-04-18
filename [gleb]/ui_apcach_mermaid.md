flowchart TB
    subgraph UI_Structure
        App --> AppContent
        AppContent --> Selection
        AppContent --> SelectionsList
        AppContent --> EmptySelectionMessage
        AppContent --> InvalidBackgroundSelectionMessage
        AppContent --> UnprocessedBlendModesSelectionMessage
        Selection --> SelectionContent
        Selection --> SegmentedFontStyleDefinition
        Selection --> ThemeVariablesProvider
        SelectionContent --> ColorIndicator
        SelectionContent --> ContrastSample
        SelectionContent --> ProgressBar
        SelectionContent --> TextMetrics
        SelectionContent --> Tooltip
    end

    subgraph APCACH_Usage
        generateUIColors --> transformFgColor
        generateUIColors --> transformBgColor
        generateUIColors --> getSecondaryColor
        
        transformFgColor -->|Uses| apcach
        transformFgColor -->|Uses| maxChroma
        transformFgColor -->|Uses| crTo
        transformFgColor -->|Uses| apcachToCss
        transformFgColor -->|Uses| apcachToCulori
        
        transformBgColor -->|Uses| apcach
        transformBgColor -->|Uses| maxChroma
        transformBgColor -->|Uses| crToFg
        transformBgColor -->|Uses| apcachToCss
        transformBgColor -->|Uses| apcachToCulori
        
        getSecondaryColor -->|Uses| apcach
        getSecondaryColor -->|Uses| maxChroma
        getSecondaryColor -->|Uses| crTo
        getSecondaryColor -->|Uses| apcachToCss
        getSecondaryColor -->|Uses| apcachToCulori
    end

    subgraph Data_Flow
        FigmaSelection[Figma Selection] -->|via Plugin API| FigmaSelectionProcessor
        FigmaSelectionProcessor -->|Updates Store| SelectedNodesStore[$selectedNodes Store]
        SelectedNodesStore -->|Provides Data to| AppContent
        AppContent -->|Renders| Selection
        Selection -->|Uses| generateUIColors
        generateUIColors -->|Returns| UIColors[UI Colors with Contrast Information]
        UIColors -->|Applied via| ThemeVariablesProvider
        ThemeVariablesProvider -->|Provides Theme to| SelectionContent
    end