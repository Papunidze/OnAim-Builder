interface ExternalUrlResponse {
  data: {
    leaderboards: {
      externalId: string | number;
    }[];
  };
}

interface LeaderboardApiResponse {
  data: {
    items: {
      playerUsername: string;
      amount: number;
    }[];
  };
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

export const fetchExternalUrl = async (
  id: string
): Promise<ExternalUrlResponse> => {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid ID provided");
  }

  const URLEXTERNAL_ID = `https://st-admapi.onaim.io/api/Builder/GetPromotionForBuilder?id=${id}`;

  try {
    const response = await fetchWithTimeout(URLEXTERNAL_ID);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    const data: ExternalUrlResponse = await response.json();

    if (!data.data?.leaderboards?.length) {
      throw new Error("No leaderboard data found in response");
    }

    return data;
  } catch (error) {
    console.error("Error fetching external URL:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export const leaderboardData = async (
  promotionId: string,
  externalId: string
): Promise<LeaderboardApiResponse> => {
  if (!promotionId || !externalId) {
    throw new Error("Promotion ID and External ID are required");
  }

  const LEADERBOARD_URL = `https://st-apigateway.onaim.io/leaderboardapi/LeaderboardProgress/GetLeaderboardProgressForUser?ExternalId=${externalId}&promotionId=${promotionId}`;

  try {
    const response = await fetchWithTimeout(LEADERBOARD_URL, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    const data: LeaderboardApiResponse = await response.json();

    if (!data.data?.items) {
      throw new Error("Invalid leaderboard data structure");
    }

    return data;
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};
