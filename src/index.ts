/**
 * @module @arraypress/waveform-playlist-astro
 * @description
 * Public entry point for the Astro wrapper around
 * `@arraypress/waveform-playlist`.
 *
 * ## Importing the component
 *
 * ```astro
 * ---
 * import WaveformPlaylist from '@arraypress/waveform-playlist-astro';
 * // or, if you prefer the explicit path:
 * import WaveformPlaylist from '@arraypress/waveform-playlist-astro/WaveformPlaylist.astro';
 * ---
 * <WaveformPlaylist
 *   tracks={[{ url: '/audio/track.mp3', title: 'My Track' }]}
 * />
 * ```
 *
 * ## Importing the types
 *
 * ```ts
 * import type {
 *   WaveformPlaylistProps,
 *   WaveformPlaylistTrackInput,
 *   WaveformPlaylistOptions,
 *   WaveformStyle,
 * } from '@arraypress/waveform-playlist-astro';
 * ```
 *
 * @see {@link ./WaveformPlaylist.astro} for the component implementation
 * @see {@link ./types.ts}                for the full prop interface
 */

import WaveformPlaylist from './WaveformPlaylist.astro';

export { WaveformPlaylist };
export default WaveformPlaylist;

export type {
	WaveformPlaylistProps,
	WaveformPlaylistTrackInput,
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
	WaveformStyle,
	WaveformMarker,
	WaveformPeaks,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
} from './types';
