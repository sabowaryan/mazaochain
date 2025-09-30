import { createClient } from "@/lib/supabase/client";
import { notificationService } from "./notification";

export interface CropPrice {
  id: string;
  crop_type: "manioc" | "cafe";
  price: number;
  currency: string;
  source: "manual" | "chainlink" | "external_api";
  source_reference?: string;
  updated_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  crop_type: "manioc" | "cafe";
  price: number;
  currency: string;
  source: "manual" | "chainlink" | "external_api";
  source_reference?: string;
  recorded_at: string;
  created_at: string;
}

export interface PriceNotification {
  id: string;
  crop_type: "manioc" | "cafe";
  old_price?: number;
  new_price: number;
  price_change_percent?: number;
  notification_sent: boolean;
  created_at: string;
}

export interface PriceTrend {
  crop_type: "manioc" | "cafe";
  current_price: number;
  previous_price?: number;
  change_percent?: number;
  trend_direction: "up" | "down" | "stable";
  price_history: PriceHistory[];
}

export class PriceOracleService {
  private supabase = createClient();

  /**
   * Get current active prices for all crop types
   */
  async getCurrentPrices(): Promise<CropPrice[]> {
    const { data, error } = await this.supabase
      .from("crop_prices" as any)
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(
        `Erreur lors de la récupération des prix: ${error.message}`
      );
    }

    return (data as any) || [];
  }

  /**
   * Get current price for a specific crop type
   */
  async getCurrentPrice(
    cropType: "manioc" | "cafe"
  ): Promise<CropPrice | null> {
    const { data, error } = await this.supabase
      .from("crop_prices" as any)
      .select("*")
      .eq("crop_type", cropType)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows found
      }
      throw new Error(
        `Erreur lors de la récupération du prix pour ${cropType}: ${error.message}`
      );
    }

    return data as any;
  }

  /**
   * Update price for a crop type (manual input)
   */
  async updatePrice(
    cropType: "manioc" | "cafe",
    newPrice: number,
    userId: string,
    sourceReference?: string
  ): Promise<CropPrice> {
    const { data, error } = await this.supabase
      .from("crop_prices" as any)
      .update({
        price: newPrice,
        updated_by: userId,
        source_reference: sourceReference,
        updated_at: new Date().toISOString(),
      })
      .eq("crop_type", cropType)
      .eq("is_active", true)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Erreur lors de la mise à jour du prix: ${error.message}`
      );
    }

    // Send notifications for price updates
    await this.processPriceNotifications(cropType);

    return data as any;
  }

  /**
   * Get price history for a crop type
   */
  async getPriceHistory(
    cropType: "manioc" | "cafe",
    limit: number = 30
  ): Promise<PriceHistory[]> {
    const { data, error } = await this.supabase
      .from("price_history" as any)
      .select("*")
      .eq("crop_type", cropType)
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(
        `Erreur lors de la récupération de l'historique des prix: ${error.message}`
      );
    }

    return (data as any) || [];
  }

  /**
   * Get price trend analysis for a crop type
   */
  async getPriceTrend(cropType: "manioc" | "cafe"): Promise<PriceTrend> {
    // Get current price
    const currentPrice = await this.getCurrentPrice(cropType);
    if (!currentPrice) {
      throw new Error(`Prix actuel non trouvé pour ${cropType}`);
    }

    // Get price history
    const history = await this.getPriceHistory(cropType, 10);

    // Calculate trend
    let trend_direction: "up" | "down" | "stable" = "stable";
    let change_percent: number | undefined;
    let previous_price: number | undefined;

    if (history.length > 0) {
      previous_price = history[0].price;
      change_percent =
        ((currentPrice.price - previous_price) / previous_price) * 100;

      if (change_percent > 1) {
        trend_direction = "up";
      } else if (change_percent < -1) {
        trend_direction = "down";
      }
    }

    return {
      crop_type: cropType,
      current_price: currentPrice.price,
      previous_price,
      change_percent,
      trend_direction,
      price_history: history,
    };
  }

  /**
   * Get all price trends
   */
  async getAllPriceTrends(): Promise<PriceTrend[]> {
    const cropTypes: ("manioc" | "cafe")[] = ["manioc", "cafe"];
    const trends: PriceTrend[] = [];

    for (const cropType of cropTypes) {
      try {
        const trend = await this.getPriceTrend(cropType);
        trends.push(trend);
      } catch (error) {
        console.error(`Error getting trend for ${cropType}:`, error);
      }
    }

    return trends;
  }

  /**
   * Process price notifications for stakeholders
   */
  private async processPriceNotifications(
    cropType: "manioc" | "cafe"
  ): Promise<void> {
    try {
      // Get pending notifications
      const { data: notifications, error } = await this.supabase
        .from("price_notifications" as any)
        .select("*")
        .eq("crop_type", cropType)
        .eq("notification_sent", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !notifications || notifications.length === 0) {
        return;
      }

      const notification = notifications[0];

      // Get all users who should be notified (farmers with this crop type, cooperatives, lenders)
      const { data: usersToNotify, error: usersError } = await this.supabase
        .from("profiles")
        .select("id, role")
        .in("role", ["agriculteur", "cooperative", "preteur"]);

      if (usersError || !usersToNotify) {
        console.error("Error getting users to notify:", usersError);
        return;
      }

      // Send notifications
      const notificationPromises = usersToNotify.map((user) =>
        notificationService.sendNotification({
          userId: user.id,
          type: "price_update",
          title: `Prix du ${cropType} mis à jour`,
          message: `Le prix du ${cropType} est passé de ${
            (notification as any).old_price || "N/A"
          } à ${(notification as any).new_price} USDC (${
            (notification as any).price_change_percent || 0
          }%)`,
          data: {
            crop_type: cropType,
            old_price: (notification as any).old_price,
            new_price: (notification as any).new_price,
            change_percent: (notification as any).price_change_percent,
          }
        })
      );

      await Promise.all(notificationPromises);

      // Mark notification as sent
      // Note: price_notifications table needs to be added to database types
      await this.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", (notification as any).id);
    } catch (error) {
      console.error("Error processing price notifications:", error);
    }
  }

  /**
   * Prepare for Chainlink integration (placeholder for future implementation)
   */
  async setupChainlinkIntegration(): Promise<{
    supported: boolean;
    message: string;
  }> {
    // This is a placeholder for future Chainlink oracle integration
    return {
      supported: false,
      message:
        "Chainlink integration will be implemented in a future version. Currently using manual price updates.",
    };
  }

  /**
   * Validate price update (business rules)
   */
  validatePriceUpdate(
    cropType: "manioc" | "cafe",
    currentPrice: number,
    newPrice: number
  ): { valid: boolean; message?: string } {
    // Check for reasonable price bounds
    const minPrice = 0.01; // Minimum 1 cent
    const maxPrice = 100.0; // Maximum $100 per kg

    if (newPrice < minPrice || newPrice > maxPrice) {
      return {
        valid: false,
        message: `Le prix doit être entre ${minPrice} et ${maxPrice} USDC`,
      };
    }

    // Check for extreme price changes (more than 50% change)
    const changePercent =
      Math.abs((newPrice - currentPrice) / currentPrice) * 100;
    if (changePercent > 50) {
      return {
        valid: false,
        message: `Changement de prix trop important (${changePercent.toFixed(
          1
        )}%). Veuillez vérifier le prix.`,
      };
    }

    return { valid: true };
  }
}

export const priceOracleService = new PriceOracleService();
