/**
 * @module types
 * @description
 * Public TypeScript types for `@arraypress/waveform-playlist-astro`.
 *
 * The shared option surfaces are owned by the two core libraries, which
 * each ship hand-authored type declarations:
 *
 *  - `@arraypress/waveform-playlist` owns the playlist-specific options
 *    ({@link WaveformPlaylistOptions}) and the parsed track / chapter /
 *    marker shapes.
 *  - `@arraypress/waveform-player` owns the player option surface
 *    ({@link WaveformPlayerOptions}) the playlist forwards to its embedded
 *    player.
 *
 * This wrapper re-exports those shared types verbatim (so consumers can
 * keep importing them from this package) and derives its component prop
 * interface from BOTH cores rather than re-declaring any option. That
 * keeps the three packages from drifting: any option a core adds (or
 * renames) flows through here automatically, and there is a single source
 * of truth.
 *
 * The prop names match the library option names 1:1 (camelCase) — the
 * Astro component handles the conversion to the libraries' `data-*`
 * attribute contract (kebab-case) under the hood.
 *
 * Options are intentionally all optional; only `tracks` is required (the
 * wrapper exists to render a playlist, which needs tracks). When an option
 * is omitted, the wrapper emits no corresponding `data-*` attribute,
 * letting the core libraries apply their own internal defaults.
 *
 * @see {@link https://github.com/arraypress/waveform-playlist} — playlist core
 * @see {@link https://github.com/arraypress/waveform-player}   — player core
 */

import type { WaveformPlayerOptions } from '@arraypress/waveform-player';
import type { WaveformPlaylistOptions } from '@arraypress/waveform-playlist';

/**
 * Shared player option types, re-exported from the player core so consumers
 * can continue to import them from `@arraypress/waveform-playlist-astro`.
 * The core's `index.d.ts` is the single source of truth for their shape.
 */
export type {
	WaveformStyle,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
	WaveformMarker,
	WaveformPeaks,
} from '@arraypress/waveform-player';

/**
 * Shared playlist types, re-exported from the playlist core. The parsed
 * shapes ({@link WaveformPlaylistTrack} / {@link WaveformPlaylistChapter} /
 * {@link WaveformPlaylistMarker}) describe what the library produces at
 * runtime; {@link WaveformPlaylistTrackInput} below is the (looser) shape
 * this component accepts as input.
 */
export type {
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
} from '@arraypress/waveform-playlist';

/**
 * The playlist-specific options, picked off the playlist core's
 * {@link WaveformPlaylistOptions}. Picking the named keys deliberately
 * strips the core interface's `[option: string]: unknown` pass-through
 * index signature, so {@link WaveformPlaylistProps} stays strict (a typo'd
 * prop is a type error) while still tracking the core option types.
 */
type PlaylistContainerOptions = Pick<
	WaveformPlaylistOptions,
	| 'layout'
	| 'continuous'
	| 'expandChapters'
	| 'showDuration'
	| 'showChapterMarkers'
	| 'chapterMarkerColor'
	| 'showPlayState'
>;

/**
 * The WaveformPlayer options the playlist forwards to its embedded player,
 * inherited from the player core's {@link WaveformPlayerOptions}. Several
 * groups are removed:
 *
 *  - Per-track content (`url`, `src`, `title`, `artist`, `artwork`,
 *    `album`, `markers`, `waveform`) — these belong on each entry of the
 *    {@link WaveformPlaylistProps.tracks} array, not the container. The
 *    playlist strips any container-level copy.
 *  - `audioMode` — the playlist always drives a self-mode embedded player.
 *  - `layout` — the player's `layout` (`'default' | 'preview'`) collides
 *    with the playlist's own `layout` (`'list' | 'minimal'`) on the same
 *    `data-layout` attribute; the playlist's wins, so the player's is
 *    removed here.
 *  - `style` — in an Astro component `style` is the HTML inline-style
 *    attribute; the visual style is selected via `waveformStyle`.
 *  - the `on*` lifecycle callbacks — a server-rendered Astro component
 *    emits static HTML with nothing to attach a runtime callback to.
 *    Consumers wire lifecycle handling via the DOM events instead.
 */
type ForwardedPlayerOptions = Omit<
	WaveformPlayerOptions,
	| 'url'
	| 'src'
	| 'title'
	| 'artist'
	| 'artwork'
	| 'album'
	| 'markers'
	| 'waveform'
	| 'audioMode'
	| 'layout'
	| 'style'
	| 'onLoad'
	| 'onPlay'
	| 'onPause'
	| 'onEnd'
	| 'onError'
	| 'onTimeUpdate'
>;

/**
 * A single track as accepted by the `<WaveformPlaylist>` component.
 *
 * This is the *input* shape (everything optional) — distinct from the
 * playlist core's parsed {@link WaveformPlaylistTrack}, which is what the
 * library produces at runtime (with resolved `title`, numeric chapter
 * `time`s, the backing DOM element, etc.).
 */
export interface WaveformPlaylistTrackInput {
	/**
	 * Audio file URL. Effectively required per track — without it the
	 * library has nothing to play — but kept optional so partially-built
	 * track objects type-check while you wire up data.
	 */
	url?: string;
	/** Track title (defaults to a prettified filename when omitted). */
	title?: string;
	/** Artist / description. */
	artist?: string;
	/** Artwork image URL. */
	artwork?: string;
	/** Album name (forwarded to the Media Session API). */
	album?: string;
	/** Human-readable display duration, e.g. `'3:45'`. */
	duration?: string;
	/**
	 * Explicit waveform markers for this track (separate from chapters).
	 * Serialised to the track's `data-markers` JSON attribute.
	 */
	markers?: { time: number; label?: string; color?: string }[];
	/**
	 * Chapters for this track. Each becomes a `[data-chapter]` child; the
	 * `time` is in seconds and the `label` is the chapter's visible text.
	 */
	chapters?: { time: number; label: string; color?: string }[];
}

/**
 * Props accepted by the `<WaveformPlaylist>` Astro component.
 *
 * Composes the playlist core's own options ({@link PlaylistContainerOptions})
 * with the forwarded player options ({@link ForwardedPlayerOptions}), then
 * adds the required `tracks` array and the Astro-specific extras. Because
 * the option surface is inherited from the two cores rather than
 * hand-copied, anything they add in future is exposed here without a manual
 * edit.
 */
export interface WaveformPlaylistProps
	extends PlaylistContainerOptions,
		ForwardedPlayerOptions {
	// ─────────────────────────────────────────────────────────────────────
	// Tracks (required)
	// ─────────────────────────────────────────────────────────────────────

	/**
	 * The tracks to render. Each becomes a `[data-track]` child of the
	 * playlist container, with its chapters as nested `[data-chapter]`
	 * elements. At least one track is expected.
	 */
	tracks: WaveformPlaylistTrackInput[];

	// ─────────────────────────────────────────────────────────────────────
	// Astro-specific extras
	// ─────────────────────────────────────────────────────────────────────

	/**
	 * Defer initialisation until the playlist scrolls into view.
	 *
	 * When `true`, the component emits `data-waveform-playlist-lazy` and
	 * the bundled `IntersectionObserver` script promotes it to
	 * `data-waveform-playlist` once it crosses the viewport (with 200 px of
	 * buffer so the UI is built and the first track decoded ahead of time).
	 *
	 * @default false
	 */
	lazy?: boolean;

	/**
	 * DOM id forwarded to the playlist container. Useful for targeting the
	 * playlist from external scripts.
	 */
	id?: string;

	/**
	 * Extra class names appended to the container's `class` attribute.
	 *
	 * The base class `wfpl-host` is always applied so the package's CSS
	 * (or your own overrides) can target the wrapper. The library also adds
	 * its own `waveform-playlist` class on mount.
	 */
	class?: string;

	/**
	 * Inline style passed through to the container. Useful for setting
	 * `min-height` to reserve layout space before the playlist renders.
	 */
	style?: string;
}
