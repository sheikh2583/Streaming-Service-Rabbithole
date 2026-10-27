# Streaming-Service-Rabbithole

Openwave is a minimal, self-hostable live television website. Opening the site starts the selected channel automatically, muted to comply with browser autoplay rules. Click **Turn sound on** to enable audio.

## Included live channels

- DW English
- Red Bull TV
- DW Español
- DW Deutsch

These are continuous HLS broadcasts, not demo recordings or MP4 files. The channels follow the broadcasters' schedules and can air recorded programs between live events. Availability can vary by region or change over time. Each channel links to its official broadcaster. Video is loaded directly from the broadcaster, not relayed or encoded by this application.

The interface contains only the player and live-channel choices. It includes quality selection when multiple qualities exist, volume and fullscreen controls, a Go live button, picture-in-picture on supported browsers, shareable channel links, and reconnect controls. Playback status reflects actual player events. HLS playlists that are no longer live are rejected.

## Run

Requires Node.js 20.19+ or 22+.

```sh
npm install
npm run dev
```

## Production

```sh
npm run build
npm start
```

The server listens on `127.0.0.1:4173` and exposes only `dist/`. You can also upload the contents of `dist/` to a static web host. The build supports domain-root and subdirectory hosting through relative asset paths. Use HTTPS for clipboard sharing and browser media features.

## Share without an account

With the production server running, use the official Cloudflare agent:

```sh
cloudflared tunnel --url http://127.0.0.1:4173
```

Share the HTTPS URL printed by the tunnel. This temporary preview URL requires the computer, app server, and tunnel to stay running; it is not permanent production hosting.

## Configure channels

Edit `src/streams.js`. Include the broadcaster name, description, category, language, official source page, and an HTTPS HLS URL that allows cross-origin requests. Include only content you own or have permission to share, or public broadcaster feeds offered for viewing. Update channels when upstream endpoints change.

## Files

- `src/streams.js`: live-channel catalog
- `src/main.js`: autoplay, channel switching, player controls, sharing
- `src/style.css`: responsive interface
- `server.js`: production static server

No account service, analytics, chat, collection, or schedule screen is included. Video providers, Google Fonts, and Unsplash receive requests to load their resources. Cover images are illustrative, not snapshots of the current broadcast.

## Developer stream analysis

See [DW English stream delivery and processing](docs/DW-ENGLISH-STREAM-ANALYSIS.md) for the verified source URL, request flow, codec/quality data, player processing, latency limitations, captured evidence, and a repeatable inspection command.
