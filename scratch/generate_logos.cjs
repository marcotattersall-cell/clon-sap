const fs = require('fs');
const path = require('path');

// 1. Icon / Mark SVG (Square 512x512)
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <g fill="none" stroke-linejoin="round" stroke-linecap="round">
    <!-- Outer Cloud Stroke -->
    <path stroke="currentColor" stroke-width="26" d="
      M 160,370
      L 352,370
      C 405,370 448,327 448,274
      C 448,225 412,185 364,180
      C 350,132 306,96 256,96
      C 202,96 156,134 144,186
      C 134,180 120,176 106,176
      C 64,176 30,210 30,252
      C 30,296 64,330 106,330
      C 114,330 122,328 130,324
      Z
    " />
  </g>
  <!-- Isometric 3D Cube inside Cloud -->
  <g fill="currentColor" transform="translate(256, 230)">
    <!-- Top Face -->
    <polygon points="0,-48  42,-23  0,2  -42,-23" />
    <!-- Left Face -->
    <polygon points="-45,-17  -3,7  -3,57  -45,33" />
    <!-- Right Face -->
    <polygon points="3,7  45,-17  45,33  3,57" />
  </g>
</svg>
`;

// 2. Favicon SVG (optimized with dark slate stroke default, dark mode ready)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <style>
      .cloud-path { stroke: #0F172A; fill: none; stroke-width: 28; stroke-linecap: round; stroke-linejoin: round; }
      .cube-path { fill: #0F172A; }
      @media (prefers-color-scheme: dark) {
        .cloud-path { stroke: #F8FAFC; }
        .cube-path { fill: #F8FAFC; }
      }
    </style>
  </defs>
  <g>
    <path class="cloud-path" d="
      M 160,370
      L 352,370
      C 405,370 448,327 448,274
      C 448,225 412,185 364,180
      C 350,132 306,96 256,96
      C 202,96 156,134 144,186
      C 134,180 120,176 106,176
      C 64,176 30,210 30,252
      C 30,296 64,330 106,330
      C 114,330 122,328 130,324
      Z
    " />
  </g>
  <g class="cube-path" transform="translate(256, 230)">
    <!-- Top Face -->
    <polygon points="0,-48  42,-23  0,2  -42,-23" />
    <!-- Left Face -->
    <polygon points="-45,-17  -3,7  -3,57  -45,33" />
    <!-- Right Face -->
    <polygon points="3,7  45,-17  45,33  3,57" />
  </g>
</svg>
`;

// 3. Full Logo SVG (Matching image exactly)
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" width="100%" height="100%">
  <defs>
    <style>
      .nebex-cloud {
        fill: none;
        stroke: #0F172A;
        stroke-width: 24;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .nebex-cube {
        fill: #0F172A;
      }
      .nebex-text-title {
        font-family: 'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
        font-weight: 900;
        font-size: 72px;
        fill: #0F172A;
        letter-spacing: 0.28em;
        text-anchor: middle;
      }
      .nebex-text-sub {
        font-family: 'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
        font-weight: 600;
        font-size: 18px;
        fill: #0F172A;
        letter-spacing: 0.52em;
        text-anchor: middle;
        opacity: 0.88;
      }
    </style>
  </defs>

  <!-- Cloud Contour -->
  <path class="nebex-cloud" d="
    M 185,225
    L 415,225
    C 465,225 505,185 505,135
    C 505,88 470,50 424,46
    C 410,4 366,-30 314,-30
    C 258,-30 210,8 198,58
    C 188,52 174,48 160,48
    C 116,48 80,84 80,128
    C 80,172 116,208 160,208
    C 168,208 176,206 185,202
    Z
  " transform="translate(0, 45)" />

  <!-- 3D Cube inside cloud -->
  <g class="nebex-cube" transform="translate(300, 132)">
    <!-- Top Face -->
    <polygon points="0,-42  36,-21  0,0  -36,-21" />
    <!-- Left Face -->
    <polygon points="-38,-15  -3,6  -3,50  -38,29" />
    <!-- Right Face -->
    <polygon points="3,6  38,-15  38,29  3,50" />
  </g>

  <!-- NEBEX Brand Name -->
  <text x="300" y="370" class="nebex-text-title" dx="0.14em">NEBEX</text>

  <!-- CLOUD PLATFORM Subtitle -->
  <text x="300" y="420" class="nebex-text-sub" dx="0.26em">CLOUD PLATFORM</text>
</svg>
`;

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
fs.writeFileSync(path.join(publicDir, 'nebex-logo-mark.svg'), markSvg);
fs.writeFileSync(path.join(publicDir, 'nebex-logo-full.svg'), fullLogoSvg);

console.log("Successfully generated all SVG logo files in /public!");
