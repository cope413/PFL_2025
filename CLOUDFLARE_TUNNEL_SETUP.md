# Cloudflare Tunnel Setup for PFL 2025

This guide will help you set up your PFL 2025 application to run through a Cloudflare tunnel, allowing you to serve your application through your domain without exposing your server directly to the internet.

## Prerequisites

1. A Cloudflare account
2. A domain name managed by Cloudflare
3. Linux server with sudo access

## Files Created

- `cloudflared-config.yml` - Tunnel configuration
- `start-production.sh` - Script to build and start the application
- `pfl-2025.service` - Systemd service for the Next.js app
- `cloudflared-tunnel.service` - Systemd service for the tunnel
- `setup-cloudflare-tunnel.sh` - Automated setup script

## Setup Instructions

### 1. Update Domain Configuration

Edit `cloudflared-config.yml` and replace `your-domain.com` with your actual domain:

```yaml
tunnel: 74c02aa9-00f1-41a0-9a20-8ecc91cd1240
credentials-file: /home/cope413/.cloudflared/74c02aa9-00f1-41a0-9a20-8ecc91cd1240.json

ingress:
  - hostname: your-actual-domain.com  # Replace this
    service: http://localhost:3000
  - service: http_status:404
```

### 2. Install Systemd Services

Run the following commands to install the services:

```bash
sudo cp pfl-2025.service /etc/systemd/system/
sudo cp cloudflared-tunnel.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pfl-2025.service
sudo systemctl enable cloudflared-tunnel.service
```

### 3. Start the Services

```bash
sudo systemctl start pfl-2025.service
sudo systemctl start cloudflared-tunnel.service
```

### 4. Verify Setup

Check the status of both services:

```bash
sudo systemctl status pfl-2025.service
sudo systemctl status cloudflared-tunnel.service
```

## Management Commands

### Start Services
```bash
sudo systemctl start pfl-2025.service
sudo systemctl start cloudflared-tunnel.service
```

### Stop Services
```bash
sudo systemctl stop pfl-2025.service
sudo systemctl stop cloudflared-tunnel.service
```

### Restart Services
```bash
sudo systemctl restart pfl-2025.service
sudo systemctl restart cloudflared-tunnel.service
```

### View Logs
```bash
sudo journalctl -u pfl-2025.service -f
sudo journalctl -u cloudflared-tunnel.service -f
```

## Manual Testing

To test the tunnel manually:

1. Start your application:
   ```bash
   npm run build
   npm start
   ```

2. In another terminal, start the tunnel:
   ```bash
   cloudflared tunnel --config cloudflared-config.yml run
   ```

## Troubleshooting

### Check Tunnel Status
```bash
cloudflared tunnel list
```

### View Tunnel Logs
```bash
cloudflared tunnel info 74c02aa9-00f1-41a0-9a20-8ecc91cd1240
```

### Test Connection
```bash
curl -I http://localhost:3000
```

### Common Issues

1. **Application not starting**: Check if port 3000 is available
2. **Tunnel not connecting**: Verify your domain is properly configured in Cloudflare
3. **SSL issues**: Ensure your domain has SSL enabled in Cloudflare

## Security Notes

- The tunnel credentials are stored in `/home/cope413/.cloudflared/`
- Keep these files secure and don't share them
- The tunnel provides SSL termination and DDoS protection
- Your server's IP is not exposed to the internet

## Domain Configuration

Make sure your domain in Cloudflare has:
- DNS records pointing to the tunnel
- SSL/TLS encryption mode set to "Full" or "Full (strict)"
- Proxy status enabled (orange cloud icon)

## Next Steps

1. Update the domain in `cloudflared-config.yml`
2. Install the systemd services
3. Test the setup
4. Monitor the logs for any issues
5. Set up monitoring and alerts if needed

