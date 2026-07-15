import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, CardMedia, Chip, Dialog,
  DialogContent, DialogTitle, Grid, IconButton, MenuItem,
  TextField, Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useExercises, type Exercise } from "./useExercises";
import { useGitHubFallback } from "./useGitHubFallback";

const FALLBACK = "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect fill="#1A1D1B" width="400" height="300"/>
    <g transform="translate(200 130)" fill="none" stroke="#6B6F6C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="-30" cy="-40" r="14"/>
      <line x1="-30" y1="-26" x2="-30" y2="10"/>
      <line x1="-50" y1="-10" x2="-10" y2="-10"/>
      <line x1="-50" y1="-10" x2="-55" y2="30"/>
      <line x1="-10" y1="-10" x2="-5" y2="30"/>
      <line x1="30" y1="-26" x2="30" y2="10"/>
      <line x1="30" y1="-26" x2="30" y2="-40"/>
      <line x1="10" y1="-10" x2="50" y2="-10"/>
      <line x1="10" y1="-10" x2="5" y2="30"/>
      <line x1="50" y1="-10" x2="55" y2="30"/>
      <line x1="-30" y1="10" x2="-20" y2="60"/>
      <line x1="-30" y1="10" x2="-40" y2="60"/>
      <line x1="30" y1="10" x2="20" y2="60"/>
      <line x1="30" y1="10" x2="40" y2="60"/>
    </g>
    <text x="200" y="220" fill="#6B6F6C" font-family="Inter,sans-serif" font-size="13" text-anchor="middle">No Preview</text>
  </svg>`
);

const bodyPartGroups = [
  { label: "Chest", value: "chest" },
  { label: "Back", value: "back" },
  { label: "Arms", value: "upper arms" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Legs", value: "upper legs,lower+legs" },
  { label: "Core", value: "waist" },
  { label: "Cardio", value: "cardio" },
  { label: "Neck", value: "neck" },
];
const equipments = ["assisted", "band", "barbell", "body weight", "cable", "dumbbell", "kettlebell", "leverage machine", "resistance band", "roller", "sled machine", "smith machine", "weighted"];

function ExerciseCard({ exercise, onSelect, findGitHubImage }: { exercise: Exercise; onSelect: (e: Exercise) => void; findGitHubImage: (n: string) => string | null }) {
  const ghUrl = useMemo(() => findGitHubImage(exercise.name), [exercise.name, findGitHubImage]);
  const [imgSrc, setImgSrc] = useState(exercise.gifUrl);
  useEffect(() => { setImgSrc(exercise.gifUrl); }, [exercise.exerciseId]);
  return (
    <Card
      sx={{ cursor: "pointer", "&:hover": { borderColor: "rgba(212,255,63,0.3)" } }}
      onClick={() => onSelect(exercise)}
    >
      <CardMedia
        component="img"
        height="180"
        image={imgSrc}
        alt={exercise.name}
        sx={{ objectFit: imgSrc === FALLBACK ? "contain" : "cover", bgcolor: "#1A1D1B" }}
        onError={() => setImgSrc(imgSrc === exercise.gifUrl && ghUrl ? ghUrl : FALLBACK)}
      />
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, textTransform: "capitalize" }}>
          {exercise.name}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {exercise.targetMuscles.slice(0, 2).map((m) => (
            <Chip key={m} label={m} size="small" color="success" variant="filled" />
          ))}
          {exercise.bodyParts.slice(0, 1).map((bp) => (
            <Chip key={bp} label={bp} size="small" variant="outlined" />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function ExerciseDetail({ exercise, open, onClose, findGitHubImage }: { exercise: Exercise | null; open: boolean; onClose: () => void; findGitHubImage: (n: string) => string | null }) {
  const ghUrl = useMemo(() => exercise ? findGitHubImage(exercise.name) : null, [exercise, findGitHubImage]);
  const [imgSrc, setImgSrc] = useState(exercise?.gifUrl ?? "");
  useEffect(() => { setImgSrc(exercise?.gifUrl ?? ""); }, [exercise?.exerciseId]);
  if (!exercise) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", textTransform: "capitalize" }}>
        {exercise.name}
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
          <Box sx={{ flex: "0 0 400px", maxWidth: "100%" }}>
            <Box
              component="img"
              src={imgSrc}
              alt={exercise.name}
              sx={{ width: "100%", borderRadius: 1, bgcolor: "#1A1D1B" }}
              onError={() => setImgSrc(imgSrc === exercise.gifUrl && ghUrl ? ghUrl : FALLBACK)}
            key={exercise.exerciseId}
          />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
              <Chip label={exercise.bodyParts.join(", ")} size="small" variant="outlined" />
              {exercise.equipments.map((eq) => (
                <Chip key={eq} label={eq} size="small" variant="outlined" />
              ))}
            </Box>
            <Typography variant="subtitle2" sx={{ color: "#D4FF3F", mb: 1 }}>Target Muscles</Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
              {exercise.targetMuscles.map((m) => (
                <Chip key={m} label={m} size="small" color="success" />
              ))}
            </Box>
            {exercise.secondaryMuscles.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ color: "#6B6F6C", mb: 1 }}>Secondary Muscles</Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
                  {exercise.secondaryMuscles.map((m) => (
                    <Chip key={m} label={m} size="small" variant="outlined" />
                  ))}
                </Box>
              </>
            )}
            <Typography variant="subtitle2" sx={{ color: "#D4FF3F", mb: 1 }}>Instructions</Typography>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {exercise.instructions.map((step, i) => (
                <li key={i}>
                  <Typography variant="body2" sx={{ color: "#E8E3D8", mb: 0.5 }}>
                    {step.replace(/^Step:\d+\s*/, "")}
                  </Typography>
                </li>
              ))}
            </ol>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function ExerciseExplorerPage() {
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const { findGitHubImage, isReady } = useGitHubFallback();

  const params: Record<string, string> = {};
  if (bodyPart) params.bodyParts = bodyPart;
  if (equipment) params.equipments = equipment;
  if (search) params.name = search;

  const { data, isLoading } = useExercises({
    ...params,
    cursor: cursor && !bodyPart && !equipment && !search ? cursor : undefined,
  });

  const exercises = data?.data ?? [];
  const hasNext = data?.meta.hasNextPage ?? false;

  const handleFilterChange = useCallback(() => {
    setCursor(undefined);
    setAllExercises([]);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (data?.meta.nextCursor) {
      setCursor(data.meta.nextCursor);
    }
  }, [data]);

  const visibleExercises = (allExercises.length > 0 ? [...allExercises, ...exercises] : exercises);
  const displayExercises = isReady ? visibleExercises.filter(ex => findGitHubImage(ex.name) !== null) : visibleExercises;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Exercise Explorer</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Browse {displayExercises.length} exercises with visual demonstrations
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          select
          label="Body Part"
          value={bodyPart}
          onChange={(e) => { setBodyPart(e.target.value); handleFilterChange(); }}
          sx={{ minWidth: 160 }}
          size="small"
        >
          <MenuItem value="">All</MenuItem>
          {bodyPartGroups.map((g) => (
            <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Equipment"
          value={equipment}
          onChange={(e) => { setEquipment(e.target.value); handleFilterChange(); }}
          sx={{ minWidth: 160 }}
          size="small"
        >
          <MenuItem value="">All</MenuItem>
          {equipments.map((eq) => (
            <MenuItem key={eq} value={eq} sx={{ textTransform: "capitalize" }}>{eq}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
          placeholder="Exercise name..."
          size="small"
          sx={{ minWidth: 200 }}
        />
      </Box>

      {isLoading ? (
        <Typography color="text.secondary">Loading exercises...</Typography>
      ) : displayExercises.length === 0 ? (
        <Typography color="text.secondary">No exercises found. Try different filters.</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {displayExercises.map((ex) => (
              <Grid key={ex.exerciseId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ExerciseCard exercise={ex} onSelect={setSelected} findGitHubImage={findGitHubImage} />
              </Grid>
            ))}
          </Grid>
          {hasNext && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button variant="outlined" onClick={handleLoadMore} disabled={isLoading}>
                Load More
              </Button>
            </Box>
          )}
        </>
      )}

      <ExerciseDetail exercise={selected} open={!!selected} onClose={() => setSelected(null)} findGitHubImage={findGitHubImage} />
    </Box>
  );
}
