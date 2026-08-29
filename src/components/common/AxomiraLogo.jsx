import React from 'react';

/**
 * AxomiraLogo - Vectorized Brand Logo Component for AXOMIRA Intelligent Cloud ERP
 *
 * @param {Object} props
 * @param {'full' | 'mark' | 'horizontal' | 'icon'} [props.variant='full'] - Logo layout mode
 * @param {string} [props.className] - Extra Tailwind / CSS classes
 * @param {number|string} [props.size] - Custom width/height or size scaling
 * @param {string} [props.color] - Custom fill/stroke color
 * @param {boolean} [props.dark=false] - Invert colors for dark backgrounds
 */
export function AxomiraLogo({
  variant = 'full',
  className = '',
  size,
  color,
  dark = false,
  ...props
}) {
  const mainColor = color || (dark ? '#FFFFFF' : '#0284C7');
  const accentColor = dark ? '#34D399' : '#10B981';

  // Mark / Icon Variant (The Axomira Horizon A Symbol)
  if (variant === 'mark' || variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width={size || '100%'}
        height={size || '100%'}
        className={`inline-block ${className}`}
        {...props}
      >
        <defs>
          <linearGradient id="axomiraGradMark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* Outer Hex Shield Frame */}
        <path
          d="M 256,40 L 440,140 L 440,370 L 256,470 L 72,370 L 72,140 Z"
          fill="none"
          stroke="url(#axomiraGradMark)"
          strokeWidth="16"
          strokeLinejoin="round"
          opacity="0.25"
        />

        {/* Core Axomira Precision A Horizon Emblem */}
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* Left leg of A */}
          <path
            d="M 120,410 L 256,100 L 290,170"
            fill="none"
            stroke="url(#axomiraGradMark)"
            strokeWidth="32"
          />
          {/* Right leg of A */}
          <path
            d="M 220,170 L 256,100 L 392,410"
            fill="none"
            stroke="url(#axomiraGradMark)"
            strokeWidth="32"
          />
          {/* Horizontal Precision Optical Beam (The Axomira Horizon) */}
          <path
            d="M 100,280 L 412,280"
            fill="none"
            stroke="url(#axomiraGradMark)"
            strokeWidth="24"
          />
          {/* Sharp Focal Node */}
          <circle cx="256" cy="280" r="18" fill={accentColor} />
        </g>
      </svg>
    );
  }

  // Horizontal Variant
  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`} {...props}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className="w-8 h-8 flex-shrink-0"
        >
          <defs>
            <linearGradient id="axomiraGradHoriz" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <g strokeLinejoin="round" strokeLinecap="round">
            <path
              d="M 120,410 L 256,100 L 392,410"
              fill="none"
              stroke="url(#axomiraGradHoriz)"
              strokeWidth="36"
            />
            <path
              d="M 90,280 L 422,280"
              fill="none"
              stroke="url(#axomiraGradHoriz)"
              strokeWidth="28"
            />
            <circle cx="256" cy="280" r="22" fill={accentColor} />
          </g>
        </svg>
        <div className="flex flex-col leading-none">
          <span
            className="font-black tracking-[0.24em] text-base uppercase"
            style={{ color: mainColor, fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
          >
            AXOMIRA
          </span>
          <span
            className="font-extrabold tracking-[0.32em] text-[8px] uppercase mt-0.5 text-emerald-500"
            style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
          >
            INTELLIGENT CLOUD ERP
          </span>
        </div>
      </div>
    );
  }

  // Full Stacked Variant
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 480"
      width={size || '100%'}
      height={size || '100%'}
      className={`inline-block ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="axomiraGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Symbol Emblem */}
      <g strokeLinejoin="round" strokeLinecap="round" transform="translate(44, 0)">
        <path
          d="M 160,260 L 256,60 L 352,260"
          fill="none"
          stroke="url(#axomiraGradFull)"
          strokeWidth="32"
        />
        <path
          d="M 110,180 L 402,180"
          fill="none"
          stroke="url(#axomiraGradFull)"
          strokeWidth="24"
        />
        <circle cx="256" cy="180" r="18" fill={accentColor} />
      </g>

      {/* Brand Title */}
      <text
        x="300"
        y="360"
        fill={mainColor}
        textAnchor="middle"
        dx="0.14em"
        style={{
          fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
          fontWeight: 900,
          fontSize: '68px',
          letterSpacing: '0.24em'
        }}
      >
        AXOMIRA
      </text>

      {/* Subtitle */}
      <text
        x="300"
        y="415"
        fill={accentColor}
        textAnchor="middle"
        dx="0.22em"
        style={{
          fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: '18px',
          letterSpacing: '0.45em'
        }}
      >
        INTELLIGENT CLOUD ERP
      </text>
    </svg>
  );
}

export default AxomiraLogo;
