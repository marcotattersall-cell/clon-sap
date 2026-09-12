import React from 'react';

/**
 * AxomiraLogo / SynapseLogo - Vectorized Brand Logo Component for SYNAPSE Enterprise ERP
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
  const mainColor = color || (dark ? '#FFFFFF' : '#1E293B');
  const cobaltColor = '#2563EB';
  const emeraldColor = dark ? '#10B981' : '#059669';

  // Mark / Icon Variant (The Synapse Infinity Loop Symbol)
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
          <linearGradient id="synapseGradMark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer Shield Frame */}
        <rect
          x="32"
          y="32"
          width="448"
          height="448"
          rx="110"
          fill="none"
          stroke="url(#synapseGradMark)"
          strokeWidth="16"
          opacity="0.25"
        />

        {/* Core Synapse Infinity Emblem */}
        <g strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M 160,256 C 100,160 50,256 160,340 C 270,420 240,92 352,172 C 462,256 412,352 352,340 C 240,320 270,92 160,172 C 100,210 120,256 160,256 Z"
            fill="none"
            stroke="url(#synapseGradMark)"
            strokeWidth="36"
          />
          {/* Central Focal Node */}
          <circle cx="256" cy="256" r="20" fill={emeraldColor} />
        </g>
      </svg>
    );
  }

  // Horizontal Variant
  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`} {...props}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className="w-8 h-8 flex-shrink-0"
        >
          <defs>
            <linearGradient id="synapseGradHoriz" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <g strokeLinejoin="round" strokeLinecap="round">
            <path
              d="M 160,256 C 100,160 50,256 160,340 C 270,420 240,92 352,172 C 462,256 412,352 352,340 C 240,320 270,92 160,172 Z"
              fill="none"
              stroke="url(#synapseGradHoriz)"
              strokeWidth="38"
            />
            <circle cx="256" cy="256" r="22" fill={emeraldColor} />
          </g>
        </svg>
        <div className="flex flex-col leading-none">
          <span
            className="font-black tracking-[0.22em] text-base uppercase"
            style={{ color: mainColor, fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
          >
            SYNAPSE
          </span>
          <span
            className="font-extrabold tracking-[0.28em] text-[8px] uppercase mt-0.5 text-blue-600 dark:text-blue-400"
            style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
          >
            ENTERPRISE ERP
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
        <linearGradient id="synapseGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Symbol Emblem */}
      <g strokeLinejoin="round" strokeLinecap="round" transform="translate(44, -10)">
        <path
          d="M 160,200 C 100,110 50,200 160,280 C 270,350 240,50 352,130 C 462,200 412,280 352,270 C 240,250 270,50 160,130 Z"
          fill="none"
          stroke="url(#synapseGradFull)"
          strokeWidth="34"
        />
        <circle cx="256" cy="195" r="20" fill={emeraldColor} />
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
          fontSize: '66px',
          letterSpacing: '0.22em'
        }}
      >
        SYNAPSE
      </text>

      {/* Subtitle */}
      <text
        x="300"
        y="415"
        fill={cobaltColor}
        textAnchor="middle"
        dx="0.22em"
        style={{
          fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: '17px',
          letterSpacing: '0.42em'
        }}
      >
        AUTONOMOUS ENTERPRISE OPERATING SYSTEM
      </text>
    </svg>
  );
}

export default AxomiraLogo;
