# Digital Inventory Management System - Design Guidelines

## Design Approach

**Selected Approach**: Design System (Utility-Focused)

**Primary References**: Linear (clean data presentation), Notion (intuitive forms), Asana (dashboard clarity)

**Rationale**: This is a data-heavy business tool requiring maximum efficiency, learnability, and consistency. Small store owners need professional functionality without complexity.

## Core Design Principles

1. **Clarity Over Decoration**: Every element serves a functional purpose
2. **Data Accessibility**: Information hierarchy guides users to critical data first
3. **Touch-Friendly**: All interactive elements sized for mobile use
4. **Scannable Layouts**: Quick visual parsing of stock levels, alerts, sales data

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for SKU, prices, quantities)

**Type Scale**:
- Page Titles: text-2xl md:text-3xl, font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base
- Labels/Meta: text-sm
- Table Data: text-sm, numbers in font-mono
- Alerts/Badges: text-xs font-medium uppercase tracking-wide

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4
- Form field spacing: space-y-4

**Grid System**:
- Dashboard: 1-column mobile, 2-3 column desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Inventory Table: Full-width responsive table with horizontal scroll on mobile
- Forms: Single column max-w-2xl centered

**Container Strategy**:
- Main content: max-w-7xl mx-auto px-4 md:px-6
- Forms/modals: max-w-lg to max-w-2xl
- Tables: Full container width with internal padding

## Component Library

### Navigation
- **Top Bar**: Sticky header with logo left, user profile/logout right, mobile hamburger menu
- **Side Navigation** (Desktop): Fixed sidebar width-64 with dashboard, inventory, sales, reports, settings sections
- **Mobile Navigation**: Bottom sheet drawer or slide-in menu

### Dashboard Components
- **Stats Cards**: Grid of 4 cards showing total items, low stock count, today's sales, inventory value
  - Include large number display (text-3xl font-bold font-mono)
  - Label beneath (text-sm)
  - Icon in corner (w-10 h-10)
  - Subtle border and hover state
  
- **Alert Panel**: Prominent warning section for low-stock items
  - List format with item name, current quantity, threshold
  - Icon indicators (Heroicons alert-triangle)
  - Quick action buttons to restock

- **Recent Sales Feed**: Scrollable list showing last 10 transactions
  - Timestamp, item, quantity, total (in font-mono)

### Inventory Management
- **Product Table**: 
  - Columns: Image thumbnail (w-12 h-12), Name, SKU, Category, Stock Qty, Cost, Price, Actions
  - Sticky header row
  - Alternating row backgrounds for readability
  - Mobile: Stack into cards with key data visible

- **Add/Edit Form**: 
  - Vertical form layout with clear labels above inputs
  - Input groups for related fields (Cost + Selling Price)
  - Number inputs with increment/decrement buttons for stock quantity
  - Category dropdown with search
  - Image upload placeholder with preview
  - Action buttons: Cancel (outline) + Save (solid) aligned right

### Sales Recording
- **Quick Sale Form**:
  - Search/select product dropdown with autocomplete
  - Quantity selector with stock availability shown
  - Auto-calculated total display (large, font-mono)
  - Date/time stamp (default: current)
  - Submit button full-width on mobile, inline on desktop

### Reports Section
- **Filter Bar**: 
  - Date range picker (Today/Week/Month/Custom)
  - Category filter dropdown
  - Export button (CSV/PDF)

- **Report Displays**:
  - Sales Chart: Simple bar chart for daily/weekly/monthly view
  - Summary Cards: Total sales, items sold, average transaction
  - Detailed Table: Sortable columns, pagination for large datasets

### Forms & Inputs
- Input height: h-10 to h-12 for easy touch targets
- Border radius: rounded-md for inputs, rounded-lg for cards
- Focus states: Distinct ring treatment
- Required fields: Asterisk in label
- Validation: Inline error messages in text-sm below input

### Buttons
- Primary: Solid fill, px-4 py-2, rounded-md
- Secondary: Outline style
- Danger: For delete actions
- Icon buttons: Square w-10 h-10 for table actions
- Mobile: Full-width buttons in forms

### Badges & Status Indicators
- Stock Status: "In Stock" (green), "Low Stock" (yellow), "Out of Stock" (red)
- Pill-shaped badges: px-2 py-1 rounded-full text-xs
- Dot indicators for dashboard alerts

### Modals & Overlays
- Delete confirmation: Centered modal max-w-md with warning icon
- Form modals: Slide-in from right on desktop, bottom sheet on mobile
- Backdrop: Semi-transparent overlay

## Accessibility
- All form inputs have associated labels
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Keyboard navigation support for tables and forms
- Touch targets minimum 44x44px
- Error messages announced to screen readers

## Icons
**Library**: Heroicons (via CDN)
**Usage**: 
- Navigation: w-5 h-5 inline with text
- Action buttons: w-4 h-4
- Status indicators: w-6 h-6
- Alert icons: w-8 h-8

Common icons: dashboard, shopping-cart, document-text, bell, chart-bar, cog, user-circle, plus, pencil, trash, arrow-down-tray

## Images
**No large hero image needed** - This is a business application, not a marketing site.

**Product Thumbnails**: 
- Square ratio (1:1)
- Size: 48x48px in tables, 96x96px in forms
- Placeholder: Gray background with camera icon for products without images
- Border radius: rounded-md

## Responsive Behavior
- **Mobile First**: Start with single-column layouts
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Tables**: Horizontal scroll on mobile or collapse to card view
- **Forms**: Full-width inputs on mobile, constrained on desktop
- **Navigation**: Hamburger menu mobile, sidebar desktop
- **Dashboard**: Stack cards vertically on mobile, grid on desktop

## Micro-interactions
**Minimal animations only**:
- Button hover: Subtle scale or opacity change
- Card hover: Slight shadow lift
- Loading states: Simple spinner for data fetch
- Success feedback: Brief check icon animation after save
- No page transitions or scroll effects