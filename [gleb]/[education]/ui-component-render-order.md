graph TD
    subgraph Initial_Load
        A[index.tsx starts] --> B(App.tsx renders);
        B --> C(ThemeVariablesProvider provides styles);
        C --> D{AppContent.tsx decides based on selection};
    end

    subgraph "No Selection State"
        D -- Nothing Selected --> E[EmptySelectionMessage.tsx];
    end

    subgraph "Invalid Selection State"
        D -- Something Selected, but Invalid --> F{Check Why Invalid};
        F -- Background Invalid --> G[InvalidBackgroundSelectionMessage.tsx];
        F -- Blend Mode Invalid --> H[UnprocessedBlendModesSelectionMessage.tsx];
        G --> IconWarn1(WarningIcon.tsx);
        H --> IconWarn2(WarningIcon.tsx);
    end

    subgraph "Valid Selection State"
        D -- One or More Valid Pairs Selected --> I[SelectionsList.tsx];
        I -- Renders for EACH pair --> J(Selection.tsx);
        
        subgraph "Inside Each Selection.tsx"
            J --> K[SelectionContent.tsx];
            J --> L[ColorAdjustmentSliders.tsx];
            
            subgraph "Inside SelectionContent.tsx"
                K --> M[ColorIndicator.tsx];
                K --> N[ColorPreview / LayeredColorPreviewIcon];
                K --> O[ContrastSample.tsx];
                K -- Maybe --> P[TextMetrics.tsx];
                K -- Maybe --> Q[SegmentedFontStyleDefinition.tsx];
            end
        end
    end

    subgraph "Always Visible / Available Components"
        Z[SettingsButton.tsx / SettingsIcon.tsx];
        Y[HelpLink.tsx / HelpIcon.tsx];
        X[LurkersLink.tsx / LurkersIcon.tsx];
        W(Tooltip.tsx Logic);
    end
    
    %% Styling
    classDef decision fill:#ffcccb,stroke:#ff0000,stroke-width:2px;
    classDef state fill:#e1f5fe,stroke:#0288d1,stroke-width:1px;
    classDef component fill:#e8f5e9,stroke:#4caf50,stroke-width:1px;
    classDef container fill:#fff8e1,stroke:#ffa000,stroke-width:1px;
    classDef always fill:#f3e5f5,stroke:#8e24aa,stroke-width:1px;

    class D,F decision;
    class E,G,H state;
    class A,B,C,I,J,K,L,M,N,O,P,Q,Z,Y,X component;
    class Initial_Load, "No Selection State", "Invalid Selection State", "Valid Selection State", "Inside Each Selection.tsx", "Inside SelectionContent.tsx", "Always Visible / Available Components" container;
    class Z,Y,X,W always;