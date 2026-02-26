import { createContext, useCallback, useContext, useRef } from 'react';
import { Group, type GroupProps } from 'react-tela';
import { Scrollbar } from './Scrollbar';

/**
 * Context that exposes whether the user is currently performing a
 * scroll-drag gesture. Child components should check `isDragging()`
 * in their `onTouchEnd` handlers to avoid acting on scroll gestures.
 */
const ScrollDragContext = createContext({ isDragging: () => false as boolean });

/**
 * Returns `true` if the user just finished a scroll-drag gesture.
 * Use this in `onTouchEnd` handlers to suppress tap actions during scrolling.
 */
export function useScrollDrag() {
	return useContext(ScrollDragContext);
}

export interface ScrollGroupProps {
	/** Visible viewport width */
	width: number;
	/** Visible viewport height */
	height: number;
	/** Total height of the scrollable content */
	contentHeight: number;
	/** Current scroll position (pixels from top) */
	scrollTop: number;
	/** Called when touch scrolling changes the scroll position */
	onScrollTopChange: (scrollTop: number) => void;
	/** X position of the ScrollGroup */
	x?: number;
	/** Y position of the ScrollGroup */
	y?: number;
	/** Number of discrete entries (for scrollbar sizing) */
	numEntries: number;
	/** Number of entries visible per page (for scrollbar sizing) */
	itemsPerPage: number;
	/** Additional props passed to the inner Group */
	groupProps?: Omit<
		GroupProps,
		| 'width'
		| 'height'
		| 'contentHeight'
		| 'scrollTop'
		| 'x'
		| 'y'
		| 'onTouchStart'
		| 'onTouchMove'
	>;
	children: React.ReactNode;
}

export function ScrollGroup({
	width,
	height,
	contentHeight,
	scrollTop,
	onScrollTopChange,
	x = 0,
	y = 0,
	numEntries,
	itemsPerPage,
	groupProps,
	children,
}: ScrollGroupProps) {
	const touchStartY = useRef(0);
	const scrollTopAtTouchStart = useRef(0);
	const didDrag = useRef(false);
	const scrollDragValue = useRef({ isDragging: () => didDrag.current }).current;

	// Minimum distance (in pixels) a touch must move to be considered a drag
	const dragThreshold = 10;

	const maxScrollTop = Math.max(0, contentHeight - height);

	const onTouchStart = useCallback(
		(e: TouchEvent) => {
			const touch = e.changedTouches[0];
			touchStartY.current = touch.clientY;
			scrollTopAtTouchStart.current = scrollTop;
			didDrag.current = false;
		},
		[scrollTop],
	);

	const onTouchMove = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();
			const touch = e.changedTouches[0];
			const deltaY = touchStartY.current - touch.clientY;
			if (Math.abs(deltaY) > dragThreshold) {
				didDrag.current = true;
			}
			const newScrollTop = Math.max(
				0,
				Math.min(scrollTopAtTouchStart.current + deltaY, maxScrollTop),
			);
			onScrollTopChange(newScrollTop);
		},
		[maxScrollTop, onScrollTopChange],
	);

	// Derive an item-based offset for the scrollbar
	const scrollOffset =
		itemsPerPage >= numEntries
			? 0
			: Math.round((scrollTop / maxScrollTop) * (numEntries - itemsPerPage));

	return (
		<ScrollDragContext.Provider value={scrollDragValue}>
			<Group
				{...groupProps}
				x={x}
				y={y}
				width={width}
				height={height}
				contentHeight={contentHeight}
				scrollTop={scrollTop}
				onTouchStart={onTouchStart}
				onTouchMove={onTouchMove}
			>
				{children}
			</Group>
			<Scrollbar
				height={height}
				x={x + width}
				y={y}
				numEntries={numEntries}
				itemsPerPage={itemsPerPage}
				scrollOffset={scrollOffset}
			/>
		</ScrollDragContext.Provider>
	);
}
