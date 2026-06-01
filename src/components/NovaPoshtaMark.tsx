type NovaPoshtaMarkProps = {
  className?: string;
};

export default function NovaPoshtaMark({ className = "h-11 w-11 shrink-0" }: NovaPoshtaMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Nova Poshta"
    >
      <rect width="48" height="48" rx="10" fill="#ED1C24" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="18"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        NP
      </text>
    </svg>
  );
}
