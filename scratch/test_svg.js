const fs = require('fs');
const path = require('path');

// 1. Full Logo SVG (Cloud + Isometric Cube + NEBEX + CLOUD PLATFORM)
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 380" width="100%" height="100%">
  <defs>
    <style>
      .cloud-stroke {
        fill: none;
        stroke: #0F172A;
        stroke-width: 18;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .cube-face {
        fill: #0F172A;
      }
      .brand-title {
        font-family: 'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
        font-weight: 900;
        font-size: 52px;
        fill: #0F172A;
        letter-spacing: 0.22em;
        text-anchor: middle;
      }
      .brand-subtitle {
        font-family: 'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
        font-weight: 600;
        font-size: 15px;
        fill: #0F172A;
        letter-spacing: 0.42em;
        text-anchor: middle;
        opacity: 0.85;
      }
    </style>
  </defs>

  <!-- Cloud Outline -->
  <path class="cloud-stroke" d="
    M 155,200
    L 345,200
    C 385,200 415,172 415,135
    C 415,100 388,72 352,70
    C 338,36 302,12 258,12
    C 208,12 168,40 152,82
    C 142,75 128,70 115,70
    C 78,70 48,100 48,138
    C 48,175 78,200 115,200
    Z
  " />

  <!-- Isometric 3D Cube (Inside Cloud) -->
  <g transform="translate(250, 114)">
    <!-- Top Face -->
    <polygon class="cube-face" points="0,-32  30,-15  0,2  -30,-15" />
    <!-- Left Face -->
    <polygon class="cube-face" points="-32,-11  -2,6  -2,41  -32,24" />
    <!-- Right Face -->
    <polygon class="cube-face" points="2,6  32,-11  32,24  2,41" />
  </g>

  <!-- Brand Typography -->
  <!-- dx shift balances text-anchor with wide letter-spacing -->
  <text x="250" y="295" class="brand-title" dx="0.11em">NEBEX</text>
  <text x="250" y="338" class="brand-subtitle" dx="0.21em">CLOUD PLATFORM</text>
</svg>
`;

// 2. Icon-Only Favicon SVG (Square 512x512 with margin)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <style>
      .cloud-stroke {
        fill: none;
        stroke: #0F172A;
        stroke-width: 32;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .cube-face {
        fill: #0F172A;
      }
    </style>
  </defs>

  <!-- Cloud Outline centered -->
  <path class="cloud-stroke" d="
    M 160,370
    L 352,370
    C 416,370 464,322 464,258
    C 464,196 418,148 358,144
    C 334,84 276,42 206,42
    C 126,42 62,90 36,160
    C 20,150 -2,142 -20,142
    Z
  " transform="translate(0, 0)" />
</svg>
`;

console.log("SVG Builder script executed successfully");
