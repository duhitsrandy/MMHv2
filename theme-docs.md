# Theme System Documentation

## Overview
The Meet Me Halfway application implements a comprehensive theme system that supports both light and dark modes, with automatic system preference detection. The theme system is integrated with Clerk's appearance settings and uses shadcn/ui components for consistent styling.

## Implementation Details

### 1. Theme Provider (`components/providers/theme-provider.tsx`)

#### Provider Setup
```typescript
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
```

#### Environment Variables
```env
# Theme Configuration
NEXT_THEME_ATTRIBUTE=class
NEXT_THEME_DEFAULT=system
NEXT_THEME_ENABLE_SYSTEM=true
```

### 2. Theme Integration with Clerk

#### Auth Provider Integration
```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  const { theme } = useTheme()

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        elements: {
          formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
          footerActionLink: "text-primary hover:text-primary/90",
          card: "shadow-none",
        },
      }}
      // ... other props
    >
      {children}
    </ClerkProvider>
  )
}
```

### 3. Theme Configuration

#### Theme Types
```typescript
export type Theme = "light" | "dark" | "system"

export const themes: Theme[] = ["light", "dark", "system"]
```

#### Theme Storage
- Theme preference is stored in localStorage
- System preference is detected using `prefers-color-scheme`
- Changes are synchronized across tabs

### 4. Usage Examples

#### Theme Toggle Component
```typescript
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

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

### 5. Theme Variables

#### CSS Variables
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
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
   - Ensure sufficient contrast
   - Support system preferences
   - Provide theme toggle

### 7. Integration Points

1. **Authentication**
   - Clerk appearance settings
   - Auth form styling
   - Session management

2. **UI Components**
   - shadcn/ui integration
   - Custom component styling
   - Icon variants

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

This documentation provides a comprehensive guide to the theme system in the Meet Me Halfway application. 