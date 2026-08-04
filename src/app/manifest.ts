import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Split — Train Honest",
    short_name: "Split",
    description:
      "An adaptive running coach that rewrites your plan based on how you actually ran.",
    start_url: "/today",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
