# ApplyMate UI Refactoring - Design System

## Overview
Refactored the ApplyMate frontend to the **Third Eye** design system - a cinematic, agentic-flow experience inspired by Superdesign, Unsection, and Mosey.

## Date
February 2026

## Current Design System: Third Eye

### Core Tenants
- **OLED Black Foundation**: #080808 background for premium feel
- **Yellow Accent**: #FACC15 for actions, success states, and highlights  
- **Technical Blueprint**: 1px borders to create schematic-like divisions
- **Noise Texture**: Subtle grain overlay for film depth
- **Agentic Flow**: Connected nodes showing AI workflow

---

## Changes Made

### 1. Global Theme (globals.css)

```css
:root {
  /* Third Eye Palette */
  --background: #080808;
  --foreground: #E4E2DD;
  --accent: #FACC15;
  --accent-foreground: #080808;
  --muted: #1A1A1A;
  --muted-foreground: #6B6B6B;
  --border: rgba(255, 255, 255, 0.1);
  
  /* Typography */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Key Changes:**
- Background: OLED Black (#080808)
- Text: Off-white (#E4E2DD)
- Accent: Yellow (#FACC15)
- Added noise texture overlay (2% opacity)
- Section dividers: 1px borders (technical blueprint style)

---

### 2. Layout (app/layout.tsx)

- Added Space Grotesk font via Fontshare
- Updated Clerk theme colors to match Third Eye
- Applied global OLED black background

---

### 3. Components Created

| Component | File | Purpose |
|-----------|------|---------|
| **Kinetic Hero** | `components/kinetic-hero.tsx` | Staggered text reveal + job URL input |
| **Global Wire** | `components/global-wire.tsx` | Scroll-linked SVG path animation |
| **Agent Workflow** | `components/agent-workflow.tsx` | Animated node pipeline |
| **Shiny Button** | `components/ui/shiny-button.tsx` | Gradient animated button |
| **Animated List** | `components/ui/animated-list.tsx` | Staggered list animations |

---

### 4. Kinetic Hero (components/kinetic-hero.tsx)

**Features:**
- Staggered character-reveal animation for headline ("Apply Smarter Faster.")
- Glassmorphism input box with pulse effect on URL paste
- Quick stats (50K+ applications, 92% interview rate)
- **Right side**: Agent workflow animation showing pipeline

**Grid Layout:**
- Desktop (lg): 2-column layout (text left, animation right)
- Mobile: Single column with animation hidden

---

### 5. Agent Workflow Animation (components/agent-workflow.tsx)

**Node Pipeline:**
```
Job URL → AI Analyze → Tailor Resume → Auto Apply → Landed!
```

**Features:**
- Animated SVG nodes with glowing effects
- Progress lines that animate between nodes
- Pulsing indicator on active node
- Status text that updates per step
- Cycles through every 2 seconds

---

### 6. Global Wire (components/global-wire.tsx)

**Features:**
- Fixed SVG path on left side of viewport
- Yellow gradient wire (#FACC15)
- Scroll-linked animation (pathLength)
- Fades in/out based on scroll position

---

### 7. Shiny Button (components/ui/shiny-button.tsx)

**Variants:**
- `default`: Black with animated gradient
- `yellow`: Yellow background with animated highlight

**Animation:**
- CSS @property for gradient angle animation
- Hover state increases gradient percentage
- Shimmer effect on hover

---

### 8. Animated List (components/ui/animated-list.tsx)

**Components:**
- `AnimatedList`: Container with AnimatePresence
- `AnimatedListItem`: Staggered fade-in animation
- `ApplicationItem`: Application status card with:
  - Status indicator (colored dot with optional ping)
  - Title and company
  - Match score
  - Status badge

---

### 9. Pages Updated

#### Landing Page (app/page.tsx)
- New hero with kinetic text animation
- Agent workflow animation on right (desktop)
- Bento grid features section
- Workflow steps section
- CTA with Shiny Button
- Footer with minimal styling

#### Navbar (components/navbar.tsx)
- Updated to Third Eye colors
- Yellow accent on active states
- Credits indicator with yellow dot

#### Dashboard (app/dashboard/page.tsx)
- Fixed hardcoded localhost API URL → uses env var
- Now shows landing page instead of auto-redirect

---

## Design System Summary

| Element | Value |
|---------|-------|
| Background | #080808 (OLED Black) |
| Text | #E4E2DD (Off-white) |
| Accent | #FACC15 (Yellow) |
| Muted | #6B6B6B |
| Border | 1px white/10 |
| Font Display | Space Grotesk |
| Font Mono | JetBrains Mono |

---

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `frontend/app/globals.css` | Modified | Third Eye theme tokens |
| `frontend/app/layout.tsx` | Modified | Fonts, Clerk theme |
| `frontend/app/page.tsx` | Modified | New landing page |
| `frontend/components/kinetic-hero.tsx` | Created | Hero with animation |
| `frontend/components/global-wire.tsx` | Created | Scroll wire |
| `frontend/components/agent-workflow.tsx` | Created | Pipeline animation |
| `frontend/components/navbar.tsx` | Modified | Third Eye colors |
| `frontend/components/ui/shiny-button.tsx` | Created | Animated button |
| `frontend/components/ui/animated-list.tsx` | Created | List animations |
| `frontend/app/dashboard/page.tsx` | Modified | Fix API URL |

---

## Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Build Status
✅ `npm run build` passes successfully

---

## Previous Design (Hyper-Saturated Fluid)

The previous design system used:
- Cyber Yellow (#FDE047) as primary
- Inter font
- Liquid/wave section dividers
- Larger border radii (32px+)

This has been superseded by Third Eye.

---

## Next Steps
- [ ] Update dashboard with Bento Grid and Animated List
- [ ] Add more 21st.dev components
- [ ] Update Applications/Jobs/Credits pages
- [ ] Add error boundaries
- [ ] Add Suspense loading states
