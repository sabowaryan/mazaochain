# Composant Logo MazaoChain

Le composant Logo est un composant React adaptatif qui affiche le logo MazaoChain dans différents contextes et tailles.

## Design

Le logo combine :
- **Feuille verte** : Représente l'agriculture et la durabilité
- **Graphique en barres avec flèche** : Symbolise la croissance et les données financières
- **Cercle de liaison** : Unit les deux éléments, représentant l'écosystème connecté
- **Couleurs** : Vert (#22c55e) pour l'agriculture, Orange (#f97316) pour la croissance

## Utilisation

### Composant principal
```tsx
import { Logo } from '@/components/ui/Logo';

// Logo complet avec icône et texte
<Logo variant="full" size="md" />

// Icône seulement
<Logo variant="icon" size="sm" />

// Texte seulement
<Logo variant="text" size="lg" />

// Utiliser le SVG inline au lieu de l'image
<Logo variant="icon" size="md" useImage={false} />

// Schémas de couleurs
<Logo variant="full" size="md" colorScheme="default" />
<Logo variant="full" size="md" colorScheme="monochrome" />
<Logo variant="full" size="md" colorScheme="inverse" />
```

### Composants spécialisés

#### Navigation mobile
```tsx
import { MobileLogo } from '@/components/ui/Logo';
<MobileLogo />
```

#### Navigation desktop
```tsx
import { DesktopLogo } from '@/components/ui/Logo';
<DesktopLogo />
```

#### Navigation responsive
```tsx
import { NavbarLogo } from '@/components/ui/Logo';
<NavbarLogo />
```

#### Sidebar avec état collapsed
```tsx
import { SidebarLogo } from '@/components/ui/Logo';
<SidebarLogo collapsed={false} />
```

#### Pages d'authentification
```tsx
import { AuthLogo } from '@/components/ui/Logo';
<AuthLogo />
```

## Props

### Logo (composant principal)

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `'full' \| 'icon' \| 'text'` | `'full'` | Type d'affichage du logo |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Taille du logo |
| `className` | `string` | - | Classes CSS additionnelles |
| `showText` | `boolean` | `true` | Afficher le texte (pour variant='full') |
| `useImage` | `boolean` | `true` | Utiliser l'image SVG ou le SVG inline |
| `colorScheme` | `'default' \| 'monochrome' \| 'inverse'` | `'default'` | Schéma de couleurs du logo |

## Tailles

- **xs**: 24px (h-6 w-6)
- **sm**: 32px (h-8 w-8)
- **md**: 40px (h-10 w-10)
- **lg**: 48px (h-12 w-12)
- **xl**: 64px (h-16 w-16)

## Schémas de couleurs

- **default**: Vert primaire + Orange secondaire (couleurs MazaoChain)
- **monochrome**: Utilise les couleurs de texte du thème (foreground/muted)
- **inverse**: Inverse les couleurs (Orange + Vert)

### Couleurs utilisées
- **Vert (Primary)**: `--color-primary-500`, `--color-primary-600`, `--color-primary-400`
- **Orange (Secondary)**: `--color-secondary-500`, `--color-secondary-600`
- **Thème**: `--color-foreground`, `--color-muted-foreground`

## Fichiers associés

- `/public/logo.svg` - Logo SVG principal
- `/public/favicon.ico` - Favicon ICO
- `/public/favicon-16x16.png` - Favicon 16x16
- `/public/favicon-32x32.png` - Favicon 32x32
- `/public/apple-touch-icon.png` - Icône Apple Touch
- `/public/android-chrome-192x192.png` - Icône Android 192x192
- `/public/android-chrome-512x512.png` - Icône Android 512x512
- `/public/site.webmanifest` - Manifest PWA
- `/public/manifest.json` - Configuration PWA (legacy)

## Exemples d'utilisation par contexte

### Header/Navigation
```tsx
// Responsive - icône sur mobile, logo complet sur desktop
<NavbarLogo />
```

### Sidebar
```tsx
// S'adapte selon l'état collapsed
<SidebarLogo collapsed={sidebarCollapsed} />
```

### Pages d'auth
```tsx
// Logo large pour les pages de connexion/inscription
<AuthLogo />
```

### Mobile
```tsx
// Icône compacte pour mobile
<MobileLogo />
```

### Footer
```tsx
// Logo moyen avec texte
<Logo variant="full" size="sm" />
```