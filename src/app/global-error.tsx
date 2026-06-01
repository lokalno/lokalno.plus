"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="uk">
      <body>
        <div style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Помилка завантаження</h1>
          <p style={{ marginTop: "0.5rem", color: "#4b5563" }}>
            Сайт тимчасово недоступний. Спробуйте оновити сторінку.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Оновити
          </button>
        </div>
      </body>
    </html>
  );
}
