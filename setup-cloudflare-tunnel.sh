#!/bin/bash

echo "Setting up Cloudflare Tunnel for PFL 2025..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "Error: cloudflared is not installed. Please install it first."
    exit 1
fi

# Get the tunnel ID from the credentials file
TUNNEL_ID=$(ls /home/cope413/.cloudflared/*.json | head -1 | xargs basename -s .json)
echo "Found tunnel ID: $TUNNEL_ID"

# Update the config file with the correct tunnel ID
sed -i "s/tunnel: .*/tunnel: $TUNNEL_ID/" cloudflared-config.yml
sed -i "s|credentials-file: .*|credentials-file: /home/cope413/.cloudflared/$TUNNEL_ID.json|" cloudflared-config.yml

echo "Please update the hostname in cloudflared-config.yml with your actual domain name."
echo "Then run the following commands to install the services:"
echo ""
echo "sudo cp pfl-2025.service /etc/systemd/system/"
echo "sudo cp cloudflared-tunnel.service /etc/systemd/system/"
echo "sudo systemctl daemon-reload"
echo "sudo systemctl enable pfl-2025.service"
echo "sudo systemctl enable cloudflared-tunnel.service"
echo "sudo systemctl start pfl-2025.service"
echo "sudo systemctl start cloudflared-tunnel.service"
echo ""
echo "To check the status:"
echo "sudo systemctl status pfl-2025.service"
echo "sudo systemctl status cloudflared-tunnel.service"

