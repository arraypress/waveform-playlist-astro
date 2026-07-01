<div align="center">

# Waveform Playlist for Astro

**Typed Astro component wrapper for `@arraypress/waveform-playlist`.**
Multi-track audio playlists with canvas waveforms, chapters, and lazy mounting — as typed props.

[![npm version](https://img.shields.io/npm/v/@arraypress/waveform-playlist-astro?style=flat-square&labelColor=09090b&color=3f3f46)](https://www.npmjs.com/package/@arraypress/waveform-playlist-astro)
[![license](https://img.shields.io/npm/l/@arraypress/waveform-playlist-astro?style=flat-square&labelColor=09090b&color=3f3f46)](https://github.com/arraypress/waveform-playlist-astro/blob/main/LICENSE)

**[Documentation](https://docs.waveformplayer.com/)** · [npm](https://www.npmjs.com/package/@arraypress/waveform-playlist-astro)

</div>

---

## Install

```bash
npm install @arraypress/waveform-playlist-astro @arraypress/waveform-playlist @arraypress/waveform-player
```

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

<WaveformPlaylist tracks={[{ url: '/a.mp3', title: 'A', artist: 'Artist' }]} />
```

## Documentation

Full props, the imperative API, and SSR notes live in the docs.

### → [docs.waveformplayer.com](https://docs.waveformplayer.com/)

[Astro guide](https://docs.waveformplayer.com/frameworks/astro/) — install, props, the imperative API, and SSR notes. All four Astro wrappers (player / bar / playlist) are on that page.

## License

MIT © [ArrayPress](https://github.com/arraypress)
