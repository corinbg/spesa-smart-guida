import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Spesa Smart — La tua lista" },
    { name: "description", content: "Organizza la lista e registra il totale della tua spesa." },
    { property: "og:title", content: "Spesa Smart — La tua lista" },
    { property: "og:description", content: "Organizza la lista e registra il totale della tua spesa." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/preparazione" });
  },
});
