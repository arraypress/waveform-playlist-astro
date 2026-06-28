# @arraypress/waveform-playlist-astro

Astro component wrapper around [`@arraypress/waveform-playlist`](https://github.com/arraypress/waveform-playlist). Turns the library's nested `data-*` markup (a `[data-waveform-playlist]` container with `[data-track]` / `[data-chapter]` children) into a single typed `tracks` array, exposes every playlist option — plus the WaveformPlayer options the playlist forwards to its embedded player — as typed props, and ships an optional lazy-mount `IntersectionObserver`.

The core libraries stay zero-dependency vanilla-JS packages that work anywhere a `<script>` tag does (WordPress, Shopify, raw HTML). This package adds the framework-native ergonomics Astro users expect — without touching the runtime.

```astro
---
import WaveformPlaylist from '@arraypress/waveform-playlist-astro';
import '@arraypress/waveform-player/dist/waveform-player.css';
import '@arraypress/waveform-playlist/dist/waveform-playlist.css';
import wfpJsUrl from '@arraypress/waveform-player/dist/waveform-player.min.js?url';
import wfplJsUrl from '@arraypress/waveform-playlist/dist/waveform-playlist.js?url';
---
<script src={wfpJsUrl} is:inline></script>
<script src={wfplJsUrl} is:inline></script>

<WaveformPlaylist
  continuous
  tracks={[
    {
      url: '/audio/episode-42.mp3',
      title: 'Episode 42',
      subtitle: 'with Dr. Sarah Chen',
      chapters: [
        { time: 0, label: 'Intro' },
        { time: 330, label: 'Main Topic' },
        { time: 2700, label: 'Q&A' },
      ],
    },
  ]}
/>
```

> **Naming note.** The visual waveform style is `waveformStyle` — **not**
> `style`, which (as in any Astro component) is the host element's inline CSS.
> The playlist's `layout` prop is its own `'list' | 'minimal'` layout, distinct
> from the player's layout (which this wrapper does not expose).

## Installation

```bash
npm install @arraypress/waveform-playlist-astro @arraypress/waveform-playlist @arraypress/waveform-player
```

Both `@arraypress/waveform-playlist` and `@arraypress/waveform-player` are peer dependencies — you bring them explicitly so you control the versions.

## Setup

The wrapper does **not** load the core libraries' JS or CSS for you. This is deliberate: you might want a CDN, a self-hosted asset, or the bundled npm path. Load all four assets once in your root layout — the **player must load before the playlist**:

```astro
---
// src/layouts/Layout.astro
import '@arraypress/waveform-player/dist/waveform-player.css';
import '@arraypress/waveform-playlist/dist/waveform-playlist.css';
import wfpJsUrl from '@arraypress/waveform-player/dist/waveform-player.min.js?url';
import wfplJsUrl from '@arraypress/waveform-playlist/dist/waveform-playlist.js?url';
---
<html>
  <head>
    <script src={wfpJsUrl} is:inline></script>
    <script src={wfplJsUrl} is:inline></script>
  </head>
  <body><slot /></body>
</html>
```

Then `<WaveformPlaylist>` works on any page.

## Usage

### Podcast with chapters

A single track with clickable chapter timestamps. With one track, chapters also appear as waveform markers.

```astro
<WaveformPlaylist
  tracks={[
    {
      url: '/audio/episode.mp3',
      title: 'Episode 42',
      subtitle: 'with Guest',
      artwork: '/img/cover.jpg',
      chapters: [
        { time: 0, label: 'Intro' },
        { time: 330, label: 'Main Topic', color: '#a855f7' },
        { time: 2700, label: 'Q&A' },
      ],
    },
  ]}
/>
```

### Music playlist (auto-advance)

```astro
<WaveformPlaylist
  continuous
  showPlayState
  tracks={[
    { url: '/audio/1.mp3', title: 'Summer Vibes', artwork: '/img/1.jpg', duration: '3:45' },
    { url: '/audio/2.mp3', title: 'Night Drive', artwork: '/img/2.jpg', duration: '4:12' },
  ]}
/>
```

### Minimal button layout

```astro
<WaveformPlaylist
  layout="minimal"
  tracks={[
    { url: '/beats/1.mp3', title: 'Trap Beat' },
    { url: '/beats/2.mp3', title: 'Lo-Fi' },
  ]}
/>
```

### Forwarded player options

Any visual/playback option not owned by the playlist is forwarded to the embedded player:

```astro
<WaveformPlaylist
  waveformStyle="bars"
  barWidth={3}
  height={80}
  colorPreset="dark"
  progressColor="rgba(168,85,247,0.9)"
  showBPM
  showPlaybackSpeed
  tracks={[{ url: '/audio/track.mp3', title: 'My Track' }]}
/>
```

### Lazy mounting

Pass `lazy` and the wrapper switches the init attribute to `data-waveform-playlist-lazy`, then installs a single shared `IntersectionObserver` that promotes the playlist when it crosses the viewport (with 200 px of buffer so the UI is built and the first track decoded before the user sees it).

```astro
<WaveformPlaylist lazy tracks={tracks} />
```

The observer is installed at most once per page (`window.__wfplLazyMountBound` flag), and re-fires on Astro's `astro:page-load` event so cross-page navigations pick up new mounts.

## Props

Container options are emitted as `data-*` on the playlist container; per-track content is emitted on each `[data-track]` child. Omitting a prop emits no attribute and lets the library apply its own default.

### Playlist options

| Prop                 | Type                    | Default  | Description |
| -------------------- | ----------------------- | -------- | ----------- |
| `tracks`             | `WaveformPlaylistTrackInput[]` | — (required) | The tracks to render. |
| `layout`             | `'list' \| 'minimal'`   | `'list'` | Playlist layout. |
| `continuous`         | `boolean`               | `false`  | Auto-advance to the next track when one ends. |
| `expandChapters`     | `boolean`               | `true`   | Show chapters under tracks in multi-track lists. |
| `showDuration`       | `boolean`               | `true`   | Display track durations. |
| `showChapterMarkers` | `boolean \| null`       | `null`   | Show chapters as waveform markers (`null` = smart default). |
| `chapterMarkerColor` | `string`                | library default | Default colour for chapter markers. |
| `showPlayState`      | `boolean`               | `true`   | Show a play/pause overlay on the active track artwork. |

### Per-track fields (`tracks[]`)

| Field      | Type                                                     | Description |
| ---------- | -------------------------------------------------------- | ----------- |
| `url`      | `string`                                                 | Audio file URL. |
| `title`    | `string`                                                 | Track title (defaults to a prettified filename). |
| `subtitle` | `string`                                                 | Subtitle / artist / description. |
| `artwork`  | `string`                                                 | Artwork image URL. |
| `album`    | `string`                                                 | Album name (Media Session API). |
| `duration` | `string`                                                 | Display duration, e.g. `'3:45'`. |
| `markers`  | `Array<{ time: number; label?: string; color?: string }>` | Explicit waveform markers (separate from chapters). |
| `chapters` | `Array<{ time: number; label: string; color?: string }>`  | Chapters; `time` in seconds, `label` is the visible text. |

### Forwarded player options

These map 1:1 to [`@arraypress/waveform-player`](https://github.com/arraypress/waveform-player) options and are inherited by the embedded player: `waveformStyle`, `height`, `samples`, `barWidth`, `barSpacing`, `barRadius`, `colorPreset`, `waveformColor`, `progressColor`, `buttonColor`, `buttonHoverColor`, `textColor`, `textSecondaryColor`, `backgroundColor`, `borderColor`, `playbackRate`, `showPlaybackSpeed`, `playbackRates`, `showControls`, `showInfo`, `showTime`, `showHoverTime`, `showBPM`, `bpm`, `buttonAlign`, `buttonStyle`, `accessibleSeek`, `seekLabel`, `errorText`, `showMarkers`, `autoplay`, `singlePlay`, `playOnSeek`, `enableMediaSession`, `preload`, `playIcon`, `pauseIcon`.

> The player's own `url` / `title` / `audioMode` / `layout` are **not**
> forwarded at the container level — per-track content lives on each `tracks`
> entry, the playlist always drives a self-mode player, and `data-layout` is the
> playlist's own layout.

### Astro-specific

| Prop    | Type      | Default | Description |
| ------- | --------- | ------- | ----------- |
| `lazy`  | `boolean` | `false` | Defer mount until viewport entry. |
| `id`    | `string`  | —       | Forwarded to the container element. |
| `class` | `string`  | —       | Appended to the container's classes (`wfpl-host` is always present). |
| `style` | `string`  | —       | Inline style on the container. |

## TypeScript

```ts
import type {
  WaveformPlaylistProps,
  WaveformPlaylistTrackInput,
  WaveformPlaylistOptions,
  WaveformPlaylistTrack,
  WaveformPlaylistChapter,
  WaveformPlaylistMarker,
  WaveformStyle,
  ColorPreset,
} from '@arraypress/waveform-playlist-astro';
```

The prop types are derived from the two core packages (`@arraypress/waveform-playlist` for the playlist options, `@arraypress/waveform-player` for the forwarded player options), so they never drift from the libraries.

## Testing

```bash
npm test          # one-shot
npm run test:watch
npm run typecheck
```

Tests use Astro's official `experimental_AstroContainer` API to render the component to a string and assert on the resulting HTML. No browser required.

## License

MIT © ArrayPress
