import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  target: string;
}

export function useBanners(target: string = "all") {
  return useQuery<ActiveBanner[]>({
    queryKey: ["active-banners", target],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_banners", { p_target: target });
      if (error) throw error;
      return (data ?? []) as ActiveBanner[];
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
