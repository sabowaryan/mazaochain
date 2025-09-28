import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase client with proper chain structure
let mockQueryResult: any = { data: [], error: null };

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve(mockQueryResult)),
        single: vi.fn(() => Promise.resolve(mockQueryResult)),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve(mockQueryResult)),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(mockQueryResult)),
          })),
        })),
      })),
    })),
  })),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

vi.mock("../notification", () => ({
  notificationService: {
    createNotification: vi.fn(),
  },
}));

// Import after mocking
const { PriceOracleService } = await import("../price-oracle");

describe("PriceOracleService", () => {
  let priceOracleService: InstanceType<typeof PriceOracleService>;

  beforeEach(() => {
    vi.clearAllMocks();
    priceOracleService = new PriceOracleService();
  });

  describe("getCurrentPrices", () => {
    it("should fetch current active prices", async () => {
      const mockPrices = [
        {
          id: "1",
          crop_type: "manioc" as const,
          price: 0.5,
          currency: "USDC",
          source: "manual" as const,
          is_active: true,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      // Set the mock result
      mockQueryResult = { data: mockPrices, error: null };

      const result = await priceOracleService.getCurrentPrices();

      expect(result).toEqual(mockPrices);
    });

    it("should handle errors when fetching prices", async () => {
      // Set the mock result to return an error
      mockQueryResult = { data: null, error: { message: "Database error" } };

      await expect(priceOracleService.getCurrentPrices()).rejects.toThrow(
        "Erreur lors de la récupération des prix: Database error"
      );
    });
  });

  describe("getCurrentPrice", () => {
    it("should fetch current price for specific crop type", async () => {
      const mockPrice = {
        id: "1",
        crop_type: "manioc" as const,
        price: 0.5,
        currency: "USDC",
        source: "manual" as const,
        is_active: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      // Set the mock result
      mockQueryResult = { data: mockPrice, error: null };

      const result = await priceOracleService.getCurrentPrice("manioc");

      expect(result).toEqual(mockPrice);
    });

    it("should return null when no price found", async () => {
      // Set the mock result to simulate no data found
      mockQueryResult = { data: null, error: { code: "PGRST116" } };

      const result = await priceOracleService.getCurrentPrice("manioc");

      expect(result).toBeNull();
    });
  });

  describe("updatePrice", () => {
    it("should update price successfully", async () => {
      const mockUpdatedPrice = {
        id: "1",
        crop_type: "manioc" as const,
        price: 0.6,
        currency: "USDC",
        source: "manual" as const,
        is_active: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      // Set the mock result
      mockQueryResult = { data: mockUpdatedPrice, error: null };

      // Mock processPriceNotifications
      vi.spyOn(
        priceOracleService as unknown,
        "processPriceNotifications"
      ).mockResolvedValue(undefined);

      const result = await priceOracleService.updatePrice(
        "manioc",
        0.6,
        "user-id"
      );

      expect(result).toEqual(mockUpdatedPrice);
    });
  });

  describe("validatePriceUpdate", () => {
    it("should validate reasonable price updates", () => {
      const result = priceOracleService.validatePriceUpdate("manioc", 0.5, 0.6);

      expect(result.valid).toBe(true);
    });

    it("should reject prices below minimum", () => {
      const result = priceOracleService.validatePriceUpdate(
        "manioc",
        0.5,
        0.005
      );

      expect(result.valid).toBe(false);
      expect(result.message).toContain("Le prix doit être entre");
    });

    it("should reject prices above maximum", () => {
      const result = priceOracleService.validatePriceUpdate("manioc", 0.5, 150);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("Le prix doit être entre");
    });

    it("should reject extreme price changes", () => {
      const result = priceOracleService.validatePriceUpdate("manioc", 1.0, 2.0);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("Changement de prix trop important");
    });
  });

  describe("getPriceTrend", () => {
    it("should calculate price trend correctly", async () => {
      const mockCurrentPrice = {
        id: "1",
        crop_type: "manioc" as const,
        price: 0.6,
        currency: "USDC",
        source: "manual" as const,
        is_active: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      const mockHistory = [
        {
          id: "2",
          crop_type: "manioc" as const,
          price: 0.5,
          currency: "USDC",
          source: "manual" as const,
          recorded_at: "2024-01-01",
          created_at: "2024-01-01",
        },
      ];

      vi.spyOn(priceOracleService, "getCurrentPrice").mockResolvedValue(
        mockCurrentPrice
      );
      vi.spyOn(priceOracleService, "getPriceHistory").mockResolvedValue(
        mockHistory
      );

      const result = await priceOracleService.getPriceTrend("manioc");

      expect(result.crop_type).toBe("manioc");
      expect(result.current_price).toBe(0.6);
      expect(result.previous_price).toBe(0.5);
      expect(result.change_percent).toBeCloseTo(20, 1); // (0.6 - 0.5) / 0.5 * 100
      expect(result.trend_direction).toBe("up");
    });
  });

  describe("setupChainlinkIntegration", () => {
    it("should return placeholder response for future implementation", async () => {
      const result = await priceOracleService.setupChainlinkIntegration();

      expect(result.supported).toBe(false);
      expect(result.message).toContain(
        "Chainlink integration will be implemented"
      );
    });
  });
});
