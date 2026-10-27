# Streaming-Service-Rabbithole

Openwave is the streaming experience included in this project.

A responsive, free-to-watch streaming frontend you can host yourself. Includes HLS and MP4 playback, native volume/fullscreen controls, adaptive HLS quality selection, picture-in-picture where supported, search, category filters, browser-local bookmarks, and shareable stream links.

## Run locally

Requires Node.js 20.19+ or 22+.

```sh
npm install
npm run dev
```

## Add your streams

Edit `src/streams.js`. Each entry includes a title, category, description, image, source URL, and `type` (`hls` or `mp4`). Use an HTTPS `.m3u8` endpoint from your streaming server or provider for live broadcasts. Configure the endpoint to allow cross-origin requests from your website. A live playlist must be continuously updated by the streaming server.

The supplied entries are public sample videos with illustrative photography. The HLS sample is an on-demand test playlist, not a live broadcast. The live-stream tab currently lists HLS sources. Replace the entries with content you own or have permission to share. Customize categories in `src/main.js` if needed. The schedule has an honest empty state until you implement upcoming broadcasts.

## Host it

```sh
npm run build
```

Upload the contents of `dist/` to any static web host, Nginx, Apache, or object storage with website hosting. No Node process is needed in production. Serve over HTTPS for clipboard sharing and picture-in-picture browser features. `npm run preview` serves the production build locally for review.

This app is the viewing frontend. You supply the live encoder, streaming server/CDN, bandwidth, and broadcast sources; it does not relay or encode video. Free viewing does not mean free hosting or bandwidth.

The build uses relative asset paths, supporting both domain-root and subdirectory hosting.

## Privacy and persistence

Bookmarks live in localStorage in each visitor's browser. No account, chat service, analytics, fake viewers, or backend is included. Google Fonts, Unsplash cover photos, and the sample video hosts are external resources; self-host assets if you need to avoid these requests.

## Project structure

- `src/streams.js`: replaceable stream catalog and photo helper
- `src/main.js`: navigation, search, player, sharing, and bookmarks
- `src/style.css`: responsive layout and theme
- `index.html`: page title, metadata, and fonts

## Share with ngrok

Install the official ngrok agent and configure your account authtoken locally. Do not commit or share your token.

```sh
npm run build
npm start
```

In a second terminal:

```sh
ngrok http 4173
```

Share the HTTPS forwarding URL shown by ngrok. The app server binds to loopback; the tunnel exposes only the production `dist/` output. Keep both processes and your computer running for the link to work. Ngrok account limits apply. Video traffic goes directly from each viewer to the configured stream provider.
