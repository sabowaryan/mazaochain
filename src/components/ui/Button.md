# Button Component

## Description

Composant Button réutilisable avec support pour les états de chargement, différentes variantes et tailles.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Style du bouton |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Taille du bouton |
| `loading` | `boolean` | `false` | Affiche un spinner et désactive le bouton |
| `asChild` | `boolean` | `false` | Rendu en tant qu'enfant (non implémenté) |
| `className` | `string` | - | Classes CSS additionnelles |
| `disabled` | `boolean` | `false` | Désactive le bouton |

## Variantes

### Default
```tsx
<Button>Bouton par défaut</Button>
```

### Destructive
```tsx
<Button variant="destructive">Supprimer</Button>
```

### Outline
```tsx
<Button variant="outline">Annuler</Button>
```

### Secondary
```tsx
<Button variant="secondary">Secondaire</Button>
```

### Ghost
```tsx
<Button variant="ghost">Ghost</Button>
```

### Link
```tsx
<Button variant="link">Lien</Button>
```

## Tailles

### Small
```tsx
<Button size="sm">Petit</Button>
```

### Default
```tsx
<Button size="default">Normal</Button>
```

### Large
```tsx
<Button size="lg">Grand</Button>
```

### Icon
```tsx
<Button size="icon">
  <IconComponent />
</Button>
```

## État de chargement

```tsx
<Button loading={isLoading}>
  {isLoading ? 'Chargement...' : 'Envoyer'}
</Button>
```

### Comportement avec loading
- Affiche un spinner à gauche du texte
- Désactive automatiquement le bouton
- Applique une opacité réduite
- Change le curseur en `not-allowed`

## Exemples d'utilisation

### Formulaire de connexion
```tsx
<Button 
  type="submit" 
  loading={isSubmitting}
  disabled={!isValid}
  className="w-full"
>
  {isSubmitting ? 'Connexion...' : 'Se connecter'}
</Button>
```

### Action destructive avec confirmation
```tsx
<Button 
  variant="destructive"
  loading={isDeleting}
  onClick={handleDelete}
>
  {isDeleting ? 'Suppression...' : 'Supprimer'}
</Button>
```

### Bouton d'action secondaire
```tsx
<Button 
  variant="outline"
  onClick={handleCancel}
  disabled={isProcessing}
>
  Annuler
</Button>
```

## Classes CSS

### Variantes
- `default`: `bg-primary-600 text-primary-foreground hover:bg-primary-700`
- `destructive`: `bg-error-600 text-error-foreground hover:bg-error-700`
- `outline`: `border border-border bg-background hover:bg-muted`
- `secondary`: `bg-secondary-100 text-secondary-900 hover:bg-secondary-200`
- `ghost`: `hover:bg-muted hover:text-muted-foreground`
- `link`: `text-primary-600 underline-offset-4 hover:underline`

### Tailles
- `default`: `h-10 px-4 py-2`
- `sm`: `h-9 rounded-md px-3`
- `lg`: `h-11 rounded-md px-8`
- `icon`: `h-10 w-10`

### États
- `loading`: `opacity-50 cursor-not-allowed`
- `disabled`: `pointer-events-none opacity-50`

## Accessibilité

- Support complet du clavier
- États focus visibles
- Attributs ARIA appropriés
- Désactivation correcte avec `disabled`

## Tests

Le composant est testé pour :
- ✅ Rendu correct
- ✅ États de chargement
- ✅ Variantes et tailles
- ✅ Désactivation
- ✅ Accessibilité

## Dépendances

- `LoadingSpinner` - Pour l'indicateur de chargement
- `cn` - Pour la gestion des classes CSS
- `React.forwardRef` - Pour la référence DOM