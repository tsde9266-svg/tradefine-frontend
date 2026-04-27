---
name: Industrial Premium
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#584237'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a2f4'
  on-tertiary-container: '#003554'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display:
    fontFamily: Inter
    fontSize: 42px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.3'
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  h4:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  gutter: 12px
  section-gap: 32px
  component-padding: 16px
  grid-column-3: 1fr 1fr 1fr
---

## Brand & Style

The design system is built on the intersection of industrial reliability and premium digital craftsmanship. It targets homeowners and professional tradespeople who value efficiency and high-standard workmanship. The aesthetic is rooted in **Minimalism** with a **Corporate/Modern** execution, prioritizing clarity over decoration. 

The emotional response should be one of immediate trust and stability. This is achieved through high-contrast typography, a restrained color palette, and a sophisticated use of depth through shadows rather than borders. The interface feels substantial yet agile, mimicking the precision of professional tools.

## Colors

The color palette is designed for maximum functional contrast. **Primary Orange (#F97316)** is reserved strictly for action-oriented elements, such as buttons, active states, and critical interactive paths. **Near-black (#111827)** provides a heavy typographic anchor for headings, ensuring readability and authority. 

Supporting text utilizes **Mid-grey (#6B7280)** to maintain a clear hierarchy without cluttering the visual field. Layouts are built on layered neutrals: **Off-white (#F9FAFB)** serves as the base screen canvas, while **Light-grey (#F3F4F6)** is used for subtle section backgrounds and **White (#FFFFFF)** is reserved for elevated card elements to create a sense of physical layering.

## Typography

Typography in this design system emphasizes structure and scale. The system utilizes **Inter** for its neutral, technical clarity that echoes the precision of blueprints. 

**Display styles** are aggressive and heavy (800 weight) to create impactful landing moments. **Headlines** (H1-H4) provide a clear downward scale of importance using 700 and 600 weights. The **Body** text is optimized at 15px for the compact nature of iOS devices, ensuring high information density without sacrificing legibility. A specialized **Label-caps** style is used for metric headers to provide a distinct architectural feel.

## Layout & Spacing

This design system follows an **8px grid system** tailored for iOS 17. The layout utilizes a **Fixed Margin** model of 20px on the left and right edges of the screen to ensure content remains clear of the hardware's curved corners. 

Content is organized into distinct vertical modules with 32px spacing between sections. Metric data utilizes a **3-column grid** to allow for quick scanning of key performance indicators. Horizontal padding within cards and interactive elements is set to a consistent 16px to maintain internal breathing room.

## Elevation & Depth

Depth is conveyed through **Ambient Shadows** rather than borders or lines, following a "no-border" philosophy for cards and containers. Shadows should be extra-diffused and low-opacity, using a slight tint of the Near-black color to maintain a natural look.

The system uses three distinct levels of elevation:
1.  **Level 0 (Base):** Off-white background.
2.  **Level 1 (Card):** White surfaces with a soft, expansive shadow (Y: 4, Blur: 20, Opacity: 0.05).
3.  **Level 2 (Interactive/Floating):** The Floating Nav Bar and active Bottom Sheets use a more pronounced shadow (Y: 8, Blur: 24, Opacity: 0.1) to signify they are positioned above the primary content layer.

## Shapes

The shape language is characterized by **Rounded** geometry that softens the heavy industrial typography. Standard UI elements (cards, input fields) use a 0.5rem (8px) base radius.

Specific exceptions are made for signature components:
- **Floating Nav Bar:** Uses a specific 12px radius to balance its 56px height.
- **Bottom Sheets:** Utilize a generous 20px top radius to create a soft, approachable transition from the bottom of the screen.
- **Pills:** Badges and secondary buttons are fully rounded (pill-shaped) to distinguish them from primary block actions.

## Components

### Floating Nav Bar
A signature element height of 56px. It must be White (#FFFFFF) with a Level 2 shadow. It sits detached from the screen edges with 12px corner radii. Icons are inline SVGs with 2pt stroke weight.

### Metric Cards
Arranged in a 3-column grid. They feature a `label-caps` Mid-grey header at the top and a large, bold (H2 or H3) Near-black number in the center. No borders; depth is provided by the Level 1 shadow.

### Pills
Used for status badges (e.g., "Verified," "Available") and filtering toggles. They use a light background color (Light-grey) with Mid-grey text, or Primary Orange with White text for active states.

### Bottom Sheets
Triggered for complex filtering or trade details. They feature a 20px top radius and a subtle "grabber" bar (36x4px, Mid-grey at 20% opacity).

### Bottom Tab Bar
A standard iOS-style tab bar at 83px height. It should use a translucent blur effect (Material Thin) to allow background content to peek through, ensuring the "Floating" Nav Bar above it remains the primary focal point.

### Buttons & Inputs
Primary buttons are block-width with the Primary Orange background and White text. Input fields use the Light-grey background with no border, using Mid-grey for placeholder text. All icons must be rendered as inline SVGs for crispness.

### Photography
All imagery must be AI-generated, focusing on clean, professional tradespeople in well-lit, modern environments. Use a subtle linear gradient overlay (Near-black at 0% to 40% opacity) on photos where text needs to be overlaid.