import data from "../data/sites.json";

export type CircuitId = "jyotirlinga" | "shakti" | "dham" | "divya";
export type Script = "deva" | "tamil";

export type Site = {
  id: string;
  n: number;
  circuit: CircuitId;
  name: string;
  place: string;
  state?: string | null;
  local?: string | null;
  script: Script;
  lat: number | null;
  lon: number | null;
  approx?: boolean;
  note?: string | null;
  wiki?: string | null;
  // Shakti Peetha
  part?: string | null;
  shakti?: string | null;
  bhairava?: string | null;
  localPart?: string;
  localPlace?: string;
  localShakti?: string;
  localBhairava?: string;
  // Divya Desam
  deities?: string;
  celestial?: boolean;
  // Char Dham
  dir?: "North" | "East" | "South" | "West";
};

export type Circuit = {
  id: CircuitId;
  name: string;
  single: string;
  local: string;
  script: Script;
  total: number;
  intro: string;
  tips: string[];
  source: string;
};

export const CIRCUITS: Circuit[] = [
  {
    id: "jyotirlinga",
    name: "Jyotirlingas",
    single: "Jyotirlinga",
    local: "द्वादश ज्योतिर्लिंग",
    script: "deva",
    total: 12,
    intro:
      "Twelve shrines where Shiva is worshipped as a jyotirlinga, a pillar of light. The Shiva Purana names all twelve, from Somnath on the western coast to Baidyanath in the east.",
    tips: [
      "Kedarnath is open only in the warmer months, usually from late April or May until around Diwali. The opening and closing dates are announced each year.",
      "Kedarnath is reached by a mountain trek of roughly 16 km from Gaurikund. Ponies, palkis and helicopter services also run in season.",
      "Some rituals, such as the Bhasma Aarti at Mahakaleshwar in Ujjain, need passes booked in advance through the temple's official website.",
      "Aundha Nagnath in Maharashtra and Jageshwar in Uttarakhand are also revered as the Nagesh jyotirlinga. This app follows the Dwarka identification.",
    ],
    source: "Jyotirlinga",
  },
  {
    id: "shakti",
    name: "Shakti Peethas",
    single: "Shakti Peetha",
    local: "इक्यावन शक्तिपीठ",
    script: "deva",
    total: 51,
    intro:
      "Fifty-one seats of the Goddess, each where a part of Sati's body or an ornament is said to have fallen. This list follows the Tantra Chudamani. Several pithas lie in Pakistan, Bangladesh, Nepal, Sri Lanka and Tibet.",
    tips: [
      "Pithas outside India need a passport, and some need visas or special permits. Manas, by Lake Manasarovar, is reached through the organised Kailash Manasarovar Yatra.",
      "Where the Tantra Chudamani's site is uncertain, the app marks the shrine worshipped today and notes the older identification on its plaque.",
      "Many Shakti temples are busiest during the two Navratris each year, so expect long queues then.",
      "Locations marked approximate point to the town, not the shrine. Confirm the exact temple locally before travelling.",
    ],
    source: "Shakti Peetha",
  },
  {
    id: "dham",
    name: "Char Dham",
    single: "Dham",
    local: "चार धाम",
    script: "deva",
    total: 4,
    intro:
      "The four abodes at the corners of India, associated with Adi Shankara: Badrinath in the north, Puri in the east, Rameswaram in the south and Dwarka in the west.",
    tips: [
      "Badrinath closes for the winter, usually from November until April or May. The dates are announced each year.",
      "The Jagannath temple at Puri admits only Hindus.",
      "Rameswaram is also a Jyotirlinga, and Badrinath and Dwarka are also Divya Desams. Lighting the lamp at one offers to light its twin.",
    ],
    source: "Char Dham",
  },
  {
    id: "divya",
    name: "Divya Desams",
    single: "Divya Desam",
    local: "திவ்ய தேசம்",
    script: "tamil",
    total: 108,
    intro:
      "The 108 abodes of Vishnu and Lakshmi sung by the twelve Alvars in the Naalayira Divya Prabandham. 106 are on earth, most of them in Tamil Nadu. Tirupparkadal and Paramapadam, the last two, are celestial.",
    tips: [
      "Kanchipuram alone holds more than a dozen Divya Desams, and the Thirunangur group lies close together near Sirkazhi, so a day or two in each covers many.",
      "The nine Nava Tirupati temples near Srivaikuntam on the Thamirabarani are often visited together.",
      "Muktinath in Nepal is the only Divya Desam outside India and is also a Shakti Peetha.",
      "Locations marked approximate come only from a summary table. Confirm the exact temple before travelling.",
    ],
    source: "Divya Desam",
  },
];

export const CIRCUIT: Record<CircuitId, Circuit> = Object.fromEntries(CIRCUITS.map((c) => [c.id, c])) as Record<
  CircuitId,
  Circuit
>;

type Raw = Record<string, unknown> & { id: string };
const tag = (rows: Raw[], circuit: CircuitId, script: Script): Site[] =>
  rows.map((r) => ({ ...(r as unknown as Site), circuit, script }));

export const SITES: Record<CircuitId, Site[]> = {
  jyotirlinga: tag(data.jyotirlinga as Raw[], "jyotirlinga", "deva"),
  shakti: tag(data.shakti as Raw[], "shakti", "deva"),
  dham: tag(data.dham as Raw[], "dham", "deva"),
  divya: tag(data.divya as Raw[], "divya", "tamil"),
};

export const ALL_SITES: Site[] = CIRCUITS.flatMap((c) => SITES[c.id]);
export const SITE_BY_ID: Record<string, Site> = Object.fromEntries(ALL_SITES.map((s) => [s.id, s]));
export const TOTAL = ALL_SITES.length;

// The same temple counted in two circuits
export const TWINS: Record<string, string> = {
  "jl-07": "cd-4",
  "cd-4": "jl-07",
  "cd-1": "dd-100",
  "dd-100": "cd-1",
  "cd-2": "dd-104",
  "dd-104": "cd-2",
  "sp-11": "dd-101",
  "dd-101": "sp-11",
};

export const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
export const directionsUrl = (s: Site) =>
  `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`;
