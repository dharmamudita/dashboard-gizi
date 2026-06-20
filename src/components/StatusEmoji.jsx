/**
 * StatusEmoji Component
 * Menampilkan 3 emoji wajah (Hijau/Kuning/Merah) sesuai status gizi anak
 * Sesuai dengan gambar referensi dari klien
 */

export default function StatusEmoji({ activeStatus = 'happy', size = 'lg', showLabels = true, animated = true, singleMode = false }) {
  const sizeMap = {
    sm: { container: 'w-16 h-16', stroke: 3 },
    md: { container: 'w-24 h-24', stroke: 3.5 },
    lg: { container: 'w-32 h-32', stroke: 4 },
    xl: { container: 'w-40 h-40', stroke: 4.5 },
  };

  const currentSize = sizeMap[size] || sizeMap.lg;

  const emojis = [
    {
      id: 'happy',
      label: 'Normal',
      sublabel: 'Sehat',
      color: '#22c55e',
      bgLight: '#dcfce7',
      isActive: activeStatus === 'happy',
    },
    {
      id: 'neutral',
      label: 'Stunted',
      sublabel: 'Perlu Perhatian',
      color: '#f59e0b',
      bgLight: '#fef3c7',
      isActive: activeStatus === 'neutral',
    },
    {
      id: 'sad',
      label: 'Severely Stunted',
      sublabel: 'Perlu Penanganan',
      color: '#ef4444',
      bgLight: '#fee2e2',
      isActive: activeStatus === 'sad',
    },
  ];

  const displayEmojis = singleMode ? emojis.filter(e => e.isActive) : emojis;

  return (
    <div className={`flex flex-wrap items-center justify-center ${singleMode ? '' : 'gap-4 md:gap-8'}`}>
      {displayEmojis.map((emoji, index) => (
        <div
          key={emoji.id}
          className={`
            flex flex-col items-center gap-3
            transition-all duration-500
            ${emoji.isActive ? (singleMode ? 'scale-100' : 'scale-110') : 'scale-90 opacity-40 grayscale'}
            ${animated ? 'animate-scale-in' : ''}
          `}
          style={{ animationDelay: `${index * 0.15}s` }}
        >
          {/* Emoji Face */}
          <div
            className={`
              ${currentSize.container} relative
              ${emoji.isActive && animated ? 'animate-bounce-soft' : ''}
            `}
          >
            {/* Glow effect for active */}
            {emoji.isActive && (
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse"
                style={{ backgroundColor: emoji.color }}
              />
            )}
            
            <svg
              viewBox="0 0 120 120"
              className={`${currentSize.container} relative z-10 drop-shadow-lg`}
              style={{ filter: emoji.isActive ? `drop-shadow(0 0 20px ${emoji.color}40)` : '' }}
            >
              {/* Outer circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={emoji.color}
                strokeWidth={currentSize.stroke + 1}
                opacity={emoji.isActive ? 1 : 0.5}
              />
              
              {/* Inner circle (face background) */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill={emoji.isActive ? emoji.bgLight : '#f5f5f5'}
                stroke="none"
              />

              {/* Eyes */}
              <circle cx="42" cy="48" r="6" fill={emoji.color} opacity={emoji.isActive ? 1 : 0.4}>
                {emoji.isActive && animated && (
                  <animate attributeName="r" values="6;5;6" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx="78" cy="48" r="6" fill={emoji.color} opacity={emoji.isActive ? 1 : 0.4}>
                {emoji.isActive && animated && (
                  <animate attributeName="r" values="6;5;6" dur="2s" repeatCount="indefinite" />
                )}
              </circle>

              {/* Mouth */}
              {emoji.id === 'happy' && (
                <path
                  d="M 35 72 Q 60 95 85 72"
                  fill="none"
                  stroke={emoji.color}
                  strokeWidth={currentSize.stroke}
                  strokeLinecap="round"
                  opacity={emoji.isActive ? 1 : 0.4}
                />
              )}
              {emoji.id === 'neutral' && (
                <line
                  x1="38"
                  y1="78"
                  x2="82"
                  y2="78"
                  stroke={emoji.color}
                  strokeWidth={currentSize.stroke}
                  strokeLinecap="round"
                  opacity={emoji.isActive ? 1 : 0.4}
                />
              )}
              {emoji.id === 'sad' && (
                <path
                  d="M 35 88 Q 60 65 85 88"
                  fill="none"
                  stroke={emoji.color}
                  strokeWidth={currentSize.stroke}
                  strokeLinecap="round"
                  opacity={emoji.isActive ? 1 : 0.4}
                />
              )}
            </svg>
          </div>

          {/* Labels */}
          {showLabels && (
            <div className="text-center">
              <p
                className="font-bold text-sm"
                style={{ color: emoji.isActive ? emoji.color : '#94a3b8' }}
              >
                {emoji.label}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">{emoji.sublabel}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Mini version of StatusEmoji for table/list usage
 */
export function StatusEmojiMini({ status, size = 28 }) {
  const config = {
    happy: { color: '#22c55e', bg: '#dcfce7', mouth: 'smile' },
    neutral: { color: '#f59e0b', bg: '#fef3c7', mouth: 'straight' },
    sad: { color: '#ef4444', bg: '#fee2e2', mouth: 'frown' },
  };

  const c = config[status] || config.happy;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="inline-block">
      <circle cx="60" cy="60" r="54" fill="none" stroke={c.color} strokeWidth="5" />
      <circle cx="60" cy="60" r="48" fill={c.bg} />
      <circle cx="42" cy="48" r="6" fill={c.color} />
      <circle cx="78" cy="48" r="6" fill={c.color} />
      {c.mouth === 'smile' && (
        <path d="M 35 72 Q 60 95 85 72" fill="none" stroke={c.color} strokeWidth="4" strokeLinecap="round" />
      )}
      {c.mouth === 'straight' && (
        <line x1="38" y1="78" x2="82" y2="78" stroke={c.color} strokeWidth="4" strokeLinecap="round" />
      )}
      {c.mouth === 'frown' && (
        <path d="M 35 88 Q 60 65 85 88" fill="none" stroke={c.color} strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  );
}
