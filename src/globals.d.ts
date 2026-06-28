/**
 * @module globals
 * @description
 * Ambient declarations for the internal `window` flags this wrapper's
 * inline mount scripts set. The core libraries declare their own globals
 * (`window.WaveformPlayer` / `window.WaveformPlaylist`); this file only
 * adds the implementation-detail dedup flags so the rest of the project
 * type-checks cleanly.
 *
 * Consumers don't need to import this file.
 */

declare global {
	interface Window {
		/**
		 * Internal — set by `<WaveformPlaylist lazy>`'s inline mount script
		 * to deduplicate the `IntersectionObserver`. Do not rely on this; it
		 * is an implementation detail.
		 *
		 * @internal
		 */
		__wfplLazyMountBound?: boolean;

		/**
		 * Internal — set by the non-lazy `<WaveformPlaylist>`'s inline script
		 * to deduplicate the `astro:page-load` re-init listener that re-runs
		 * `WaveformPlaylist.init()` after View Transitions navigations. Do not
		 * rely on this; it is an implementation detail.
		 *
		 * @internal
		 */
		__wfplInitBound?: boolean;
	}
}

export {};
