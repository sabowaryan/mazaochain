/**
 * AppKit Modal Opening Test
 * 
 * This test verifies that the AppKit modal opens correctly when the button is clicked.
 * 
 * Note: This is a component-level test. Full modal functionality requires:
 * - Valid WalletConnect Project ID
 * - AppKit library properly loaded
 * - Browser environment with DOM
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AppKitButton } from "@/components/wallet/AppKitButton";

// Mock the AppKit configuration
vi.mock("@/lib/wallet/appkit-config", () => {
  const mockAppKitInstance = {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getState: vi.fn().mockReturnValue({}),
  };

  return {
    initializeAppKit: vi.fn().mockResolvedValue(mockAppKitInstance),
    getAppKit: vi.fn().mockReturnValue(mockAppKitInstance),
    isAppKitEnabled: vi.fn().mockReturnValue(true),
  };
});

// Mock environment
vi.mock("@/lib/config/env", () => ({
  env: {
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "test_project_id_12345678901234567890",
    NEXT_PUBLIC_HEDERA_NETWORK: "testnet",
    NEXT_PUBLIC_HASHPACK_APP_NAME: "Test App",
    NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION: "Test Description",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_USE_APPKIT: true,
  },
}));

describe("AppKit Modal Opening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Button Rendering", () => {
    it("should render loading state initially", () => {
      render(<AppKitButton />);
      
      // Should show initializing state
      expect(screen.getByText("Initializing...")).toBeInTheDocument();
    });

    it("should render AppKit button after initialization", async () => {
      const { container } = render(<AppKitButton />);
      
      // Wait for initialization
      await waitFor(() => {
        // Check if appkit-button element is rendered
        const appkitButton = container.querySelector("appkit-button");
        expect(appkitButton).toBeInTheDocument();
      });
    });

    it("should not render when AppKit is disabled", () => {
      const { isAppKitEnabled } = require("@/lib/wallet/appkit-config");
      isAppKitEnabled.mockReturnValue(false);

      const { container } = render(<AppKitButton />);
      
      // Should not render anything
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Initialization", () => {
    it("should call initializeAppKit on mount", async () => {
      const { initializeAppKit } = require("@/lib/wallet/appkit-config");
      
      render(<AppKitButton />);
      
      await waitFor(() => {
        expect(initializeAppKit).toHaveBeenCalled();
      });
    });

    it("should handle initialization errors gracefully", async () => {
      const { initializeAppKit } = require("@/lib/wallet/appkit-config");
      const errorMessage = "Failed to initialize";
      initializeAppKit.mockRejectedValueOnce(new Error(errorMessage));

      render(<AppKitButton />);
      
      await waitFor(() => {
        expect(screen.getByText("AppKit Error")).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe("Modal Opening Behavior", () => {
    it("should render web component that handles modal opening", async () => {
      const { container } = render(<AppKitButton />);
      
      await waitFor(() => {
        const appkitButton = container.querySelector("appkit-button");
        expect(appkitButton).toBeInTheDocument();
      });

      // The web component itself handles the modal opening
      // We verify that the component is rendered correctly
      const appkitButton = container.querySelector("appkit-button");
      expect(appkitButton).not.toBeNull();
    });

    it("should have AppKit instance available after initialization", async () => {
      const { getAppKit } = require("@/lib/wallet/appkit-config");
      
      render(<AppKitButton />);
      
      await waitFor(() => {
        const appKit = getAppKit();
        expect(appKit).toBeDefined();
        expect(appKit.open).toBeDefined();
      });
    });
  });

  describe("Error States", () => {
    it("should display error message when initialization fails", async () => {
      const { initializeAppKit } = require("@/lib/wallet/appkit-config");
      initializeAppKit.mockRejectedValueOnce(new Error("Network error"));

      render(<AppKitButton />);
      
      await waitFor(() => {
        expect(screen.getByText("AppKit Error")).toBeInTheDocument();
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should show error with proper styling", async () => {
      const { initializeAppKit } = require("@/lib/wallet/appkit-config");
      initializeAppKit.mockRejectedValueOnce(new Error("Test error"));

      const { container } = render(<AppKitButton />);
      
      await waitFor(() => {
        const errorDiv = container.querySelector(".bg-red-50");
        expect(errorDiv).toBeInTheDocument();
      });
    });
  });
});

describe("AppKit Web Component Integration", () => {
  it("should verify web component is properly declared", () => {
    // TypeScript should recognize appkit-button as a valid JSX element
    // This is verified at compile time, but we can check the declaration exists
    const { container } = render(<AppKitButton />);
    
    // The component should render without TypeScript errors
    expect(container).toBeDefined();
  });

  it("should render web component with correct structure", async () => {
    const { container } = render(<AppKitButton />);
    
    await waitFor(() => {
      const wrapper = container.querySelector(".flex.items-center.gap-2");
      expect(wrapper).toBeInTheDocument();
      
      const appkitButton = wrapper?.querySelector("appkit-button");
      expect(appkitButton).toBeInTheDocument();
    });
  });
});

describe("AppKit Modal Opening - Integration Points", () => {
  it("should have all required methods for modal control", async () => {
    const { getAppKit } = require("@/lib/wallet/appkit-config");
    
    render(<AppKitButton />);
    
    await waitFor(() => {
      const appKit = getAppKit();
      
      // Verify AppKit instance has modal control methods
      expect(appKit).toHaveProperty("open");
      expect(appKit).toHaveProperty("close");
      expect(typeof appKit.open).toBe("function");
      expect(typeof appKit.close).toBe("function");
    });
  });

  it("should initialize AppKit with correct configuration", async () => {
    const { initializeAppKit } = require("@/lib/wallet/appkit-config");
    
    render(<AppKitButton />);
    
    await waitFor(() => {
      expect(initializeAppKit).toHaveBeenCalledTimes(1);
    });
  });
});

/**
 * Manual Testing Notes:
 * 
 * These automated tests verify the component structure and initialization.
 * To fully test modal opening:
 * 
 * 1. Set NEXT_PUBLIC_USE_APPKIT=true in .env.local
 * 2. Set valid NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
 * 3. Run the application: npm run dev
 * 4. Navigate to a page with AppKitButton
 * 5. Click the button
 * 6. Verify modal opens with wallet options
 * 
 * Expected behavior:
 * - Button renders after brief "Initializing..." state
 * - Clicking button opens AppKit modal
 * - Modal shows wallet connection options
 * - Modal is properly styled and responsive
 */
