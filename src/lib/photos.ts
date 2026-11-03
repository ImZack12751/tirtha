import credits from "../data/photos.json";
import type { CircuitId } from "./sites";

export type Credit = { artist: string; license: string; page: string };
const CREDITS = credits as Record<string, Credit>;

const base = import.meta.env.BASE_URL;
export const hasPhoto = (id: string) => id in CREDITS;
export const photoUrl = (id: string) => `${base}photos/${id}.webp`;
export const thumbUrl = (id: string) => `${base}photos/t/${id}.webp`;
export const creditFor = (id: string): Credit | undefined => CREDITS[id];

// cover photo for each circuit, and for home, chosen from the temples' own photos
export const COVER: Record<CircuitId | "home", string> = {
  home: "jl-01",
  jyotirlinga: "jl-11",
  shakti: "sp-17",
  dham: "cd-1",
  divya: "dd-001",
};
