# Composants UI Modernes pour les Pages Farmer

Ce document décrit les nouveaux composants UI créés pour améliorer le design des pages farmer avec un style moderne, élégant et responsive.

## Composants Disponibles

### 1. StatCard
Composant pour afficher des statistiques avec des icônes et des gradients colorés.

```tsx
import { StatCard } from '@/components/ui/StatCard';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';

<StatCard
  title="Évaluations approuvées"
  value={12}
  subtitle="Cultures validées"
  icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
  accentIcon={<SparklesIcon className="w-5 h-5" />}
  gradient="emerald"
  onClick={() => console.log('Clicked')}
/>
```

**Props:**
- `title`: Titre de la statistique
- `value`: Valeur (string ou number)
- `subtitle`: Sous-titre optionnel
- `icon`: Icône principale (React.ReactNode)
- `accentIcon`: Icône d'accent optionnelle
- `gradient`: Couleur du gradient ('emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'indigo')
- `onClick`: Fonction de clic optionnelle

### 2. ModernPageHeader
En-tête moderne avec icône, titre, sous-titre et actions.

```tsx
import { ModernPageHeader } from '@/components/ui/ModernPageHeader';
import { UserIcon, CogIcon } from '@heroicons/react/24/outline';

<ModernPageHeader
  title="Mon profil agriculteur"
  subtitle="Gérez vos informations personnelles et professionnelles"
  icon={<UserIcon />}
  subtitleIcon={<CogIcon />}
  gradient="emerald"
  actions={<Button>Action</Button>}
  showDate={true}
/>
```

**Props:**
- `title`: Titre principal
- `subtitle`: Sous-titre
- `icon`: Icône principale
- `subtitleIcon`: Icône du sous-titre (optionnelle)
- `gradient`: Couleur du gradient
- `actions`: Éléments d'action (boutons, etc.)
- `showDate`: Afficher la date (défaut: true)

### 3. InfoCard
Carte d'information avec label et valeur.

```tsx
import { InfoCard } from '@/components/ui/InfoCard';
import { UserIcon } from '@heroicons/react/24/outline';

<InfoCard
  label="Nom complet"
  value="Jean Dupont"
  icon={<UserIcon />}
/>
```

**Props:**
- `label`: Label de l'information
- `value`: Valeur à afficher
- `icon`: Icône optionnelle

### 4. ActionButton
Bouton d'action avec icône et effet hover coloré.

```tsx
import { ActionButton } from '@/components/ui/ActionButton';
import { PlusIcon } from '@heroicons/react/24/outline';

<ActionButton
  label="Nouvelle évaluation"
  icon={<PlusIcon />}
  onClick={() => console.log('Action')}
  variant="emerald"
/>
```

**Props:**
- `label`: Texte du bouton
- `icon`: Icône
- `onClick`: Fonction de clic
- `variant`: Couleur du variant
- `disabled`: État désactivé (optionnel)

### 5. StatusBadge
Badge de statut avec couleurs prédéfinies.

```tsx
import { StatusBadge } from '@/components/ui/StatusBadge';

<StatusBadge
  status="success"
  label="Validé"
/>
```

**Props:**
- `status`: Type de statut ('success' | 'warning' | 'error' | 'info' | 'pending')
- `label`: Texte du badge

## Styles CSS Personnalisés

Le fichier `globals.css` a été enrichi avec des animations et styles personnalisés :

### Classes Utilitaires
- `.farmer-stat-card`: Animation pour les cartes de statistiques
- `.farmer-gradient-bg`: Arrière-plan avec gradient animé
- `.farmer-card-glass`: Effet de verre (glassmorphism)
- `.farmer-action-button`: Animations pour les boutons d'action
- `.farmer-info-card`: Styles pour les cartes d'information
- `.farmer-status-badge`: Animations pour les badges de statut

### Animations
- `farmer-card-hover`: Animation au survol des cartes
- `farmer-icon-bounce`: Animation de rebond pour les icônes
- `farmer-gradient-shift`: Animation de gradient en mouvement

## Utilisation des Couleurs

Les composants utilisent un système de couleurs cohérent :

- **Emerald**: Vert principal, pour les éléments positifs
- **Blue**: Bleu, pour les informations générales
- **Amber**: Orange/jaune, pour les avertissements
- **Purple**: Violet, pour les éléments spéciaux
- **Red**: Rouge, pour les erreurs
- **Indigo**: Indigo, pour les éléments secondaires

## Responsive Design

Tous les composants sont conçus pour être responsive :

- **Mobile**: Adaptation automatique sur petits écrans
- **Tablet**: Optimisation pour les tablettes
- **Desktop**: Pleine utilisation de l'espace disponible

## Exemples d'Intégration

### Page Profile Complète
```tsx
<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
  <div className="p-4 sm:p-6 lg:p-8 max-w-screen-7xl mx-auto">
    <ModernPageHeader
      title="Mon profil agriculteur"
      subtitle="Gérez vos informations personnelles"
      icon={<UserIcon />}
      gradient="emerald"
    />
    
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Statut du profil"
        value="Validé"
        icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        gradient="emerald"
      />
      {/* Autres StatCards... */}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoCard
        label="Nom complet"
        value="Jean Dupont"
        icon={<UserIcon />}
      />
      {/* Autres InfoCards... */}
    </div>
  </div>
</div>
```

## Bonnes Pratiques

1. **Cohérence**: Utilisez les mêmes couleurs de gradient pour des éléments similaires
2. **Accessibilité**: Tous les composants respectent les standards d'accessibilité
3. **Performance**: Les animations sont optimisées pour de bonnes performances
4. **Responsive**: Testez toujours sur différentes tailles d'écran
5. **Icônes**: Utilisez Heroicons pour la cohérence visuelle

## Migration

Pour migrer une page existante vers le nouveau design :

1. Remplacez l'arrière-plan par le gradient moderne
2. Utilisez `ModernPageHeader` pour l'en-tête
3. Remplacez les cartes de statistiques par `StatCard`
4. Utilisez `InfoCard` pour les informations détaillées
5. Remplacez les boutons d'action par `ActionButton`
6. Utilisez `StatusBadge` pour les statuts

Cette approche garantit un design cohérent et moderne sur toutes les pages farmer.