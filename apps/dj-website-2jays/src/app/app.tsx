import { useEffect } from 'react';
import { profile } from '../content';
import { Nav, Hero, Marquee, About, Listen, Watch, Gigs, Book, Footer } from '../components';

export function App() {
	// Keep the browser tab honest even if JS-rendered late.
	useEffect(() => {
		document.title = `${profile.name} — DJ · Available for Bookings`;
	}, []);

	return (
		<div className="relative isolate">
			<div className="fixed inset-0 z-0 pointer-events-none opacity-5 bg-grain" aria-hidden="true" />
			<Nav />
			<main>
				<Hero />
				<Marquee />
				<About />
				<Listen />
				<Watch />
				<Gigs />
				<Book />
			</main>
			<Footer />
		</div>
	);
}

export default App;
