import { useEffect, useState } from "react";

export type Route =
  | { name: "home" }
  | { name: "circuit"; id: string }
  | { name: "site"; id: string }
  | { name: "map"; site?: string; circuit?: string }
  | { name: "journal" }
  | { name: "settings" };

export function parse(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const parts = path.split("/").filter(Boolean);
  const q = new URLSearchParams(query);
  switch (parts[0]) {
    case "circuit":
      return { name: "circuit", id: parts[1] ?? "" };
    case "site":
      return { name: "site", id: parts[1] ?? "" };
    case "map":
      return { name: "map", site: q.get("site") ?? undefined, circuit: q.get("circuit") ?? undefined };
    case "journal":
      return { name: "journal" };
    case "settings":
      return { name: "settings" };
    default:
      return { name: "home" };
  }
}

export function useRoute(): Route {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => {
      setHash(location.hash);
      window.scrollTo({ top: 0 });
    };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return parse(hash);
}

export const href = {
  home: "#/",
  circuit: (id: string) => `#/circuit/${id}`,
  site: (id: string) => `#/site/${id}`,
  map: (site?: string) => (site ? `#/map?site=${site}` : "#/map"),
  journal: "#/journal",
  settings: "#/settings",
};
