#!/usr/bin/env bash
# Verifies that required icon assets exist for Expo/Android launcher.
# Run from repo root: ./scripts/check-icon-assets.sh
# Or from app/: ./scripts/check-icon-assets.sh (script detects app dir)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ASSETS="$APP_DIR/assets"

missing=0

if [ ! -f "$ASSETS/icon.png" ]; then
  echo "Missing: $ASSETS/icon.png (required for app icon)"
  missing=1
fi
if [ ! -f "$ASSETS/adaptive-icon.png" ]; then
  echo "Missing: $ASSETS/adaptive-icon.png (required for Android adaptive icon foreground)"
  missing=1
fi

if [ "$missing" -eq 1 ]; then
  echo ""
  echo "--- Instructions ---"
  echo "1. Add the following files into: $ASSETS/"
  echo "   - icon.png         (recommended: 1024x1024 px, used globally and as fallback)"
  echo "   - adaptive-icon.png (recommended: 1024x1024 px, transparent background; only the center ~66% is safe on round icons)"
  echo "2. If you only have one image, copy it to both names temporarily:"
  echo "   cp path/to/your-icon.png $ASSETS/icon.png"
  echo "   cp path/to/your-icon.png $ASSETS/adaptive-icon.png"
  echo "3. Regenerate the native Android project so the launcher uses the new assets:"
  echo "   cd $APP_DIR && npx expo prebuild --platform android --clean"
  exit 1
fi

echo "Icon assets OK: icon.png and adaptive-icon.png found in $ASSETS/"
exit 0
