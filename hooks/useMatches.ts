import { useQuery } from "@tanstack/react-query";

export type MatchPreview = {
  id: string;
  title: string;
};

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async (): Promise<MatchPreview[]> => [],
    staleTime: 60_000,
  });
}
