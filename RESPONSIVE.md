# Responsive Design Documentation

This document describes the responsive design system and layout behavior across viewports for the Leafy Luxe (The Nursery Pakistan) e-commerce site.

## Breakpoints

The site uses Tailwind CSS default breakpoints:

| Breakpoint | Min Width | Typical Use |
|------------|-----------|-------------|
| Default    | 0px       | Mobile phones |
| sm         | 640px     | Large phones, small tablets |
| md         | 768px     | Tablets |
| lg         | 1024px    | Small laptops, large tablets |
| xl         | 1280px    | Desktops |
| 2xl        | 1400px    | Large desktops (custom) |

**Container padding:** 1rem on mobile (default), 2rem from `md` and up. Configured in `tailwind.config.ts`.

## Layout Behavior by Viewport

### Product Grids

| Viewport | Columns | Image Height | Gap |
|----------|---------|--------------|-----|
| Mobile (< 640px) | 2 | 160px (h-40) | 12px |
| Small (≥ 640px) | 2 | 208px (h-52) | 16px |
| Large (≥ 1024px) | 3–4 | 256px (h-64) | 24px |

Product cards use smaller typography on mobile: `text-base` for titles, `text-sm` for descriptions, `text-base` for prices. Card padding is `p-3` on mobile, `p-4` on larger screens.

### Navbar

| Viewport | Behavior |
|----------|----------|
| < md     | Hamburger menu; search bar below logo; categories in collapsible dropdown; Account, Admin, Logout in mobile menu for logged-in users |
| ≥ md     | Full horizontal nav with search bar; categories visible; Account/Admin/Logout as icon buttons |

### Footer

| Viewport | Layout |
|----------|--------|
| Mobile   | Single column; newsletter input and Subscribe button stack vertically |
| md       | 2 columns |
| lg       | 4 columns (About, Quick Links, Categories, Newsletter) |

### Cart & Checkout

- **Cart items:** Stack vertically on mobile (`flex-col`), horizontal on `sm+`. Image size `w-20 h-20` on mobile, `w-24 h-24` on larger screens.
- **Order summary:** Sticky only on `lg+`; full width on mobile.
- **Checkout form:** Single column on mobile; email/phone in 2 columns from `md` up.

## Component-Specific Rules

| Component | Mobile | Tablet (sm/md) | Desktop (lg+) |
|-----------|--------|----------------|---------------|
| FeaturedProducts | 2 cols, compact cards | 2 cols | 4 cols |
| CategoryPage | 2 cols, scrollable filters | 2 cols | 3–4 cols |
| ProductsPage | 2 cols, scrollable filters | 2 cols | 3–4 cols |
| SearchPage | 2 cols | 2 cols | 3–4 cols |
| HomeSaleSection | 2 cols | 2 cols | 3 cols |
| ProductDetailDialog | Full-width minus padding, stacked layout | Same | Side-by-side image + content |
| Hero | Stats gap-4, smaller text | Stats gap-8 | Full layout |
| Collections | Stacked cards, p-6 | p-8 | 3 cols |
| ProductPage | Stacked, gap-6 | gap-12 | Side-by-side |

## Testing Notes

### Recommended Viewports

- **320px** – Minimum mobile width (iPhone SE)
- **375px** – Common phone width (iPhone 12/13/14)
- **414px** – Larger phone (iPhone Plus/Max)
- **768px** – Tablet portrait
- **1024px** – Tablet landscape / small laptop
- **1280px+** – Desktop

### Key User Flows to Test

1. **Home → Products → Product Detail → Cart → Checkout** – Ensure all steps are usable on small screens.
2. **Category browsing** – Filter bars should scroll horizontally on narrow screens.
3. **Product quick-view** – ProductDetailDialog should fit within viewport on mobile.
4. **Account access** – Logged-in users can access Account, Admin, Logout from mobile menu.

### Tools

- Chrome DevTools Responsive Mode (Device Toolbar)
- Firefox Responsive Design Mode
- Real device testing on iOS Safari and Android Chrome recommended for touch targets and scroll behavior

## Known Considerations

- **Filter bars:** Price and category filter buttons use horizontal scroll (`overflow-x-auto`) on very small screens to prevent awkward wrapping.
- **ProductDetailDialog:** Max width constrained to `calc(100vw - 2rem)` on mobile to prevent horizontal overflow.
- **Sticky elements:** Order summary on Cart and Checkout is sticky only from `lg` breakpoint; on smaller screens it appears in normal flow below the main content.
