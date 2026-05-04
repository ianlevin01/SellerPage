#!/bin/bash
set -e
KEY="$(dirname "$0")/math_keys.pem"
HOST="ubuntu@54.20.40.176"

echo "📦 Building..."
npm run build

echo "🚀 Uploading..."
scp -i "$KEY" -r dist/* "$HOST:/var/www/sellerpage/"

echo "🔧 Fixing permissions & reloading nginx..."
ssh -i "$KEY" "$HOST" "
  sudo find /var/www/sellerpage -type d -exec chmod 755 {} \; &&
  sudo find /var/www/sellerpage -type f -exec chmod 644 {} \; &&
  sudo systemctl reload nginx
"

echo "✅ Deploy completo"
