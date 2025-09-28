import { supabase } from "@/lib/supabase/client";

interface Alert {
  id: string;
  type: "security" | "performance" | "system" | "business";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  status: "active" | "acknowledged" | "resolved";
  assignedTo?: string;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface AlertStats {
  critical: number;
  high: number;
  active: number;
  resolved24h: number;
  byType: {
    security: number;
    performance: number;
    system: number;
    business: number;
  };
}

class AlertsService {
  async getAlerts(limit: number = 100): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (
        data?.map((alert: any) => ({
          id: alert.id,
          type: alert.type as
            | "performance"
            | "security"
            | "system"
            | "business",
          severity: alert.severity as "low" | "medium" | "high" | "critical",
          title: alert.title,
          description: alert.description,
          source: alert.source,
          timestamp: new Date(alert.created_at),
          status: alert.status,
          assignedTo: alert.assigned_to,
          resolvedAt: alert.resolved_at
            ? new Date(alert.resolved_at)
            : undefined,
          metadata: alert.metadata,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching alerts:", error);
      throw new Error("Failed to fetch alerts");
    }
  }

  async getAlertStats(): Promise<AlertStats> {
    try {
      // Get critical alerts count
      const { count: critical } = await supabase
        .from("system_alerts")
        .select("*", { count: "exact", head: true })
        .eq("severity", "critical")
        .eq("status", "active");

      // Get high priority alerts count
      const { count: high } = await supabase
        .from("system_alerts")
        .select("*", { count: "exact", head: true })
        .eq("severity", "high")
        .eq("status", "active");

      // Get active alerts count
      const { count: active } = await supabase
        .from("system_alerts")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get resolved alerts in last 24h
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { count: resolved24h } = await supabase
        .from("system_alerts")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("resolved_at", twentyFourHoursAgo.toISOString());

      // Get alerts by type
      const { data: typeData } = await supabase
        .from("system_alerts")
        .select("type")
        .eq("status", "active");

      const byType = {
        security: 0,
        performance: 0,
        system: 0,
        business: 0,
      };

      typeData?.forEach((alert) => {
        if (alert.type in byType) {
          byType[alert.type as keyof typeof byType]++;
        }
      });

      return {
        critical: critical || 0,
        high: high || 0,
        active: active || 0,
        resolved24h: resolved24h || 0,
        byType,
      };
    } catch (error) {
      console.error("Error fetching alert stats:", error);
      throw new Error("Failed to fetch alert stats");
    }
  }

  async createAlert(alert: {
    type: "security" | "performance" | "system" | "business";
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("system_alerts")
        .insert({
          ...alert,
          status: "active",
          metadata: alert.metadata as any,
        })
        .select("id")
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error("Error creating alert:", error);
      throw new Error("Failed to create alert");
    }
  }

  async acknowledgeAlert(alertId: string, assignedTo?: string): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
      };

      if (assignedTo) {
        updateData.assigned_to = assignedTo;
      }

      const { error } = await supabase
        .from("system_alerts")
        .update(updateData)
        .eq("id", alertId);

      if (error) throw error;
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      throw new Error("Failed to acknowledge alert");
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("system_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
    } catch (error) {
      console.error("Error resolving alert:", error);
      throw new Error("Failed to resolve alert");
    }
  }

  async getAlertsByType(type: Alert["type"]): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        data?.map((alert: any) => ({
          id: alert.id,
          type: alert.type as
            | "performance"
            | "security"
            | "system"
            | "business",
          severity: alert.severity as "low" | "medium" | "high" | "critical",
          title: alert.title,
          description: alert.description,
          source: alert.source,
          timestamp: new Date(alert.created_at),
          status: alert.status,
          assignedTo: alert.assigned_to,
          resolvedAt: alert.resolved_at
            ? new Date(alert.resolved_at)
            : undefined,
          metadata: alert.metadata,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching alerts by type:", error);
      throw new Error("Failed to fetch alerts by type");
    }
  }

  async getAlertsBySeverity(severity: Alert["severity"]): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("*")
        .eq("severity", severity)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        data?.map((alert: unknown) => ({
          id: alert.id,
          type: alert.type as
            | "performance"
            | "security"
            | "system"
            | "business",
          severity: alert.severity as "low" | "medium" | "high" | "critical",
          title: alert.title,
          description: alert.description,
          source: alert.source,
          timestamp: new Date(alert.created_at),
          status: alert.status,
          assignedTo: alert.assigned_to,
          resolvedAt: alert.resolved_at
            ? new Date(alert.resolved_at)
            : undefined,
          metadata: alert.metadata,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching alerts by severity:", error);
      throw new Error("Failed to fetch alerts by severity");
    }
  }

  // Predefined alert creators for common scenarios
  async createSecurityAlert(
    title: string,
    description: string,
    metadata?: Record<string, unknown>
  ) {
    return this.createAlert({
      type: "security",
      severity: "high",
      title,
      description,
      source: "security_monitor",
      metadata,
    });
  }

  async createPerformanceAlert(
    title: string,
    description: string,
    severity: Alert["severity"] = "medium",
    metadata?: Record<string, unknown>
  ) {
    return this.createAlert({
      type: "performance",
      severity,
      title,
      description,
      source: "performance_monitor",
      metadata,
    });
  }

  async createSystemAlert(
    title: string,
    description: string,
    severity: Alert["severity"] = "medium",
    metadata?: Record<string, unknown>
  ) {
    return this.createAlert({
      type: "system",
      severity,
      title,
      description,
      source: "system_monitor",
      metadata,
    });
  }

  async createBusinessAlert(
    title: string,
    description: string,
    severity: Alert["severity"] = "low",
    metadata?: Record<string, unknown>
  ) {
    return this.createAlert({
      type: "business",
      severity,
      title,
      description,
      source: "business_monitor",
      metadata,
    });
  }
}

export const alertsService = new AlertsService();
