import { rest } from "./api.service";
import { logger } from "../../../shared/utils/logger";

export class ApiDiagnostics {
  static async testApiConnection(): Promise<{
    baseUrl: string;
    isServerRunning: boolean;
    corsEnabled: boolean;
    error?: string;
  }> {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const corsEnabled =
        response.headers.get("Access-Control-Allow-Origin") !== null;

      return {
        baseUrl,
        isServerRunning: response.ok,
        corsEnabled,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("API Diagnostics Error:", error);

      return {
        baseUrl,
        isServerRunning: false,
        corsEnabled: false,
        error: errorMessage,
      };
    }
  }

  static async testApiService(): Promise<{
    restApiWorking: boolean;
    error?: string;
  }> {
    try {
      await rest.GET("/api/test");
      return { restApiWorking: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("API Service Test Error:", error);

      return {
        restApiWorking: false,
        error: errorMessage,
      };
    }
  }

  static logConfiguration(): void {
    logger.log("API Configuration:", {
      baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
    });
  }
}
