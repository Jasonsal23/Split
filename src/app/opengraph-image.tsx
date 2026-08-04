import { ImageResponse } from "next/og";

export const alt = "Split — Train Honest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
        }}
      >
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            letterSpacing: -4,
            color: "#f4f4f5",
          }}
        >
          Split
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 34,
            color: "#a1a1aa",
          }}
        >
          Train honest.
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 24,
            color: "#71717a",
            maxWidth: 760,
            textAlign: "center",
          }}
        >
          Your training plan, rewritten by how you actually ran.
        </div>
      </div>
    ),
    { ...size },
  );
}
