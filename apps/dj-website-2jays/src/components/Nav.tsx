import { useState } from 'react';

const links = [
	['About', '#about'],
	['Listen', '#listen'],
	['Watch', '#watch'],
	['Gigs', '#gigs'],
	['Book', '#book'],
];

// Mobile dropdown positioning + reveal (mirrors the old @media max-width:820px).
const mobileMenu =
	'max-[820px]:absolute max-[820px]:top-full max-[820px]:left-0 max-[820px]:right-0 max-[820px]:flex-col max-[820px]:items-start max-[820px]:gap-2 max-[820px]:pt-[1.2rem] max-[820px]:px-[clamp(1rem,4vw,3rem)] max-[820px]:pb-[1.6rem] max-[820px]:bg-[rgba(10,10,18,0.97)] max-[820px]:border-b max-[820px]:border-line max-[820px]:[transition:opacity_0.2s_ease,transform_0.2s_ease]';
const mobileClosed = 'max-[820px]:opacity-0 max-[820px]:[transform:translateY(-8px)] max-[820px]:pointer-events-none';
const mobileOpen = 'max-[820px]:opacity-100 max-[820px]:[transform:translateY(0)] max-[820px]:pointer-events-auto';

export function Nav() {
	const [open, setOpen] = useState(false);
	return (
		<header className="sticky top-0 z-50 flex items-center justify-between py-4 px-[clamp(1rem,4vw,3rem)] bg-[rgba(10,10,18,0.72)] backdrop-blur-[14px] border-b border-line">
			<a href="#top" className="font-display font-extrabold text-[1.5rem] tracking-[0.02em]">
				2<span className="text-gradient">JAYS</span>
			</a>
			<button
				className="hidden max-[820px]:flex flex-col gap-[5px] bg-transparent border-0 cursor-pointer p-[6px]"
				aria-label="Toggle menu"
				aria-expanded={open}
				onClick={() => setOpen(v => !v)}
			>
				<span className="w-[26px] h-[2px] bg-ink block" />
				<span className="w-[26px] h-[2px] bg-ink block" />
				<span className="w-[26px] h-[2px] bg-ink block" />
			</button>
			<nav className={`flex items-center gap-[1.6rem] text-[0.98rem] ${mobileMenu} ${open ? mobileOpen : mobileClosed}`}>
				{links.map(([label, href]) => (
					<a key={href} href={href} onClick={() => setOpen(false)} className="text-muted hover:text-ink transition-colors duration-200">
						{label}
					</a>
				))}
				<a
					href="#book"
					onClick={() => setOpen(false)}
					className="px-[1.1rem] py-[0.5rem] rounded-full border border-magenta text-ink transition-colors duration-200 hover:bg-magenta hover:text-bg"
				>
					Book now
				</a>
			</nav>
		</header>
	);
}
