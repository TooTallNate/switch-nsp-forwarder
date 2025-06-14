import { Rect } from 'react-tela';

export interface ScrollbarProps {
	height: number;
	x: number;
	numEntries: number;
	itemsPerPage: number;
	scrollOffset: number;
	padding?: number;
}

export function Scrollbar({
	height,
	x,
	numEntries,
	itemsPerPage,
	scrollOffset,
	padding = 8,
}: ScrollbarProps) {
	if (numEntries <= itemsPerPage) return null;

	// Calculate scrollbar dimensions
	const scrollbarWidth = 8;
	const scrollbarHeight = Math.floor(
		Math.max((height * itemsPerPage) / numEntries, height * 0.1),
	);
	const scrollbarY = Math.round(
		(height - scrollbarHeight) * (scrollOffset / (numEntries - itemsPerPage)),
	);
	return (
		<Rect
			width={scrollbarWidth}
			height={scrollbarHeight}
			x={x - scrollbarWidth - padding}
			y={scrollbarY}
			fill='rgba(255, 255, 255, 0.5)'
		/>
	);
}
