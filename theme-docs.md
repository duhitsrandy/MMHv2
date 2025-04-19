# Theme System Documentation

## Overview
The Meet Me Halfway application implements a comprehensive theme system that supports both light and dark modes, with automatic system preference detection. The theme system is integrated with Clerk's appearance settings, uses shadcn/ui components for consistent styling, and is configured via Tailwind CSS.

## Theme Setup Checklist (From Scratch)
1. Install and configure `next-themes` for theme context
2. Set up Tailwind CSS with custom color variables for light/dark modes
3. Integrate shadcn/ui components for consistent UI
4. Wrap your app with the `ThemeProvider` (see below)
5. Integrate theme with Clerk (see [auth-docs.md](auth-docs.md))
6. Add a theme toggle component to your UI
7. Test theme switching and persistence across reloads

## Environment Variables
```env
# Theme Configuration (optional, for advanced setups)
NEXT_THEME_ATTRIBUTE=class
NEXT_THEME_DEFAULT=system
NEXT_THEME_ENABLE_SYSTEM=true
```

## Real-World Usage Examples

### Theme Toggle Component
```typescript
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  return (
    <Button onClick={() => setTheme("dark")}>Dark</Button>
    // Add more UI for light/system as needed
  )
}
```

### Theme-Aware Custom Component
```typescript
import { useTheme } from "next-themes"

export function ThemedBox() {
  const { theme } = useTheme()
  return (
    <div className={theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}>
      This box changes with the theme!
    </div>
  )
}
```

### Clerk Integration Example
See [auth-docs.md](auth-docs.md) for how to pass the current theme to Clerk's `ClerkProvider` for consistent auth UI theming.

## Troubleshooting Theme Issues
- **Dark mode not working:**
  - Ensure `ThemeProvider` wraps your app and `attribute="class"` is set
  - Check Tailwind config for `darkMode: ["class"]`
  - Verify CSS variables are set for both `:root` and `.dark`
- **Theme not persisting:**
  - Make sure `next-themes` is installed and configured
  - Check for localStorage errors in the browser console
- **Theme toggle not updating UI:**
  - Ensure you are using the `useTheme` hook from `next-themes`
  - Check for React hydration mismatches (see Next.js docs)
- **Clerk auth UI not matching app theme:**
  - Pass the current theme to `ClerkProvider` as shown in [auth-docs.md](auth-docs.md)

## Cross-References
- [App Structure](app-structure.md)
- [Authentication](auth-docs.md)
- [Production Checklist](PRODUCTION.md)

## Tailwind & CSS Variables
// ... (existing Tailwind and CSS variable documentation remains unchanged) ...

## Implementation Details

### 1. Theme Provider (`components/providers/theme-provider.tsx`)

The core theme switching logic is handled by `next-themes`. The `ThemeProvider` wraps the application and provides the necessary context.

#### Provider Setup
```typescript
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props} // Pass any additional props
    >
      {children}
    </NextThemesProvider>
  )
}
```
*Note: The component shown is a simplified example. The actual implementation might have additional props or logic.*

### 2. Theme Configuration

#### Theme Types
```typescript
// Defined implicitly by next-themes usage
export type Theme = "light" | "dark" | "system"
```

#### Theme Storage
- Theme preference is stored in `localStorage` (handled by `next-themes`).
- System preference is detected using `prefers-color-scheme` media query (handled by `next-themes`).
- Changes are synchronized across tabs/windows (handled by `next-themes`).

### 3. Usage Examples

#### Theme-Aware Component
```typescript
import { useTheme } from "next-themes"

export function ThemeAwareComponent() {
  const { theme } = useTheme()
  
  return (
    <div className={cn(
      "bg-background text-foreground",
      theme === "dark" ? "dark-specific-styles" : "light-specific-styles"
    )}>
      {/* Component content */}
    </div>
  )
}
```

### 4. Theme Variables and Styling

#### CSS Variables (`app/globals.css`)
Tailwind CSS is configured to use CSS variables for theming. These variables define the color palette for both light and dark modes.

```css
/* Example from app/globals.css (Values may differ slightly) */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;
    --primary: 220.9 39.3% 11%;
    --primary-foreground: 210 20% 98%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 220.9 39.3% 11%;
    --radius: 0.5rem;
    /* Chart Colors */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    /* Sidebar Colors */
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 224 71.4% 4.1%;
    --sidebar-primary: 220.9 39.3% 11%;
    --sidebar-primary-foreground: 210 20% 98%;
    --sidebar-accent: 220 14.3% 95.9%;
    --sidebar-accent-foreground: 220.9 39.3% 11%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 220.9 39.3% 11%;
  }

  .dark {
    /* Example Dark Theme Values (Stone-based) */
    --background: 240 5.9% 10%;
    --foreground: 210 40% 98%;
    --card: 240 5.9% 10%;
    --card-foreground: 210 40% 98%;
    --popover: 240 5.9% 10%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 4.8% 14.9%;
    --secondary-foreground: 210 40% 98%;
    --muted: 240 4.8% 14.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 4.8% 14.9%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 240 4.8% 14.9%;
    --input: 240 4.8% 14.9%;
    --ring: 240 5% 64.9%;
    /* Dark Chart Colors */
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    /* Dark Sidebar Colors */
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-primary: 210 40% 98%;
    --sidebar-primary-foreground: 240 5.9% 10%;
    --sidebar-accent: 240 4.8% 14.9%;
    --sidebar-accent-foreground: 210 40% 98%;
    --sidebar-border: 240 4.8% 14.9%;
    --sidebar-ring: 240 5% 64.9%;
  }
}
```

#### Tailwind Configuration (`tailwind.config.ts`)
The `tailwind.config.ts` file extends the default theme with custom colors, radii, animations, and plugins.

```typescript
// Snippet from tailwind.config.ts
const config = {
  darkMode: ["class"],
  content: [ /* ... paths ... */ ],
  prefix: "",
  theme: {
    container: { /* ... */ },
    extend: {
      colors: {
        // References CSS variables like hsl(var(--border))
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // ... other base colors ...
        sidebar: { // Custom sidebar color set
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      keyframes: {
        "accordion-down": { /* ... */ },
        "accordion-up": { /* ... */ },
        "gradient": { /* ... */ }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient": "gradient 8s linear infinite"
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"), // Adds animation utilities
    require("@tailwindcss/typography") // Adds `prose` classes for typography styling
  ]
}
```

### 6. Best Practices

1. **Component Styling**
   - Use CSS variables for colors
   - Implement dark mode variants
   - Test both themes thoroughly

2. **Performance**
   - Minimize theme transitions
   - Use CSS variables for smooth switching
   - Avoid flash of incorrect theme

3. **Accessibility**
   - Ensure sufficient contrast ratios for text and UI elements in both themes.
   - Respect user's system preference (`enableSystem` in `ThemeProvider`).
   - Provide an explicit theme toggle mechanism.

### 7. Integration Points

1. **Authentication**
   - Clerk appearance settings
   - Auth form styling
   - Session management

2. **UI Components**
   - Consistent styling via `shadcn/ui` and Tailwind utility classes.
   - Custom component styling should use theme variables.
   - Icons should adapt (e.g., `Sun`/`Moon` in `ThemeToggle`).
   - Markdown/rich text content can be styled using the `prose` classes provided by `@tailwindcss/typography`.

3. **Map Integration**
   - Map theme switching
   - Marker visibility
   - Route colors

### 8. Troubleshooting

Common issues and solutions:
1. **Theme Flash**
   - Use `disableTransitionOnChange`
   - Implement proper loading states
   - Check script loading order

2. **Inconsistent Styling**
   - Verify CSS variable usage
   - Check component variants
   - Test in both themes

3. **Performance Issues**
   - Optimize theme transitions
   - Reduce re-renders
   - Use proper caching

This documentation provides a comprehensive guide to the theme system in the Meet Me Halfway application, focusing on the integration of `next-themes`, Tailwind CSS, and shadcn/ui components. 