import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { fetchExternalUrl, leaderboardData } from "./action";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  isCurrentUser?: boolean;
}

export const useLeaderboardData = (
  options?: Omit<
    UseQueryOptions<LeaderboardEntry[], Error>,
    "queryKey" | "queryFn"
  >
): UseQueryResult<LeaderboardEntry[], Error> => {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const initialId = "188";
      const firstResponse = await fetchExternalUrl(initialId);

      if (!firstResponse || !firstResponse.data?.leaderboards?.length) {
        throw new Error("No leaderboard data available");
      }

      const externalId = firstResponse.data.leaderboards[0].externalId;
      const secondResponse = await leaderboardData(
        initialId,
        externalId.toString()
      );

      const formattedEntries: LeaderboardEntry[] =
        secondResponse.data.items.map(
          (
            apiEntry: { playerUsername: string; amount: number },
            index: number
          ): LeaderboardEntry => ({
            rank: index + 1,
            name: apiEntry.playerUsername,
            score: apiEntry.amount,
          })
        );

      return formattedEntries;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex: number): number =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options, // Allow overriding default options
  });
};

// Hook for manual refresh
export const useLeaderboardRefresh = (): {
  refresh: () => void;
  forceRefresh: () => void;
} => {
  const queryClient = useQueryClient();

  const refresh = (): void => {
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  const forceRefresh = (): void => {
    queryClient.refetchQueries({ queryKey: ["leaderboard"] });
  };

  return { refresh, forceRefresh };
};
