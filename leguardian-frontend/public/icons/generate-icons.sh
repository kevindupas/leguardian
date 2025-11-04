#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p icons

# Main icon SVG (can be used as base for all sizes)
cat > /tmp/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" fill="#4f46e5" rx="50"/>

  <!-- Zap/Lightning icon for power -->
  <g transform="translate(256, 256)">
    <path d="M 0,-80 L -40,0 L -20,0 L -60,100 L 60,-100 L 20,0 L 40,0 Z" fill="white" stroke="white" stroke-width="4"/>
  </g>
</svg>
EOF

echo "Generated icon template at /tmp/icon.svg"
echo "Note: SVG icons have been created. For production, use a proper icon generator tool."
