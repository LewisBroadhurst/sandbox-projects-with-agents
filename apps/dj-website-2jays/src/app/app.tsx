import { useEffect, useState } from 'react';
import {
	profile,
	socials,
	tracks,
	videos,
	gigs,
	type Track,
	type Video,
	type Gig,
} from '../content';

/* ---------- Small building blocks -------------------------------------- */

function Marquee() {
	const items = ['DISCO', '★', 'HOUSE', '★', 'FUNK', '★', 'GROOVE', '★', 'SOUL', '★'];
	// Repeat so the strip always fills wide screens.
	const strip = [...items, ...items, ...items];
	return (
		<div className="marquee" aria-hidden="true">
			<div className="marquee__track">
				{strip.map((t, i) => (
					<span key={i} className={t === '★' ? 'marquee__star' : 'marquee__word'}>
						{t}
					</span>
				))}
			</div>
		</div>
	);
}

/** One SoundCloud track, or a "coming soon" placeholder if none are added. */
function TrackCard({ track }: { track: Track }) {
	return (
		<div className="embed-card">
			<iframe
				title={track.title}
				className="embed-card__frame"
				scrolling="no"
				frameBorder="no"
				allow="autoplay"
				loading="lazy"
				src={track.embedUrl}
			/>
			<p className="embed-card__caption">{track.title}</p>
		</div>
	);
}

/** One TikTok video via TikTok's official iframe embed (no external script). */
function VideoCard({ video }: { video: Video }) {
	return (
		<div className="embed-card embed-card--video">
			<div className="video-frame">
				<iframe
					title={video.title}
					src={`https://www.tiktok.com/embed/v2/${video.id}`}
					allow="autoplay; encrypted-media; fullscreen"
					loading="lazy"
					frameBorder="0"
				/>
			</div>
			<p className="embed-card__caption">{video.title}</p>
		</div>
	);
}

/** Shown in a section when its content list is still empty. */
function ComingSoon({ icon, text }: { icon: string; text: string }) {
	return (
		<div className="coming-soon">
			<span className="coming-soon__icon" aria-hidden="true">
				{icon}
			</span>
			<p>{text}</p>
		</div>
	);
}

/* ---------- Sections ---------------------------------------------------- */

function Nav() {
	const [open, setOpen] = useState(false);
	const links = [
		['About', '#about'],
		['Listen', '#listen'],
		['Watch', '#watch'],
		['Gigs', '#gigs'],
		['Book', '#book'],
	];
	return (
		<header className="nav">
			<a href="#top" className="nav__logo">
				2<span>JAYS</span>
			</a>
			<button
				className="nav__toggle"
				aria-label="Toggle menu"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
			>
				<span />
				<span />
				<span />
			</button>
			<nav className={`nav__links ${open ? 'is-open' : ''}`}>
				{links.map(([label, href]) => (
					<a key={href} href={href} onClick={() => setOpen(false)}>
						{label}
					</a>
				))}
				<a href="#book" className="nav__cta" onClick={() => setOpen(false)}>
					Book now
				</a>
			</nav>
		</header>
	);
}

function Hero() {
	return (
		<section className="hero" id="top">
			<div className="hero__glow" aria-hidden="true" />
			<div className="hero__inner">
				<p className="hero__eyebrow">DJ · {profile.location} · Available for bookings</p>
				<h1 className="hero__name">{profile.name}</h1>
				<p className="hero__tagline">{profile.tagline}</p>
				<p className="hero__intro">{profile.intro}</p>
				<div className="hero__genres">
					{profile.genres.map((g) => (
						<span key={g} className="pill">
							{g}
						</span>
					))}
				</div>
				<div className="hero__actions">
					<a href="#book" className="btn btn--primary">
						Book 2JAYS
					</a>
					<a href="#listen" className="btn btn--ghost">
						Hear the sound ↓
					</a>
				</div>
			</div>
		</section>
	);
}

function About() {
	return (
		<section className="section" id="about">
			<div className="section__head">
				<span className="section__index">01</span>
				<h2 className="section__title">About</h2>
			</div>
			<div className="about">
				<div className="about__bio">
					{profile.bio.map((p, i) => (
						<p key={i}>{p}</p>
					))}
				</div>
				<div className="about__stats">
					{profile.stats.map((s) => (
						<div key={s.label} className="stat">
							<span className="stat__value">{s.value}</span>
							<span className="stat__label">{s.label}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function Listen() {
	return (
		<section className="section" id="listen">
			<div className="section__head">
				<span className="section__index">02</span>
				<h2 className="section__title">Listen</h2>
				<p className="section__sub">Mixes &amp; tracks straight from SoundCloud.</p>
			</div>
			{tracks.length > 0 ? (
				<div className="grid grid--tracks">
					{tracks.map((t) => (
						<TrackCard key={t.embedUrl} track={t} />
					))}
				</div>
			) : (
				<ComingSoon
					icon="♫"
					text="Fresh mixes dropping soon. Follow on SoundCloud so you don't miss the first one."
				/>
			)}
		</section>
	);
}

function Watch() {
	return (
		<section className="section" id="watch">
			<div className="section__head">
				<span className="section__index">03</span>
				<h2 className="section__title">Watch</h2>
				<p className="section__sub">Clips from behind the decks on TikTok.</p>
			</div>
			{videos.length > 0 ? (
				<div className="grid grid--videos">
					{videos.map((v) => (
						<VideoCard key={v.id} video={v} />
					))}
				</div>
			) : (
				<ComingSoon
					icon="▶"
					text="Set clips and studio moments are on the way. Catch them first on TikTok."
				/>
			)}
		</section>
	);
}

function GigsSection() {
	return (
		<section className="section" id="gigs">
			<div className="section__head">
				<span className="section__index">04</span>
				<h2 className="section__title">Gigs</h2>
				<p className="section__sub">Where to catch a set next.</p>
			</div>
			{gigs.length > 0 ? (
				<ul className="gigs">
					{gigs.map((g: Gig, i) => (
						<li key={i} className="gig">
							<span className="gig__date">{g.date}</span>
							<span className="gig__venue">
								<strong>{g.venue}</strong>
								<em>{g.city}</em>
							</span>
							<span className="gig__action">
								{g.soldOut ? (
									<span className="gig__soldout">Sold out</span>
								) : g.ticketUrl ? (
									<a href={g.ticketUrl} target="_blank" rel="noreferrer" className="btn btn--small">
										Tickets
									</a>
								) : (
									<span className="gig__tba">Info soon</span>
								)}
							</span>
						</li>
					))}
				</ul>
			) : (
				<ComingSoon
					icon="◎"
					text="No dates on the calendar right now — which means yours could be the next one. Get in touch below."
				/>
			)}
		</section>
	);
}

function Book() {
	// No backend needed: the form composes a pre-filled email to the booking
	// address. Perfect for a static site on Cloudflare Pages.
	const [sent, setSent] = useState(false);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const form = e.currentTarget;
		const data = new FormData(form);
		const name = String(data.get('name') || '');
		const date = String(data.get('date') || '');
		const details = String(data.get('details') || '');
		const subject = encodeURIComponent(`Booking enquiry — ${name || 'via website'}`);
		const body = encodeURIComponent(`Name: ${name}\nEvent date: ${date}\n\nDetails:\n${details}`);
		window.location.href = `mailto:${profile.bookingEmail}?subject=${subject}&body=${body}`;
		setSent(true);
	}

	return (
		<section className="section section--book" id="book">
			<div className="section__head">
				<span className="section__index">05</span>
				<h2 className="section__title">Book 2JAYS</h2>
				<p className="section__sub">
					Small gigs, parties, launches and warm-ups — {profile.location} &amp; beyond.
				</p>
			</div>
			<div className="book">
				<form className="book__form" onSubmit={handleSubmit}>
					<label>
						Your name
						<input name="name" type="text" required placeholder="Who's asking?" />
					</label>
					<label>
						Event date
						<input name="date" type="text" placeholder="e.g. Sat 16 Aug (or 'flexible')" />
					</label>
					<label>
						Details
						<textarea
							name="details"
							rows={4}
							required
							placeholder="Type of event, venue, vibe, set length…"
						/>
					</label>
					<button type="submit" className="btn btn--primary">
						{sent ? 'Opening your email…' : 'Send booking enquiry'}
					</button>
					<p className="book__note">
						Prefer email?{' '}
						<a href={`mailto:${profile.bookingEmail}`}>{profile.bookingEmail}</a>
					</p>
				</form>
				<aside className="book__aside">
					<h3>Why 2JAYS</h3>
					<ul>
						<li>Reads the room and builds the energy — no dead floors.</li>
						<li>Own kit ready, or plug into the house setup.</li>
						<li>Reliable, easy to work with, in it for the music.</li>
					</ul>
					<div className="book__socials">
						{socials.instagram && (
							<a href={socials.instagram} target="_blank" rel="noreferrer">
								Instagram
							</a>
						)}
						{socials.tiktok && (
							<a href={socials.tiktok} target="_blank" rel="noreferrer">
								TikTok
							</a>
						)}
						{socials.soundcloud && (
							<a href={socials.soundcloud} target="_blank" rel="noreferrer">
								SoundCloud
							</a>
						)}
					</div>
				</aside>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="footer">
			<span className="footer__logo">2JAYS</span>
			<span className="footer__tag">Available for bookings · {profile.location}</span>
			<span className="footer__copy">
				© {new Date().getFullYear()} {profile.name}. Keep dancing.
			</span>
		</footer>
	);
}

export function App() {
	// Keep the browser tab honest even if JS-rendered late.
	useEffect(() => {
		document.title = `${profile.name} — DJ · Available for Bookings`;
	}, []);

	return (
		<div className="page">
			<div className="grain" aria-hidden="true" />
			<Nav />
			<main>
				<Hero />
				<Marquee />
				<About />
				<Listen />
				<Watch />
				<GigsSection />
				<Book />
			</main>
			<Footer />
		</div>
	);
}

export default App;
