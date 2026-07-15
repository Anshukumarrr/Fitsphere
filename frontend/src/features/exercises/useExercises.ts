import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = "https://oss.exercisedb.dev/api/v1";

export interface Exercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  equipments: string[];
  instructions: string[];
}

interface ExerciseResponse {
  success: boolean;
  meta: {
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
  };
  data: Exercise[];
}

export function useExercises(params?: {
  bodyParts?: string;
  equipments?: string;
  targetMuscles?: string;
  name?: string;
  cursor?: string;
}) {
  const queryParams: Record<string, string> = { limit: "25" };
  if (params?.bodyParts) queryParams.bodyParts = params.bodyParts;
  if (params?.equipments) queryParams.equipments = params.equipments;
  if (params?.targetMuscles) queryParams.targetMuscles = params.targetMuscles;
  if (params?.name) queryParams.name = params.name;
  if (params?.cursor) queryParams.cursor = params.cursor;

  return useQuery<ExerciseResponse>({
    queryKey: ["exercises", params],
    queryFn: async () => {
      const { data } = await axios.get<ExerciseResponse>(`${API_BASE}/exercises`, {
        params: queryParams,
      });
      return data;
    },
  });
}
