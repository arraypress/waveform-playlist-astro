/**
 * test/WaveformPlaylist.test.ts
 * -----------------------------
 *
 * End-to-end output tests for the `<WaveformPlaylist>` Astro component.
 *
 * Each test renders the component with a specific prop combination using
 * Astro's `experimental_AstroContainer` API, then asserts on the returned
 * HTML string to confirm the wrapper emits the correct markup contract:
 *
 *  - a `[data-waveform-playlist]` container carrying the playlist's own
 *    options plus the forwarded player options as `data-*` attributes
 *    (and, just as importantly, omitting attributes for props the consumer
 *    didn't set so the libraries' defaults can apply); and
 *  - one `[data-track]` child per track, each with its `[data-chapter]`
 *    children.
 *
 * No browser, no jsdom — Astro renders to a string and we parse the
 * resulting markup directly.
 *
 * @see ../src/WaveformPlaylist.astro
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
// The Astro shim in src/astro-shim.d.ts models component imports as opaque
// factories. The container API wants its own `AstroComponentFactory` type
// (an Astro internal). Cast at the import boundary — this is test-only and
// not part of the public type surface.
import WaveformPlaylistRaw from '../src/WaveformPlaylist.astro';
import type { WaveformPlaylistProps } from '../src/types';

const WaveformPlaylist = WaveformPlaylistRaw as Parameters<
	AstroContainer['renderToString']
>[0];

/** Shared container instance — created once and reused (stateless). */
let container: AstroContainer;

beforeAll(async () => {
	container = await AstroContainer.create();
});

/**
 * Render the component with the given props and return the HTML.
 *
 * The container API types `props` as an indexable `Record<string, any>`
 * but our public `WaveformPlaylistProps` interface is intentionally strict
 * (no index signature), so we cast at the boundary.
 *
 * @param props - The props to pass to `<WaveformPlaylist>`.
 * @returns The rendered HTML string.
 */
async function render(props: WaveformPlaylistProps): Promise<string> {
	return container.renderToString(WaveformPlaylist, {
		props: props as unknown as Record<string, unknown>,
	});
}

/** A single throwaway track so the required `tracks` prop is satisfied. */
const ONE_TRACK: WaveformPlaylistProps['tracks'] = [{ url: '/audio/track.mp3' }];

/**
 * Decode the small set of HTML entities Astro emits inside attribute
 * values when serialising to HTML. Browsers transparently decode these
 * when reading `dataset.foo`, so the library at runtime sees the original
 * string — but our test, scraping the raw HTML, sees the encoded form.
 *
 * @param value - Raw HTML attribute/text value as written in the markup.
 * @returns The decoded string a browser would yield at runtime.
 */
function decodeEntities(value: string): string {
	return value
		.replace(/&quot;/g, '"')
		.replace(/&#x27;/g, "'")
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

/**
 * Extract the value of a specific attribute from a rendered HTML fragment.
 * Returns `null` if absent, `''` if present with no value, or the decoded
 * value otherwise. Intentionally minimal — a regex over a known set of
 * attributes is enough and avoids a parser dependency.
 *
 * @param html - The HTML (or single tag) to search.
 * @param name - The attribute name (case-sensitive).
 * @returns The attribute's value (entity-decoded), or `null` if not present.
 */
function getAttr(html: string, name: string): string | null {
	const bare = new RegExp(`\\s${name}(?=[\\s>])`).test(html);
	const valued = new RegExp(`\\s${name}="([^"]*)"`).exec(html);
	if (valued) return decodeEntities(valued[1]);
	if (bare) return '';
	return null;
}

/**
 * Assert that a given attribute is NOT present in the supplied HTML/tag.
 *
 * @param html - The HTML to inspect.
 * @param name - The attribute name expected to be absent.
 */
function expectNoAttr(html: string, name: string): void {
	expect(getAttr(html, name), `expected ${name} to be absent`).toBeNull();
}

/**
 * Isolate the playlist container's opening `<div ...>` tag so we can assert
 * on container-level attributes without picking up `data-*` attributes that
 * legitimately appear on the `[data-track]` children (e.g. `data-url`).
 *
 * @param html - The full rendered HTML.
 * @returns The container's opening tag string.
 */
function containerTag(html: string): string {
	const start = html.indexOf('<div');
	const end = html.indexOf('>', start);
	return html.slice(start, end + 1);
}

/**
 * Collect every `[data-track]` opening tag in render order.
 *
 * @param html - The full rendered HTML.
 * @returns An array of `<div data-track ...>` opening-tag strings.
 */
function trackTags(html: string): string[] {
	return [...html.matchAll(/<div data-track[\s\S]*?>/g)].map((m) => m[0]);
}

/**
 * Collect every `[data-chapter]` element (opening tag + label text).
 *
 * @param html - The full rendered HTML.
 * @returns An array of `{ tag, label }` for each chapter.
 */
function chapterEls(html: string): { tag: string; label: string }[] {
	return [...html.matchAll(/(<div data-chapter[^>]*>)([\s\S]*?)<\/div>/g)].map((m) => ({
		tag: m[1],
		label: decodeEntities(m[2].trim()),
	}));
}

// ─── Minimal render ──────────────────────────────────────────────────────

describe('<WaveformPlaylist> — minimal props', () => {
	it('renders a container with the init attribute and one track child', async () => {
		const html = await render({ tracks: ONE_TRACK });
		const tag = containerTag(html);

		expect(html).toContain('<div');
		expect(getAttr(tag, 'data-waveform-playlist')).toBe('');

		const tracks = trackTags(html);
		expect(tracks).toHaveLength(1);
		expect(getAttr(tracks[0], 'data-url')).toBe('/audio/track.mp3');
	});

	it('does NOT emit container-level option attrs when their props are omitted', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK }));

		// Playlist-specific options
		expectNoAttr(tag, 'data-layout');
		expectNoAttr(tag, 'data-continuous');
		expectNoAttr(tag, 'data-expand-chapters');
		expectNoAttr(tag, 'data-show-duration');
		expectNoAttr(tag, 'data-show-chapter-markers');
		expectNoAttr(tag, 'data-chapter-marker-color');
		expectNoAttr(tag, 'data-show-play-state');
		// Forwarded player options (spot-check across groups)
		expectNoAttr(tag, 'data-preload');
		expectNoAttr(tag, 'data-waveform-style');
		expectNoAttr(tag, 'data-height');
		expectNoAttr(tag, 'data-bar-width');
		expectNoAttr(tag, 'data-color-preset');
		expectNoAttr(tag, 'data-progress-color');
		expectNoAttr(tag, 'data-show-bpm');
		expectNoAttr(tag, 'data-show-playback-speed');
		expectNoAttr(tag, 'data-autoplay');
		expectNoAttr(tag, 'data-play-icon');
	});

	it('does NOT emit per-track / playlist-owned attrs on the container', async () => {
		// url/title/artist/artwork/album/markers/audioMode belong on the
		// tracks, not the container — the playlist strips container copies.
		const tag = containerTag(await render({ tracks: ONE_TRACK }));
		expectNoAttr(tag, 'data-url');
		expectNoAttr(tag, 'data-title');
		expectNoAttr(tag, 'data-artist');
		expectNoAttr(tag, 'data-artwork');
		expectNoAttr(tag, 'data-album');
		expectNoAttr(tag, 'data-markers');
		expectNoAttr(tag, 'data-audio-mode');
		expectNoAttr(tag, 'data-waveform');
	});

	it('always applies the wfpl-host class for a stylable hook', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK }));
		expect(tag).toMatch(/class="[^"]*\bwfpl-host\b/);
	});
});

// ─── Playlist-specific options ───────────────────────────────────────────

describe('<WaveformPlaylist> — playlist options', () => {
	it('emits data-layout verbatim', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK, layout: 'minimal' }));
		expect(getAttr(tag, 'data-layout')).toBe('minimal');
	});

	it('serialises continuous as a "true"/"false" string', async () => {
		const on = containerTag(await render({ tracks: ONE_TRACK, continuous: true }));
		expect(getAttr(on, 'data-continuous')).toBe('true');

		const off = containerTag(await render({ tracks: ONE_TRACK, continuous: false }));
		expect(getAttr(off, 'data-continuous')).toBe('false');
	});

	it('serialises expandChapters / showDuration / showPlayState as "true"/"false"', async () => {
		const tag = containerTag(
			await render({
				tracks: ONE_TRACK,
				expandChapters: false,
				showDuration: false,
				showPlayState: false,
			})
		);
		// The playlist reads these with `!== 'false'`, so the explicit
		// "false" string is what actually disables them.
		expect(getAttr(tag, 'data-expand-chapters')).toBe('false');
		expect(getAttr(tag, 'data-show-duration')).toBe('false');
		expect(getAttr(tag, 'data-show-play-state')).toBe('false');
	});

	it('emits data-show-chapter-markers for true/false but omits it for null', async () => {
		const on = containerTag(await render({ tracks: ONE_TRACK, showChapterMarkers: true }));
		expect(getAttr(on, 'data-show-chapter-markers')).toBe('true');

		const off = containerTag(await render({ tracks: ONE_TRACK, showChapterMarkers: false }));
		expect(getAttr(off, 'data-show-chapter-markers')).toBe('false');

		// null = "let the playlist decide" → no attribute (smart default).
		const auto = containerTag(await render({ tracks: ONE_TRACK, showChapterMarkers: null }));
		expectNoAttr(auto, 'data-show-chapter-markers');
	});

	it('emits the chapter marker colour', async () => {
		const tag = containerTag(
			await render({ tracks: ONE_TRACK, chapterMarkerColor: 'rgba(168,85,247,0.8)' })
		);
		expect(getAttr(tag, 'data-chapter-marker-color')).toBe('rgba(168,85,247,0.8)');
	});
});

// ─── Forwarded player options ────────────────────────────────────────────

describe('<WaveformPlaylist> — forwarded player options', () => {
	it('emits the waveform style + numeric sizing attrs as strings', async () => {
		const tag = containerTag(
			await render({
				tracks: ONE_TRACK,
				waveformStyle: 'bars',
				height: 80,
				samples: 250,
				barWidth: 3,
				barSpacing: 2,
				barRadius: 1,
			})
		);

		expect(getAttr(tag, 'data-waveform-style')).toBe('bars');
		expect(getAttr(tag, 'data-height')).toBe('80');
		expect(getAttr(tag, 'data-samples')).toBe('250');
		expect(getAttr(tag, 'data-bar-width')).toBe('3');
		expect(getAttr(tag, 'data-bar-spacing')).toBe('2');
		expect(getAttr(tag, 'data-bar-radius')).toBe('1');
	});

	it('emits colorPreset only when it is dark or light (not null)', async () => {
		const dark = containerTag(await render({ tracks: ONE_TRACK, colorPreset: 'dark' }));
		expect(getAttr(dark, 'data-color-preset')).toBe('dark');

		const auto = containerTag(await render({ tracks: ONE_TRACK, colorPreset: null }));
		expectNoAttr(auto, 'data-color-preset');
	});

	it('emits individual colours and JSON-encodes gradient-array colours', async () => {
		const tag = containerTag(
			await render({
				tracks: ONE_TRACK,
				waveformColor: ['#fafafa', '#71717a'],
				progressColor: 'rgba(168,85,247,0.9)',
			})
		);
		expect(getAttr(tag, 'data-waveform-color')).toBe(JSON.stringify(['#fafafa', '#71717a']));
		expect(getAttr(tag, 'data-progress-color')).toBe('rgba(168,85,247,0.9)');
	});

	it('serialises playback controls (rate, speed toggle, rates array)', async () => {
		const tag = containerTag(
			await render({
				tracks: ONE_TRACK,
				playbackRate: 1.25,
				showPlaybackSpeed: true,
				playbackRates: [0.5, 1, 2],
			})
		);
		expect(getAttr(tag, 'data-playback-rate')).toBe('1.25');
		expect(getAttr(tag, 'data-show-playback-speed')).toBe('true');
		expect(getAttr(tag, 'data-playback-rates')).toBe(JSON.stringify([0.5, 1, 2]));
	});

	it('omits playbackRates when passed an empty array', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK, playbackRates: [] }));
		expectNoAttr(tag, 'data-playback-rates');
	});

	it('emits UI toggles as "true"/"false", with the exact data-show-bpm key', async () => {
		const tag = containerTag(
			await render({
				tracks: ONE_TRACK,
				showControls: false,
				showInfo: false,
				showTime: false,
				showHoverTime: true,
				showBPM: true,
				bpm: 128,
			})
		);
		expect(getAttr(tag, 'data-show-controls')).toBe('false');
		expect(getAttr(tag, 'data-show-info')).toBe('false');
		expect(getAttr(tag, 'data-show-time')).toBe('false');
		expect(getAttr(tag, 'data-show-hover-time')).toBe('true');
		// Important: `data-show-bpm` (single lowercase token), NOT
		// `data-show-b-p-m`. The core reads `dataset.showBpm`.
		expect(getAttr(tag, 'data-show-bpm')).toBe('true');
		expect(getAttr(tag, 'data-bpm')).toBe('128');
	});

	it('emits buttonAlign / buttonStyle / accessibility / error attrs', async () => {
		const tag = containerTag(
			await render({
				tracks: ONE_TRACK,
				buttonAlign: 'center',
				buttonStyle: 'minimal',
				accessibleSeek: false,
				seekLabel: 'Scrub track',
				errorText: 'Could not load',
				showMarkers: false,
			})
		);
		expect(getAttr(tag, 'data-button-align')).toBe('center');
		expect(getAttr(tag, 'data-button-style')).toBe('minimal');
		expect(getAttr(tag, 'data-accessible-seek')).toBe('false');
		expect(getAttr(tag, 'data-seek-label')).toBe('Scrub track');
		expect(getAttr(tag, 'data-error-text')).toBe('Could not load');
		expect(getAttr(tag, 'data-show-markers')).toBe('false');
	});

	it('emits behaviour flags as "true"/"false"', async () => {
		const tag = containerTag(
			await render({
				tracks: ONE_TRACK,
				autoplay: true,
				singlePlay: false,
				playOnSeek: false,
				enableMediaSession: false,
			})
		);
		expect(getAttr(tag, 'data-autoplay')).toBe('true');
		expect(getAttr(tag, 'data-single-play')).toBe('false');
		expect(getAttr(tag, 'data-play-on-seek')).toBe('false');
		expect(getAttr(tag, 'data-enable-media-session')).toBe('false');
	});
});

// ─── Tracks ──────────────────────────────────────────────────────────────

describe('<WaveformPlaylist> — tracks', () => {
	it('renders one [data-track] child per track, in order', async () => {
		const html = await render({
			tracks: [
				{ url: '/a.mp3', title: 'A' },
				{ url: '/b.mp3', title: 'B' },
				{ url: '/c.mp3', title: 'C' },
			],
		});
		const tracks = trackTags(html);
		expect(tracks).toHaveLength(3);
		expect(getAttr(tracks[0], 'data-url')).toBe('/a.mp3');
		expect(getAttr(tracks[1], 'data-url')).toBe('/b.mp3');
		expect(getAttr(tracks[2], 'data-url')).toBe('/c.mp3');
		expect(getAttr(tracks[0], 'data-title')).toBe('A');
		expect(getAttr(tracks[2], 'data-title')).toBe('C');
	});

	it('emits every per-track content field that is set', async () => {
		const html = await render({
			tracks: [
				{
					url: '/audio/ep.mp3',
					title: 'Episode 1',
					artist: 'with Guest',
					artwork: '/img/ep.jpg',
					album: 'Season 1',
					duration: '42:00',
				},
			],
		});
		const [track] = trackTags(html);
		expect(getAttr(track, 'data-url')).toBe('/audio/ep.mp3');
		expect(getAttr(track, 'data-title')).toBe('Episode 1');
		expect(getAttr(track, 'data-artist')).toBe('with Guest');
		expect(getAttr(track, 'data-artwork')).toBe('/img/ep.jpg');
		expect(getAttr(track, 'data-album')).toBe('Season 1');
		expect(getAttr(track, 'data-duration')).toBe('42:00');
	});

	it('omits per-track fields that are not provided', async () => {
		const html = await render({ tracks: [{ url: '/a.mp3' }] });
		const [track] = trackTags(html);
		expect(getAttr(track, 'data-url')).toBe('/a.mp3');
		expectNoAttr(track, 'data-title');
		expectNoAttr(track, 'data-artist');
		expectNoAttr(track, 'data-artwork');
		expectNoAttr(track, 'data-album');
		expectNoAttr(track, 'data-duration');
		expectNoAttr(track, 'data-markers');
	});

	it('JSON-stringifies per-track markers, omitting the attr for empty/absent', async () => {
		const markers = [
			{ time: 0, label: 'Intro' },
			{ time: 30, label: 'Drop', color: '#f00' },
		];
		const withMarkers = trackTags(await render({ tracks: [{ url: '/a.mp3', markers }] }))[0];
		expect(getAttr(withMarkers, 'data-markers')).toBe(JSON.stringify(markers));

		const emptyMarkers = trackTags(await render({ tracks: [{ url: '/a.mp3', markers: [] }] }))[0];
		expectNoAttr(emptyMarkers, 'data-markers');
	});
});

// ─── Chapters ────────────────────────────────────────────────────────────

describe('<WaveformPlaylist> — chapters', () => {
	it('renders a [data-chapter] child per chapter with data-time (string) + label', async () => {
		const html = await render({
			tracks: [
				{
					url: '/audio/ep.mp3',
					title: 'Episode',
					chapters: [
						{ time: 0, label: 'Intro' },
						{ time: 330, label: 'Main Topic' },
						{ time: 2700, label: 'Q&A' },
					],
				},
			],
		});

		const chapters = chapterEls(html);
		expect(chapters).toHaveLength(3);

		expect(getAttr(chapters[0].tag, 'data-time')).toBe('0');
		expect(chapters[0].label).toBe('Intro');

		expect(getAttr(chapters[1].tag, 'data-time')).toBe('330');
		expect(chapters[1].label).toBe('Main Topic');

		// Ampersand round-trips through Astro's entity encoding.
		expect(getAttr(chapters[2].tag, 'data-time')).toBe('2700');
		expect(chapters[2].label).toBe('Q&A');
	});

	it('emits data-color on a chapter only when set', async () => {
		const html = await render({
			tracks: [
				{
					url: '/a.mp3',
					chapters: [
						{ time: 0, label: 'A', color: '#a855f7' },
						{ time: 10, label: 'B' },
					],
				},
			],
		});
		const chapters = chapterEls(html);
		expect(getAttr(chapters[0].tag, 'data-color')).toBe('#a855f7');
		expectNoAttr(chapters[1].tag, 'data-color');
	});

	it('renders no chapter elements for a track without chapters', async () => {
		const html = await render({ tracks: [{ url: '/a.mp3' }] });
		expect(chapterEls(html)).toHaveLength(0);
	});

	it('scopes chapters to their own track across multiple tracks', async () => {
		const html = await render({
			tracks: [
				{ url: '/1.mp3', chapters: [{ time: 0, label: 'One' }] },
				{ url: '/2.mp3', chapters: [{ time: 0, label: 'Two-A' }, { time: 5, label: 'Two-B' }] },
			],
		});
		expect(trackTags(html)).toHaveLength(2);
		const labels = chapterEls(html).map((c) => c.label);
		expect(labels).toEqual(['One', 'Two-A', 'Two-B']);
	});
});

// ─── Lazy mounting ───────────────────────────────────────────────────────

describe('<WaveformPlaylist> — lazy mount', () => {
	it('uses data-waveform-playlist-lazy instead of data-waveform-playlist when lazy', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK, lazy: true }));
		expect(getAttr(tag, 'data-waveform-playlist-lazy')).toBe('');
		expectNoAttr(tag, 'data-waveform-playlist');
	});

	it('uses data-waveform-playlist when lazy is false', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK, lazy: false }));
		expect(getAttr(tag, 'data-waveform-playlist')).toBe('');
		expectNoAttr(tag, 'data-waveform-playlist-lazy');
	});

	it('ships the IntersectionObserver script ONLY when lazy is true', async () => {
		const lazy = await render({ tracks: ONE_TRACK, lazy: true });
		expect(lazy).toContain('__wfplLazyMountBound');
		expect(lazy).toContain('IntersectionObserver');

		const eager = await render({ tracks: ONE_TRACK, lazy: false });
		expect(eager).not.toContain('__wfplLazyMountBound');
		expect(eager).not.toContain('IntersectionObserver');
	});

	it('waits for window.WaveformPlaylist with a bounded retry before giving up', async () => {
		const lazy = await render({ tracks: ONE_TRACK, lazy: true });
		expect(lazy).toContain('MAX_WAIT_ATTEMPTS');
		expect(lazy).toContain('setTimeout');
		expect(lazy).toContain('console.warn');
		expect(lazy).toContain('WaveformPlaylist.init()');
	});
});

// ─── View Transitions re-init (non-lazy) ─────────────────────────────────

describe('<WaveformPlaylist> — View Transitions re-init', () => {
	it('ships a non-lazy re-init script that re-runs init on astro:page-load', async () => {
		const eager = await render({ tracks: ONE_TRACK, lazy: false });
		expect(eager).toContain('__wfplInitBound');
		expect(eager).toContain('astro:page-load');
		expect(eager).toContain('WaveformPlaylist.init()');
	});

	it('does NOT ship the non-lazy re-init script when lazy is true', async () => {
		const lazy = await render({ tracks: ONE_TRACK, lazy: true });
		expect(lazy).not.toContain('__wfplInitBound');
	});
});

// ─── Astro extras ────────────────────────────────────────────────────────

describe('<WaveformPlaylist> — Astro extras', () => {
	it('passes through the id prop to the container', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK, id: 'my-playlist' }));
		expect(getAttr(tag, 'id')).toBe('my-playlist');
	});

	it('merges user-supplied class with wfpl-host', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK, class: 'my-custom' }));
		const classAttr = getAttr(tag, 'class');
		expect(classAttr).not.toBeNull();
		expect(classAttr).toContain('wfpl-host');
		expect(classAttr).toContain('my-custom');
	});

	it('passes through inline style', async () => {
		const tag = containerTag(await render({ tracks: ONE_TRACK, style: 'min-height: 200px;' }));
		expect(getAttr(tag, 'style')).toBe('min-height: 200px;');
	});
});

// ─── Realistic combined usage ────────────────────────────────────────────

describe('<WaveformPlaylist> — realistic combined usage', () => {
	it('handles a fully-loaded prop set without dropping or mangling anything', async () => {
		const html = await render({
			// Playlist options
			layout: 'list',
			continuous: true,
			expandChapters: true,
			showDuration: true,
			showPlayState: true,
			chapterMarkerColor: 'rgba(168,85,247,0.8)',
			// Forwarded player options
			waveformStyle: 'mirror',
			height: 80,
			barWidth: 3,
			progressColor: 'rgba(168,85,247,0.9)',
			colorPreset: 'dark',
			showBPM: true,
			showPlaybackSpeed: true,
			playbackRates: [0.5, 1, 1.5, 2],
			// Astro extras
			id: 'podcast',
			class: 'theme-dark',
			style: 'min-height: 200px;',
			// Tracks with chapters + markers
			tracks: [
				{
					url: '/audio/ep1.mp3',
					title: 'Episode 1',
					artist: 'with Guest',
					artwork: '/img/ep1.jpg',
					album: 'Season 1',
					duration: '42:00',
					markers: [{ time: 90, label: 'Sponsor' }],
					chapters: [
						{ time: 0, label: 'Intro' },
						{ time: 330, label: 'Main Topic', color: '#a855f7' },
					],
				},
				{ url: '/audio/ep2.mp3', title: 'Episode 2', duration: '38:10' },
			],
		});

		const tag = containerTag(html);
		// Container: init attr + id + style + class
		expect(getAttr(tag, 'data-waveform-playlist')).toBe('');
		expect(getAttr(tag, 'id')).toBe('podcast');
		expect(getAttr(tag, 'style')).toBe('min-height: 200px;');
		const classAttr = getAttr(tag, 'class');
		expect(classAttr).toContain('wfpl-host');
		expect(classAttr).toContain('theme-dark');

		// Container: one attribute from every option group
		expect(getAttr(tag, 'data-layout')).toBe('list');
		expect(getAttr(tag, 'data-continuous')).toBe('true');
		expect(getAttr(tag, 'data-show-play-state')).toBe('true');
		expect(getAttr(tag, 'data-chapter-marker-color')).toBe('rgba(168,85,247,0.8)');
		expect(getAttr(tag, 'data-waveform-style')).toBe('mirror');
		expect(getAttr(tag, 'data-bar-width')).toBe('3');
		expect(getAttr(tag, 'data-color-preset')).toBe('dark');
		expect(getAttr(tag, 'data-progress-color')).toBe('rgba(168,85,247,0.9)');
		expect(getAttr(tag, 'data-show-bpm')).toBe('true');
		expect(getAttr(tag, 'data-playback-rates')).toBe('[0.5,1,1.5,2]');

		// Container must NOT carry per-track content
		expectNoAttr(tag, 'data-url');
		expectNoAttr(tag, 'data-title');

		// Tracks + chapters + markers
		const tracks = trackTags(html);
		expect(tracks).toHaveLength(2);
		expect(getAttr(tracks[0], 'data-title')).toBe('Episode 1');
		expect(getAttr(tracks[0], 'data-markers')).toBe(
			JSON.stringify([{ time: 90, label: 'Sponsor' }])
		);
		expect(getAttr(tracks[1], 'data-duration')).toBe('38:10');

		const chapters = chapterEls(html);
		expect(chapters.map((c) => c.label)).toEqual(['Intro', 'Main Topic']);
		expect(getAttr(chapters[1].tag, 'data-color')).toBe('#a855f7');
	});
});
