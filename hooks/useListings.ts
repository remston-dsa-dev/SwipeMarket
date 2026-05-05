import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@/types/listing";

const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Vintage camera kit",
    priceLabel: "$240",
    imageUrl: "https://picsum.photos/id/250/900/1200",
  },
  {
    id: "2",
    title: "Minimal desk lamp",
    priceLabel: "$48",
    imageUrl: "https://picsum.photos/id/180/900/1200",
  },
  {
    id: "3",
    title: "Ceramic pour-over set",
    priceLabel: "$62",
    imageUrl: "https://picsum.photos/id/225/900/1200",
  },
  {
    id: "4",
    title: "Wireless earbuds",
    priceLabel: "$129",
    imageUrl: "https://picsum.photos/id/367/900/1200",
  },
];

export function useListings() {
  return useQuery({
    queryKey: ["listings"],
    queryFn: async (): Promise<Listing[]> => MOCK_LISTINGS,
    staleTime: Infinity,
  });
}
