# Specification: UI/UX & Design System

## 1. Theme Philosophy: "The Museum Artifact"
The UI must simulate a physical object—specifically the "Royal Game of Ur" artifact. The user is not interacting with an app; they are looking down at a wooden board with inlaid tiles.
* **Core Aesthetic**: Skeuomorphic, Tactile, Historical.
* **Vibe**: A dimly lit museum display case. High contrast between the board and the background.

## 2. Technical Stack & Styling Strategy
* **Framework**: React Native (Expo).
* **Styling**: NativeWind (Tailwind CSS) + `react-native-svg` for patterns.
* **Constraint**: NO layout resizing that breaks game logic. Visuals only.

## 3. Materials & Palette
Instead of flat colors, we define **Materials**. These should be implemented using background colors overlayed with noise textures or specific border treatments.

### A. The Case (Board Container)
* **Material**: Dark Lacquered Wood / Bitumen.
* **Color**: Deep Brown/Black (`bg-slate-900` or `#1a120b`).
* **Texture**: Subtle grain if possible, or high gloss finish.
* **Border**: Deep Amber (`border-amber-900`) to simulate the wood frame.

### B. The Tiles (Grid Cells)
* **Material 1: Ivory (The 'White' Squares)**
    * **Base**: Cream/Off-White (`bg-[#f3e5ab]`).
    * **Detail**: Subtle noise to look like bone/shell.
* **Material 2: Lapis Lazuli (The 'Blue' Squares)**
    * **Base**: Deep Royal Blue (`bg-[#1e3a8a]`).
    * **Detail**: Speckled noise to look like stone.
* **Material 3: Carnelian (Accents/Rosettes)**
    * **Base**: Deep Red (`#7f1d1d`) or Gold inlays.

## 4. Typography
* **Font Family**: *Cinzel* (Google Fonts) loaded via `expo-font`.
* **Fallback**: Serif.
* **Treatment**: Text should look engraved or like gold leaf on parchment (`text-amber-400` with `text-shadow`).

## 5. Component Design Specs

### The Board
* **Structure**: A rigid grid container styled to look like a physical box.
* **Depth**: Use layered borders to create 3D volume.
    * *Example*: `border-b-8 border-r-4 border-black/50` (simulates thickness).

### The Tiles
* **Shape**: Square, but with distinct "inset" borders to look like they are set *into* the wood.
* **Patterns**: strictly use SVGs for:
    * **Rosettes**: 8-pointed star/flower (The Safe Tile).
    * **Eyes**: 4 dots or "eye" motifs (Decoration).
    * **Dots**: 5-dot patterns (Decoration).

### The Pieces (Tokens)
* **Shape**: `rounded-full` (Circular).
* **Visuals**:
    * **Player 1**: Pearl/White (Radial gradient or light grey bevel).
    * **Player 2**: Onyx/Black (Deep grey bevel).
* **Physics**: Must have a drop shadow (`shadow-lg` + `elevation-5`) to show they are *sitting on top* of the board.

## 6. Interaction & Feedback
* **Valid Moves**: Do not just change the color. Add a "Glow" effect or a pulsing semi-transparent overlay (`bg-green-500/30`) to the valid destination tiles.
* **Selection**: When a piece is selected, lift it visually (increase shadow opacity and offset).
* **Dice**: Use 3D-styled tetrahedrons (triangles) if possible, or stylized coin flips.

## 7. Platform Specifics (React Native)
* **Shadows**:
    * **iOS**: Use `shadow-color`, `shadow-offset`, `shadow-opacity`, `shadow-radius`.
    * **Android**: Use `elevation`.
    * *Rule*: Always define BOTH for cross-platform depth.
* **Gradients**: Use `expo-linear-gradient` for metallic effects (Gold/Silver borders), do not rely on CSS `linear-gradient`.