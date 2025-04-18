
Okay, here's a Mermaid diagram illustrating how the UI components appear on the screen in this project, explained simply:

```mermaid
graph LR
    A[Figma Loads Plugin] --> B(HTML File in 'dist');
    B --> C{src/ui/index.tsx};
    C -- Runs --> D[Finds HTML Element (e.g., #root)];
    C -- Uses 'createRoot' --> E(Mounts Main App);
    E --> F[src/ui/components/App.tsx];
    F -- Renders --> G[Child Component 1 (e.g., SelectionList)];
    F -- Renders --> H[Child Component 2 (e.g., SettingsButton)];
    F -- Renders --> I[...] ;
    G -- May Render --> J[Smaller Component A];
    H -- May Render --> K[Smaller Component B];

    classDef entry fill:#cce5ff,stroke:#66a3ff,stroke-width:2px;
    classDef file fill:#e8f5e9,stroke:#4caf50,stroke-width:1px;
    classDef process fill:#fff8e1,stroke:#ffa000,stroke-width:1px;
    classDef component fill:#e1f5fe,stroke:#0288d1,stroke-width:1px;

    class A entry;
    class B,C,F,G,H,I,J,K file;
    class D,E process;
    class F,G,H,J,K component;

    style F fill:#b3e5fc,stroke:#01579b,stroke-width:2px; /* Highlight App.tsx */
    style C fill:#dcedc8,stroke:#558b2f,stroke-width:2px; /* Highlight index.tsx */
```

**Explanation for a Newbie:**

1.  **Figma Loads Plugin:** When you run the plugin in Figma, Figma first loads a basic HTML file (which was created during the build process and is in the `dist` folder).
2.  **HTML File:** This HTML file is simple, but it includes a reference to your main UI JavaScript code.
3.  **`src/ui/index.tsx` Runs:** The JavaScript linked in the HTML file starts running. This is your React entry point.
4.  **Finds HTML Element:** This script looks for a specific placeholder in the HTML (like `<div id="root"></div>`).
5.  **Mounts Main App:** It tells React, "Okay, start drawing the main part of our application (`App.tsx`) inside that placeholder."
6.  **`src/ui/components/App.tsx` Renders:** React now looks at the `App.tsx` component. This component is like the main blueprint.
7.  **Renders Child Components:** The `App.tsx` blueprint says, "Okay, inside me, I need to draw a `SelectionList`, a `SettingsButton`, and maybe other things." React then goes and renders each of those components.
8.  **Children May Render More:** Some of those child components (like `SelectionList`) might themselves contain *even smaller* components, and React draws those too, building the UI piece by piece like LEGOs.
