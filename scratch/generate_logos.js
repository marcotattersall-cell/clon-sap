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

// 2. Favicon SVG (optimized with dark slate stroke default)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <g fill="none" stroke-linejoin="round" stroke-linecap="round">
    <path stroke="#0F172A" stroke-width="28" d="
      M 155,365
      L 355,365
      C 410,365 452,323 452,268
      C 452,218 415,178 366,173
      C 352,122 308,84 256,84
      C 200,84 152,124 140,178
      C 130,172 116,168 102,168
      C 58,168 24,202 24,246
      C 24,290 58,324 102,324
      C 112,324 122,321 130,316
      Z
    " />
  </g>
  <g fill="#0F172A" transform="translate(256, 222)">
    <!-- Top Face -->
    <polygon points="0,-50  44,-24  0,2  -44,-24" />
    <!-- Left Face -->
    <polygon points="-47,-18  -3,7  -3,60  -47,35" />
    <!-- Right Face -->
    <polygon points="3,7  47,-18  47,35  3,60" />
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
