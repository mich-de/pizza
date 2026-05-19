# Implementation Plan: Hero & Dashboard Redesign

## Goal
Implement the hero section and dashboard stats exactly as shown in the new reference image. This design perfectly integrates with the existing warm/earthy color palette of PizzaRadar, utilizing a beautiful background of the Sorrento Marina, a floating summary bar with a 3D pizza effect, and refined stat cards.

## Proposed Changes

### 1. Typography & Assets (`src/index.css` & `index.html`)
- **New Font**: Import a cursive/script font from Google Fonts (e.g., `Dancing Script`, `Pacifico`, or `Great Vibes`) to recreate the large "Radar Pizza Sorrento" text in the hero.
- **Hero Background**: Generate or add a high-quality daytime image of the Sorrento Marina.
- **Floating Pizza Asset**: Generate or add a realistic, transparent PNG of a Margherita pizza to place on the floating summary bar.

### 2. Hero Section (`src/pages/Dashboard.jsx`)
- **Background Container**: Set the hero section to a fixed height (e.g., `h-[500px]`) with the Sorrento Marina background image (`bg-cover bg-center`).
- **Top Elements**:
  - **Left**: The title "Radar Pizza Sorrento" using the new cursive font, styled with white text and a soft drop shadow. Below it, the subtitle "Monitoraggio Prezzi Margherita Penisola Sorrentina.".
  - **Right**: Position the `logo_ita_transparent.png` logo prominently.
- **Floating Summary Bar**:
  - A horizontal bar positioned at the bottom edge of the hero image (`absolute -bottom-8 w-full`).
  - Off-white/cream background (`bg-[#FDFBF7]`) with rounded corners and a soft shadow.
  - Contains inline stats (Total Pizzerias, Cities, Price Range, Avg Price) separated by vertical dividers.
  - **3D Pizza Overlay**: An absolute-positioned realistic pizza image overlapping the right edge of the floating bar.

### 3. Stat Cards Redesign (`src/components/ui/StatCard.jsx` or inline in `Dashboard.jsx`)
- Redesign the 4 main stat cards to match the reference image:
  - **Background**: Warm beige/cream (`bg-[#F6F1EA]` or similar).
  - **Border**: Thin earthy border (`border border-[#D6CDC2]`).
  - **Typography**: Labels in small uppercase copper text, values in large dark brown serif font (`font-display`).
  - **Icons**: Minimalist, matching the earthy tones, positioned on the right.
  - **Subtext**: Add the "Miglior Prezzo: [Name]" directly inside the 4th card.

## Verification Plan
1. **Visual Match**: Compare the rendered dashboard side-by-side with the reference image to ensure font pairings, card proportions, and the floating pizza overlap look identical.
2. **Responsiveness**: Ensure the cursive title scales down on mobile, and the floating summary bar gracefully wraps its content without breaking the 3D pizza effect.
