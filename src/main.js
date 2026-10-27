import {
  createIcons,
  AudioLines,
  Radio,
  Volume2,
  VolumeX,
  Share2,
  PictureInPicture2,
  WifiOff,
  ArrowUpRight,
  RotateCw,
} from "lucide";
import Hls from "hls.js";
import { streams, photo } from "./streams.js";
import "./style.css";
const icons = {
  AudioLines,
  Radio,
  Volume2,
  VolumeX,
  Share2,
  PictureInPicture2,
  WifiOff,
  ArrowUpRight,
  RotateCw,
};
const icon = (name) => `<i data-lucide="${name}"></i>`;
const refresh = () => createIcons({ icons, attrs: { "stroke-width": 1.7 } });
const initial =
  streams.find(
    (s) => s.id === new URLSearchParams(location.search).get("watch"),
  ) || streams[0];
let current = initial,
  hls = null,
  generation = 0,
  mediaRecovery = false,
  toastTimer;
document.querySelector("#app").innerHTML = `
<header class="site-header"><a class="brand" href="${import.meta.env.BASE_URL}">${icon("audio-lines")}openwave<span>.</span></a><span class="header-caption">A world worth watching.</span><span class="free-label"><span></span>Free live TV</span></header>
<main><div class="intro"><div><div class="eyebrow">TUNE IN TO RIGHT NOW</div><h1>Live, without the noise<span>.</span></h1></div><p>No account. No subscription. You’re live.</p></div>
<div class="watch-layout"><section class="watch-panel" aria-label="Live broadcast"><div class="video-stage"><video autoplay muted playsinline controls preload="auto" aria-label="Live television player"></video><div class="playback-error" hidden role="status"></div></div><div class="player-toolbar"><span class="playback-state" role="status"><span></span><b id="status">Connecting…</b></span><button id="sound" class="sound-btn">${icon("volume-x")}<span>Turn sound on</span></button><div class="toolbar-end"><button id="go-live" title="Return to current broadcast">${icon("radio")}Go live</button><select id="quality" aria-label="Playback quality" hidden><option value="-1">Auto quality</option></select><button id="pip" aria-label="Open mini player" title="Mini player">${icon("picture-in-picture-2")}</button><button id="share" aria-label="Copy channel link" title="Share channel">${icon("share-2")}</button></div></div><div class="now-playing"><div class="eyebrow">YOU’RE WATCHING</div><h2 id="channel-title"></h2><p id="channel-description"></p><a id="official" target="_blank" rel="noopener noreferrer">Official broadcaster ${icon("arrow-up-right")}</a></div></section>
<aside class="channels"><div class="channels-heading"><h2>Live channels</h2><span>${streams.length} channels</span></div><p class="channels-intro">Pick a channel. We’ll take you live.</p><div class="channel-list">${streams.map((s) => `<button class="channel" data-channel="${s.id}" aria-label="Watch ${s.title}" aria-pressed="false"><div class="channel-image"><img src="${photo(s.image, 300)}" alt=""/><span>${icon("radio")}</span></div><div class="channel-copy"><span class="channel-category">${s.category} <span>·</span> ${s.language}</span><strong>${s.title}</strong><span class="channel-subtitle">${s.subtitle}</span></div><span class="channel-selected">${icon("audio-lines")}</span></button>`).join("")}</div><div class="channel-note">${icon("radio")}<p>Continuous broadcasts, straight from the source. Schedules and availability are set by each broadcaster.</p></div></aside></div>
<footer><span class="footer-brand">${icon("audio-lines")}openwave.</span><p>Free to watch. Live to explore.</p><span>Live channels may include scheduled replays. Cover images are illustrative.</span></footer></main><div class="toast" role="status" aria-live="polite"></div>`;
const video = document.querySelector("video"),
  quality = document.querySelector("#quality"),
  error = document.querySelector(".playback-error"),
  status = document.querySelector("#status");
function toast(message) {
  const el = document.querySelector(".toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
}
function setStatus(label, state = "connecting") {
  status.textContent = label;
  status.parentElement.dataset.state = state;
}
function sound() {
  document.querySelector("#sound").innerHTML =
    `${icon(video.muted ? "volume-x" : "volume-2")}<span>${video.muted ? "Turn sound on" : "Mute sound"}</span>`;
  refresh();
}
function unavailable(message = "This channel is temporarily unavailable.") {
  setStatus("Unavailable", "error");
  error.hidden = false;
  error.innerHTML = `${icon("wifi-off")}<h3>${message}</h3><p>Try reconnecting or choose another live channel.</p><button id="retry">${icon("rotate-cw")}Reconnect</button>`;
  refresh();
}
async function play() {
  try {
    await video.play();
  } catch {
    setStatus("Press play to start", "paused");
  }
}
function openChannel(id) {
  const stream = streams.find((s) => s.id === id);
  if (!stream) return;
  const version = ++generation;
  current = stream;
  mediaRecovery = false;
  if (hls) {
    hls.destroy();
    hls = null;
  }
  video.pause();
  video.removeAttribute("src");
  video.load();
  error.hidden = true;
  video.poster = photo(stream.image, 1400);
  setStatus("Connecting…");
  document.querySelector("#channel-title").textContent = stream.title;
  document.querySelector("#channel-description").textContent =
    stream.description;
  document.querySelector("#official").href = stream.official;
  document.querySelectorAll(".channel").forEach((el) => {
    const selected = el.dataset.channel === id;
    el.classList.toggle("selected", selected);
    el.setAttribute("aria-pressed", String(selected));
  });
  quality.hidden = true;
  quality.innerHTML = '<option value="-1">Auto quality</option>';
  const url = new URL(location);
  url.searchParams.set("watch", id);
  history.replaceState(null, "", url);
  if (Hls.isSupported()) {
    const engine = new Hls({ maxLiveSyncPlaybackRate: 1.2 });
    hls = engine;
    engine.loadSource(stream.source);
    engine.attachMedia(video);
    engine.on(Hls.Events.MANIFEST_PARSED, () => {
      if (version !== generation) return;
      engine.levels.forEach((level, i) => {
        const option = document.createElement("option");
        option.value = String(i);
        option.textContent = level.height
          ? `${level.height}p`
          : `Quality ${i + 1}`;
        quality.append(option);
      });
      quality.hidden = engine.levels.length < 2;
      play();
    });
    engine.on(Hls.Events.LEVEL_LOADED, (_, data) => {
      if (version !== generation) return;
      if (!data.details.live) {
        engine.stopLoad();
        video.pause();
        unavailable("This feed is no longer live.");
      }
    });
    engine.on(Hls.Events.ERROR, (_, data) => {
      if (version !== generation || !data.fatal) return;
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !mediaRecovery) {
        mediaRecovery = true;
        engine.recoverMediaError();
      } else unavailable();
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = stream.source;
    play();
  } else unavailable("This browser cannot play live HLS video.");
  refresh();
}
video.addEventListener("playing", () => {
  if (error.hidden) setStatus("Live", "live");
});
video.addEventListener("waiting", () => {
  if (error.hidden) setStatus("Buffering…");
});
video.addEventListener("pause", () => {
  if (error.hidden) setStatus("Paused", "paused");
});
video.addEventListener("error", () => {
  if (video.getAttribute("src")) unavailable();
});
video.addEventListener("volumechange", sound);
quality.addEventListener("change", () => {
  if (hls) hls.currentLevel = Number(quality.value);
});
document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.channel) openChannel(button.dataset.channel);
  if (button.id === "sound") {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
    play();
    sound();
  }
  if (button.id === "retry") openChannel(current.id);
  if (button.id === "go-live") {
    const edge =
      hls?.liveSyncPosition ??
      (video.seekable.length
        ? video.seekable.end(video.seekable.length - 1) - 3
        : null);
    if (Number.isFinite(edge)) {
      video.currentTime = edge;
      play();
    } else toast("The broadcast is still connecting.");
  }
  if (button.id === "pip") {
    try {
      if (document.pictureInPictureElement)
        await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled)
        await video.requestPictureInPicture();
      else toast("Mini player is not available in this browser.");
    } catch {
      toast("Start the channel before opening the mini player.");
    }
  }
  if (button.id === "share") {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Channel link copied");
    } catch {
      toast("Copy this page’s address to share the channel.");
    }
  }
});
openChannel(initial.id);
sound();
