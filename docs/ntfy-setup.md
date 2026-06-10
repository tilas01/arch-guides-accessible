# 📱 Notification Setup — ntfy, Bark & Custom Webhooks

> Receive real-time security alerts from your Arch Linux system on your phone.

The Arch Rusty Security Suite can send push notifications when security events occur — recovery code used, new USB device detected, tamper alerts, and more.

---

## Why Notifications?

Your system may detect threats while you're away:
- Someone plugs in an unknown USB device
- A recovery code is used (potential compromise)
- Boot tampering detected (evil maid)
- Failed login attempts

Without notifications, you'd only discover these events by checking logs. With webhooks, you get instant alerts on your phone.

---

## ntfy.sh (Recommended)

**Free, no account needed, no self-hosting required.**

[ntfy](https://ntfy.sh) is a simple HTTP-based pub-sub notification service. You pick a topic name, subscribe to it on your phone, and your server sends messages to it.

### Why ntfy is Recommended

- ✅ **Free** — no account, no payment
- ✅ **No self-hosting** — uses the public ntfy.sh server
- ✅ **iOS & Android apps** — native push notifications
- ✅ **Simple** — one `curl` command to send a notification
- ✅ **Private** — topic names are like passwords; only people who know the topic can subscribe
- ✅ **No server needed** — your Arch system sends directly to ntfy.sh

### How It Works

```
Your Arch System ──curl──→ ntfy.sh/your-topic ──push──→ Phone App
```

### iOS Setup

1. Open the **App Store** on your iPhone/iPad
2. Search for **"ntfy"** by Philipp C. Heckel
3. Install the app
4. Open the app → tap **"+"** to subscribe to a topic
5. Enter your topic name (e.g., `arch-security-abc123`)
6. You'll now receive push notifications from this topic

> 💡 **Tip:** Use a long, random topic name. Anyone who knows the topic name can read your notifications. Treat it like a password.

### Android Setup

1. Install **ntfy** from:
   - **F-Droid** (recommended, no Google services needed): Search "ntfy"
   - **Google Play Store**: Search "ntfy"
2. Open the app → tap **"+"** to subscribe
3. Enter your topic name (same one you'll configure on your server)
4. Enable notifications when prompted

### Arch System Configuration

During installation, the generator sets up ntfy automatically:

```bash
# Configuration at /etc/arch-security/webhook.conf
WEBHOOK_PROVIDER=ntfy
WEBHOOK_URL=https://ntfy.sh/your-secret-topic
```

### Sending a Test Notification

```bash
# Quick test from terminal
curl -d "Test notification from Arch" ntfy.sh/your-secret-topic

# Via the security suite
arch-rusty-security-suite webhook --test
```

### Topic Name Best Practices

- Use a long random string: `arch-sec-a7b3c9d2e5f1`
- Don't use common words (anyone can subscribe to any topic)
- Change your topic periodically if concerned about eavesdropping
- For maximum privacy, self-host ntfy (but that requires a server)

---

## Bark (Alternative — Needs Server)

[Bark](https://github.com/Finb/Bark) is an iOS push notification service that requires a self-hosted server.

### Why Bark is Not Recommended

- ❌ **Requires a server** — you need a VPS or always-on machine running the Bark server
- ❌ **iOS only** — no Android app
- ❌ **Extra infrastructure** — adds overhead and another attack surface
- ❌ **Self-hosted** — if your server goes down, no notifications

### Setup (If You Still Want Bark)

1. **Deploy Bark Server** on a VPS:
   ```bash
   docker run -d --name bark -p 8080:8080 finab/bark-server
   ```

2. **Install Bark App** on iOS (App Store)

3. **Register your device** — the app provides a device key URL

4. **Configure on Arch:**
   ```bash
   # /etc/arch-security/webhook.conf
   WEBHOOK_PROVIDER=bark
   WEBHOOK_URL=https://your-server:8080/your-device-key
   ```

5. **Test:**
   ```bash
   curl https://your-server:8080/your-device-key/Test+Notification
   ```

---

## Custom Webhooks

You can use any service that accepts HTTP POST requests.

### Discord

1. In your Discord server → **Server Settings** → **Integrations** → **Webhooks**
2. Click **New Webhook** → copy the webhook URL
3. Configure:
   ```bash
   # /etc/arch-security/webhook.conf
   WEBHOOK_PROVIDER=discord
   WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
   ```

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Get your **bot token** and your **chat ID**
3. Configure:
   ```bash
   # /etc/arch-security/webhook.conf
   WEBHOOK_PROVIDER=telegram
   WEBHOOK_URL=https://api.telegram.org/botYOUR_TOKEN/sendMessage
   WEBHOOK_CHAT_ID=YOUR_CHAT_ID
   ```

### Slack

1. In your Slack workspace → **Apps** → **Incoming Webhooks**
2. Create a new webhook → copy the URL
3. Configure:
   ```bash
   # /etc/arch-security/webhook.conf
   WEBHOOK_PROVIDER=slack
   WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### Custom URL

Any URL that accepts POST with a JSON body:

```bash
# /etc/arch-security/webhook.conf
WEBHOOK_PROVIDER=custom
WEBHOOK_URL=https://your-api.example.com/alert
```

The payload sent:
```json
{
  "event": "recovery_code_used",
  "timestamp": "2026-06-10T15:00:00Z",
  "hostname": "archlinux",
  "message": "Recovery code #3 was used for OTP authentication"
}
```

---

## Comparison

| Feature | ntfy.sh | Bark | Discord | Telegram | Slack |
|---------|---------|------|---------|----------|-------|
| Free | ✅ | ✅ (self-host) | ✅ | ✅ | ✅ |
| No server needed | ✅ | ❌ | ✅ | ✅ | ✅ |
| iOS | ✅ | ✅ | ✅ | ✅ | ✅ |
| Android | ✅ | ❌ | ✅ | ✅ | ✅ |
| Push notifications | ✅ | ✅ | ⚠️ (app must be open) | ✅ | ⚠️ |
| Privacy | ✅ (topic = password) | ✅ (your server) | ⚠️ (Discord sees messages) | ⚠️ (Telegram sees messages) | ⚠️ |

> 💡 **Bottom line:** Use **ntfy.sh** unless you have a specific reason not to. It's the simplest, most private option that works on both iOS and Android without self-hosting.
