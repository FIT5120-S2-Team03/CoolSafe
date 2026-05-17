export const ROUTINE_META = {
  morning: {
    title: 'A lovely window. Use it.',
    bg: 'linear-gradient(180deg,#FAEEDA 0%,#F6E4B7 100%)',
    svg: (
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <circle cx="320" cy="120" fill="#F2DDB3" r="70" />
        <circle cx="320" cy="120" fill="#D49A3A" r="48" />
        <path d="M0 130 Q80 110 160 125 T320 120 L400 125 L400 160 L0 160 Z" fill="#6B7A3A" />
        <path d="M0 140 Q100 130 200 138 T400 135 L400 160 L0 160 Z" fill="#4F5A2B" />
        <path d="M90 60 Q95 55 100 60 Q105 55 110 60" fill="none" stroke="#221E1A" strokeLinecap="round" strokeWidth="2" />
        <path d="M140 75 Q145 70 150 75 Q155 70 160 75" fill="none" stroke="#221E1A" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
  },
  midday: {
    title: 'Stay cool while heat is loudest.',
    bg: 'linear-gradient(180deg,#FAEEDA 0%,#F6D0BD 100%)',
    svg: (
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <circle cx="200" cy="60" fill="#FAEEDA" r="44" />
        <circle cx="200" cy="60" fill="#B85A3C" r="32" />
        <g stroke="#B85A3C" strokeLinecap="round" strokeWidth="3">
          <line x1="200" x2="200" y1="0" y2="14" />
          <line x1="140" x2="156" y1="60" y2="60" />
          <line x1="244" x2="260" y1="60" y2="60" />
          <line x1="158" x2="168" y1="18" y2="28" />
          <line x1="242" x2="232" y1="18" y2="28" />
        </g>
        <path d="M0 130 Q50 122 100 130 T200 130 T300 130 T400 130 L400 160 L0 160 Z" fill="#D4783A" />
        <path d="M0 140 Q50 132 100 140 T200 140 T300 140 T400 140 L400 160 L0 160 Z" fill="#A8503E" />
      </svg>
    ),
  },
  evening: {
    title: 'Wind down and reset your space.',
    bg: 'linear-gradient(180deg,#B9B0A1 0%,#8FA3B1 100%)',
    svg: (
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <path d="M0 0 L400 0 L400 100 L0 100 Z" fill="#B9B0A1" />
        <circle cx="100" cy="50" fill="#FAF6EE" r="22" />
        <circle cx="108" cy="46" fill="#B9B0A1" r="22" />
        <circle cx="280" cy="35" fill="#FAF6EE" r="2" />
        <circle cx="340" cy="55" fill="#FAF6EE" r="1.5" />
        <circle cx="220" cy="25" fill="#FAF6EE" r="1.8" />
        <path d="M0 100 Q60 80 120 95 Q180 75 240 92 Q300 78 360 90 Q380 88 400 95 L400 160 L0 160 Z" fill="#5B7A8C" />
        <path d="M0 120 Q80 105 160 118 T320 115 L400 120 L400 160 L0 160 Z" fill="#3F5564" />
      </svg>
    ),
  },
}
