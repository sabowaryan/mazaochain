"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  useImage?: boolean; // Option pour utiliser l'image SVG ou le SVG inline
  colorScheme?: "default" | "monochrome" | "inverse"; // Schéma de couleurs
}

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const sizeDimensions = {
  xs: { width: 24, height: 24 },
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
  xl: { width: 64, height: 64 },
};

const textSizeClasses = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

export function Logo({
  variant = "full",
  size = "md",
  className,
  showText = true,
  useImage = true,
  colorScheme = "default",
}: LogoProps) {
  const LogoIcon = () => {
    if (useImage) {
      return (
        <Image
          src="/logo.svg"
          alt="MazaoChain Logo"
          width={sizeDimensions[size].width}
          height={sizeDimensions[size].height}
          className={cn(sizeClasses[size], "align-middle", className)}
          priority
        />
      );
    }

    const getSvgColors = () => {
      switch (colorScheme) {
        case "monochrome":
          return {
            leaf: "fill-foreground stroke-foreground",
            leafVein: "stroke-foreground",
            bars: "fill-muted-foreground",
            circle: "stroke-muted-foreground",
          };
        case "inverse":
          return {
            leaf: "fill-white stroke-white",
            leafVein: "stroke-white",
            bars: "fill-emerald-200",
            circle: "stroke-white/50",
          };
        default:
          return {
            leaf: "fill-primary-500 stroke-primary-600",
            leafVein: "stroke-primary-600",
            bars: "fill-secondary-500",
            circle: "stroke-primary-400",
          };
      }
    };

    const svgColors = getSvgColors();

    // SVG inline avec les couleurs MazaoChain
    return (
      <svg
        viewBox="0 0 100 100"
        className={cn(sizeClasses[size], "align-middle", className)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Feuille verte */}
        <path
          d="M25 75C25 60 35 45 50 35C45 45 40 55 35 65C30 70 25 72.5 25 75Z"
          className={svgColors.leaf}
          strokeWidth="1"
        />

        {/* Nervure de la feuille */}
        <path
          d="M35 65C40 55 45 45 50 35"
          className={svgColors.leafVein}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Graphique en barres avec flèche */}
        <g transform="translate(45, 25)">
          {/* Barres du graphique */}
          <rect
            x="5"
            y="35"
            width="8"
            height="15"
            className={svgColors.bars}
            rx="1"
          />
          <rect
            x="15"
            y="25"
            width="8"
            height="25"
            className={svgColors.bars}
            rx="1"
          />
          <rect
            x="25"
            y="15"
            width="8"
            height="35"
            className={svgColors.bars}
            rx="1"
          />

          {/* Flèche de croissance */}
          <path
            d="M35 20L45 10L40 10L40 5L50 5L50 15L45 15L45 10L35 20Z"
            className={svgColors.bars}
          />
        </g>

        {/* Cercle de liaison */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          className={svgColors.circle}
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.3"
        />
      </svg>
    );
  };

  const getTextColors = () => {
    switch (colorScheme) {
      case "monochrome":
        return {
          mazao: "text-foreground",
          chain: "text-muted-foreground",
        };
      case "inverse":
        return {
          mazao: "text-white",
          chain: "text-emerald-200",
        };
      default:
        return {
          mazao: "text-primary-600",
          chain: "text-secondary-500",
        };
    }
  };

  const textColors = getTextColors();

  const LogoText = ({
    size: textSize,
  }: {
    size: keyof typeof textSizeClasses;
  }) => (
    <span className={cn("font-bold tracking-tight leading-none", textSizeClasses[textSize])}>
      <span className={textColors.mazao}>Mazao</span>
      <span className={textColors.chain}>Chain</span>
    </span>
  );

  if (variant === "icon") {
    return <LogoIcon />;
  }

  if (variant === "text") {
    return <LogoText size={size} />;
  }

  // variant === 'full'
  return (
    <div className={cn("logo-container", className)}>
      <div className="logo-icon">
        <LogoIcon />
      </div>
      {showText && (
        <div className="logo-text">
          <LogoText size={size} />
        </div>
      )}
    </div>
  );
}

// Composants spécialisés pour différents contextes
export function MobileLogo() {
  return <Logo variant="icon" size="sm" />;
}

export function DesktopLogo() {
  return <Logo variant="full" size="md" />;
}

export function SidebarLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Logo
      variant={collapsed ? "icon" : "full"}
      size="md"
      showText={!collapsed}
    />
  );
}

export function AuthLogo({ className, colorScheme = "default" }: { className?: string; colorScheme?: "default" | "monochrome" | "inverse" }) {
  return <Logo variant="full" size="xl" className={className} colorScheme={colorScheme} />;
}

export function NavbarLogo() {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <Logo variant="icon" size="sm" />
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <Logo variant="full" size="md" />
      </div>
    </>
  );
}
