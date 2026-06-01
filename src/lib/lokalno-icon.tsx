/** Shared favicon / app icon markup (matches Header logo: green tile + L). */
export function LokalnoIconMark({ size }: { size: number }) {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.56);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#008a4a",
        borderRadius: radius,
        color: "#ffffff",
        fontSize,
        fontWeight: 700,
        fontFamily: "Inter, system-ui, sans-serif",
        lineHeight: 1,
      }}
    >
      L
    </div>
  );
}
