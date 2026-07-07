import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Branded favicon: matches the indigo "N" mark used in the shared site header.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4f46e5",
          borderRadius: 7,
          color: "white",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "Arial, sans-serif",
        }}
      >
        N
      </div>
    ),
    { ...size }
  );
}
