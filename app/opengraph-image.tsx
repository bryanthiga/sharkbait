import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sharkbait — Live Shark Tracker";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #020617 0%, #0f2744 60%, #0d9488 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 180, lineHeight: 1, marginBottom: 24 }}>🦈</div>
        <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -2 }}>
          Sharkbait
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: "#5eead4",
            marginTop: 8,
            letterSpacing: 6,
          }}
        >
          LIVE SHARK TRACKER
        </div>
      </div>
    ),
    { ...size },
  );
}
