/* ============================================================================
 * 2JAYS — SITE CONTENT
 * ----------------------------------------------------------------------------
 * This is the ONLY file you need to edit to keep the site up to date.
 * Change the text, add gigs, and — when you're ready — drop in your
 * SoundCloud tracks and TikTok videos. Everything below is heavily commented.
 * ==========================================================================*/

/* ---------------------------------------------------------------------------
 * 1. THE BASICS — who you are and how people reach you.
 * -------------------------------------------------------------------------*/
export const profile = {
	name: '2JAYS',
	tagline: 'Funky. Forward. Ready to move a room.',
	// One or two lines that show up right under your name in the hero.
	intro:
		'House, disco and everything with soul — mixed live, mixed loud. Available to book for small gigs, parties and club nights.',
	// Genres shown as little pills in the hero.
	genres: ['House', 'Disco', 'Funk', 'UK Garage', 'Soulful Grooves'],
	// Where you're based (shown in the booking section).
	location: 'London, UK',
	// The email that booking enquiries are sent to.
	bookingEmail: 'bookings@2jays.dj',

	// Your bio — one paragraph per line. Add or remove lines freely.
	bio: [
		"2JAYS is an aspiring DJ carving out a sound that's equal parts warm and relentless — vintage disco cuts sliding into rolling house, always built around one thing: keeping people dancing.",
		'Coming up through bedroom mixes and house parties, 2JAYS treats every set — no matter how small the room — like it matters. Tight mixing, a deep record bag, and a read on the crowd that turns a quiet night into a proper one.',
		"Now taking bookings for intimate gigs, birthdays, launches and club warm-ups. If you've got a room, 2JAYS will bring the energy.",
	],

	// Little stat badges shown in the About section. Keep them punchy.
	stats: [
		{ value: '2+ hrs', label: 'Seamless live sets' },
		{ value: '100%', label: 'Vinyl & digital ready' },
		{ value: 'Open', label: 'For bookings now' },
	],
};

/* ---------------------------------------------------------------------------
 * 2. SOCIAL LINKS — leave any blank ('') to hide that button.
 * -------------------------------------------------------------------------*/
export const socials = {
	instagram: 'https://instagram.com/', // e.g. https://instagram.com/2jays
	tiktok: 'https://tiktok.com/', // e.g. https://tiktok.com/@2jays
	soundcloud: 'https://soundcloud.com/', // e.g. https://soundcloud.com/2jays
};

/* ---------------------------------------------------------------------------
 * 3. LISTEN — your SoundCloud tracks / mixes.
 * ----------------------------------------------------------------------------
 * HOW TO ADD A TRACK (takes ~30 seconds):
 *   1. Open your track or mix on soundcloud.com.
 *   2. Click  Share  →  Embed.
 *   3. In the embed code you'll see  src="https://w.soundcloud.com/player/..."
 *   4. Copy ONLY that URL (the part inside the quotes) and paste it as
 *      `embedUrl` below. Give it a `title`. Done.
 *
 * Until you add one, a friendly "coming soon" placeholder is shown instead —
 * so the site looks finished even while it's empty.
 * -------------------------------------------------------------------------*/
export type Track = {
	title: string;
	embedUrl: string; // the https://w.soundcloud.com/player/... URL
};

export const tracks: Track[] = [
	// EXAMPLE (delete this line's leading "//" and paste your real URL):
	// { title: 'Sunset Rollers — Live Mix', embedUrl: 'https://w.soundcloud.com/player/?url=...' },
];

/* ---------------------------------------------------------------------------
 * 4. WATCH — your TikTok clips.
 * ----------------------------------------------------------------------------
 * HOW TO ADD A TIKTOK (takes ~30 seconds):
 *   1. Open the TikTok video in a browser. The URL looks like:
 *        https://www.tiktok.com/@2jays/video/7412345678901234567
 *   2. Copy the long number at the end — that's the `id`.
 *   3. Add a line below with that id and a short `title`. Done.
 *
 * Until you add one, a placeholder is shown so the section still looks great.
 * -------------------------------------------------------------------------*/
export type Video = {
	title: string;
	id: string; // the number from the end of the TikTok URL
};

export const videos: Video[] = [
	// EXAMPLE (delete this line's leading "//" and paste your real id):
	// { title: 'Warehouse warm-up', id: '7412345678901234567' },
];

/* ---------------------------------------------------------------------------
 * 5. GIGS — upcoming (and past) shows.
 * ----------------------------------------------------------------------------
 * Add a line per show. Set `soldOut: true` to show a SOLD OUT badge, or add a
 * `ticketUrl` to turn the row into a "Tickets" link.
 * -------------------------------------------------------------------------*/
export type Gig = {
	date: string; // e.g. 'SAT 16 AUG'
	venue: string;
	city: string;
	soldOut?: boolean;
	ticketUrl?: string;
};

export const gigs: Gig[] = [
	// EXAMPLE:
	// { date: 'SAT 16 AUG', venue: 'The Cause', city: 'London', ticketUrl: 'https://...' },
	// { date: 'FRI 29 AUG', venue: 'Birthday Bash (Private)', city: 'Manchester', soldOut: true },
];
