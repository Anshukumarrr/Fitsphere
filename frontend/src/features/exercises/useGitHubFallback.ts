import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const DATASET_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const RAW_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";

interface RepoEntry {
  id: string;
  name: string;
  media_id: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, " ");
}

function simplify(s: string): string {
  s = s.toLowerCase();
  s = s.replace(/\([^)]*\)/g, " ");
  s = s.replace(/\bwith\b.*$/, "");
  s = s.replace(/[^a-z0-9 ]/g, "");
  return s.trim().replace(/\s+/g, " ");
}

async function fetchGitHubDataset(): Promise<Map<string, string>> {
  const { data } = await axios.get<RepoEntry[]>(DATASET_URL);
  const map = new Map<string, string>();
  for (const ex of data) {
    if (!ex.media_id) continue;
    const url = `${RAW_BASE}/videos/${ex.id}-${ex.media_id}.gif`;
    const name = normalize(ex.name);
    if (!map.has(name)) map.set(name, url);
    const sname = simplify(ex.name);
    if (sname !== name && !map.has(sname)) map.set(sname, url);
  }
  return map;
}

export function useGitHubFallback() {
  const { data: lookup } = useQuery({
    queryKey: ["github-dataset"],
    queryFn: fetchGitHubDataset,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    isReady: lookup !== undefined,
    findGitHubImage(exerciseName: string): string | null {
      if (!lookup) return null;
      const n = normalize(exerciseName);
      const hit = lookup.get(n);
      if (hit) return hit;
      const sn = simplify(exerciseName);
      return sn !== n ? lookup.get(sn) ?? null : null;
    },
  };
}
