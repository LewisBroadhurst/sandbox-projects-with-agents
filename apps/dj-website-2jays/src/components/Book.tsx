import { useState } from 'react';
import { profile, socials } from '../content';
import { sectionClass, btnPrimary } from './ui';
import { SectionHead } from './SectionHead';

const fieldClass =
	'text-[1rem] text-ink bg-bg border border-line rounded-[12px] py-[0.85rem] px-[1rem] resize-y transition-colors duration-200 placeholder:text-[#6d6790] focus:outline-none focus:border-cyan';
const labelClass = 'flex flex-col gap-[0.45rem] text-[0.9rem] font-semibold text-muted uppercase tracking-[0.08em]';
const socialLink =
	'py-[0.5rem] px-[1rem] border border-line rounded-full text-[0.9rem] font-semibold [transition:border-color_0.2s_ease,color_0.2s_ease] hover:border-cyan hover:text-cyan';

export function Book() {
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
		<section className={`${sectionClass} scroll-mt-20`} id="book">
			<SectionHead index="05" title="Book 2JAYS" sub={`Small gigs, parties, launches and warm-ups — ${profile.location} & beyond.`} />
			<div className="grid grid-cols-[1.4fr_1fr] gap-[clamp(2rem,5vw,3.5rem)] bg-card border border-line rounded-[24px] p-[clamp(1.6rem,4vw,3rem)] max-[820px]:grid-cols-1">
				<form className="flex flex-col gap-[1.1rem]" onSubmit={handleSubmit}>
					<label className={labelClass}>
						Your name
						<input name="name" type="text" required placeholder="Who's asking?" className={fieldClass} />
					</label>
					<label className={labelClass}>
						Event date
						<input name="date" type="text" placeholder="e.g. Sat 16 Aug (or 'flexible')" className={fieldClass} />
					</label>
					<label className={labelClass}>
						Details
						<textarea name="details" rows={4} required placeholder="Type of event, venue, vibe, set length…" className={fieldClass} />
					</label>
					<button type="submit" className={`${btnPrimary} mt-[0.4rem]`}>
						{sent ? 'Opening your email…' : 'Send booking enquiry'}
					</button>
					<p className="text-[0.9rem] text-muted mt-[0.2rem]">
						Prefer email?{' '}
						<a href={`mailto:${profile.bookingEmail}`} className="text-cyan">
							{profile.bookingEmail}
						</a>
					</p>
				</form>
				<aside>
					<h3 className="font-display text-[1.3rem] mb-4">Why 2JAYS</h3>
					<ul className="list-none p-0 mb-[1.6rem] flex flex-col gap-[0.8rem]">
						<li className="relative pl-6 text-[#d8d3f5] before:content-['▸'] before:absolute before:left-0 before:text-lime">
							Reads the room and builds the energy — no dead floors.
						</li>
						<li className="relative pl-6 text-[#d8d3f5] before:content-['▸'] before:absolute before:left-0 before:text-lime">
							Own kit ready, or plug into the house setup.
						</li>
						<li className="relative pl-6 text-[#d8d3f5] before:content-['▸'] before:absolute before:left-0 before:text-lime">
							Reliable, easy to work with, in it for the music.
						</li>
					</ul>
					<div className="flex flex-wrap gap-[0.8rem]">
						{socials.instagram && (
							<a href={socials.instagram} target="_blank" rel="noreferrer" className={socialLink}>
								Instagram
							</a>
						)}
						{socials.tiktok && (
							<a href={socials.tiktok} target="_blank" rel="noreferrer" className={socialLink}>
								TikTok
							</a>
						)}
						{socials.soundcloud && (
							<a href={socials.soundcloud} target="_blank" rel="noreferrer" className={socialLink}>
								SoundCloud
							</a>
						)}
					</div>
				</aside>
			</div>
		</section>
	);
}
