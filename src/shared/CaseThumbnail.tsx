export default function CaseThumbnail({
  type,
  color = '#ffe031',
}: {
  type: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 100 110" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={`body-${type}`}
          x1="20"
          y1="10"
          x2="90"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#424950" />
          <stop offset="1" stopColor="#181c20" />
        </linearGradient>
      </defs>
      <path d="M22 20 63 9 87 22 46 35Z" fill="#3d4449" stroke="#60676c" strokeWidth=".8" />
      <path d="M22 20v70l24 14V35Z" fill="#171c20" stroke="#555d63" strokeWidth=".8" />
      <path
        d="M46 35 87 22v70l-41 12Z"
        fill={`url(#body-${type})`}
        stroke="#63696b"
        strokeWidth=".8"
      />
      <path
        d="M50 38 82 28v59l-32 10Z"
        fill={type === 'open' ? '#101518' : '#1c2428'}
        stroke="#555e62"
        strokeWidth=".6"
      />
      <path d="M53 48 72 43v31l-19 6Z" fill="#282e31" stroke="#495253" />
      <path d="m54 70 22-6v8l-22 6Z" fill="#60665c" />
      <path d="m54 70 22-6" stroke={color} strokeWidth="1.8" />
      {[43, 57, 71].map((y) => (
        <g key={y}>
          <ellipse
            cx="34"
            cy={y}
            rx="7.1"
            ry="8.5"
            transform={`rotate(-14 34 ${y})`}
            stroke={color}
            strokeWidth="2"
          />
          <ellipse cx="34" cy={y} rx="2" ry="3" fill="#5b6355" />
        </g>
      ))}
      {[57, 69, 80].map((x) => (
        <ellipse
          key={x}
          cx={x}
          cy={94 - (x - 57) / 3}
          rx="4"
          ry="2"
          stroke={color}
          strokeWidth="1.5"
        />
      ))}
      {type === 'airflow' &&
        Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`m25 ${29 + i * 5} 17 10`} stroke="#323a3e" strokeWidth="2" />
        ))}
      {type === 'compact' && <path d="M24 25v59l19 11V36Z" fill="#333a40" />}
      <path d="m51 38 15-5-15 63Z" fill="#fff" opacity={type === 'open' ? 0 : 0.035} />
      <path d="M25 94v5m55-4v5" stroke="#5f666c" strokeWidth="3" />
    </svg>
  );
}
