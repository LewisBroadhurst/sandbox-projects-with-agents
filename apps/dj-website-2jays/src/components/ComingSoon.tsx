/** Placeholder shown in a section while its content list is still empty. */
export function ComingSoon({ icon, text }: { icon: string; text: string }) {
	return (
		<div className="flex flex-col items-center text-center gap-[0.8rem] p-[clamp(2.5rem,6vw,4rem)] border-[1.5px] border-dashed border-line rounded-[18px] bg-bg-soft text-muted max-w-[560px]">
			<span className="text-[2.4rem] text-gradient" aria-hidden="true">
				{icon}
			</span>
			<p className="m-0 max-w-[40ch]">{text}</p>
		</div>
	);
}
