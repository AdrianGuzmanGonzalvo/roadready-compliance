#!/bin/sh
# One-time setup of RoadReady's own Cloudflare Tunnel, run on the server from the
# repo folder: `sh docker/setup-tunnel.sh`. Creates the tunnel "roadready" (once)
# with the host's cloudflared and its account certificate (~/.cloudflared/cert.pem),
# then writes ./cloudflared/ (credentials + config, gitignored), which the `tunnel`
# service in docker-compose.yml runs. Touches no other tunnel. Safe to run again.
# The DNS records are added by hand in Cloudflare: it prints what they point to.
set -eu
cd "$(dirname "$0")/.."
name=roadready

# Run cloudflared with a config of its own: by default it reads
# ~/.cloudflared/config.yml, which on this server belongs to another site's
# tunnel, and `tunnel info <name>` then answers about that tunnel instead.
cfg=$(mktemp)
trap 'rm -f "$cfg"' EXIT
echo "no-autoupdate: true" > "$cfg"
tunnel_id() {
  cloudflared tunnel --config "$cfg" list --name "$name" --output json 2> /dev/null | jq -r '.[0].id // empty'
}

id=$(tunnel_id)
if [ -z "$id" ]; then
  cloudflared tunnel --config "$cfg" create "$name"
  id=$(tunnel_id)
fi
[ -n "$id" ] || { echo "could not read the tunnel id"; exit 1; }

mkdir -p cloudflared
cp "$HOME/.cloudflared/$id.json" cloudflared/credentials.json
chmod 600 cloudflared/credentials.json
cat > cloudflared/config.yml <<EOF
tunnel: $id
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: nuevo.roadready-compliance.com
    service: http://app:3000
  - hostname: roadready-compliance.com
    service: http://app:3000
  - hostname: www.roadready-compliance.com
    service: http://app:3000
  - service: http_status:404
EOF

echo "tunnel $name: $id"
echo "DNS target (CNAME, proxied): $id.cfargotunnel.com"
