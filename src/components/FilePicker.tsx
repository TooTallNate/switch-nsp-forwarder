import { useCallback, useEffect, useState } from 'react';
import { Group, Rect, Text, useParent } from 'react-tela';
import { useDirection, useGamepadButton } from '../hooks/use-gamepad';
import { isDirectory } from '../util';
import { ScrollGroup } from './ScrollGroup';

interface Entry {
	name: string;
	isDirectory: boolean;
}

export interface FilePickerProps {
	onSelect?: (url: URL) => void;
	onClose?: () => void;
}

export function FilePicker({ onSelect, onClose }: FilePickerProps) {
	const [dir, setDir] = useState(new URL('sdmc:/'));
	const [entries, setEntries] = useState<Entry[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollTop, setScrollTop] = useState(0);
	const root = useParent();
	const focused = true;
	const numEntries = entries.length;
	const itemHeight = 20;
	const padding = 8;
	const itemTotalHeight = itemHeight + padding * 2;
	const visibleWidth = root.ctx.canvas.width - 80;
	const visibleHeight = root.ctx.canvas.height - 80;
	const itemsPerPage = Math.floor(visibleHeight / itemTotalHeight);
	const centeringPadding = Math.floor((visibleHeight % itemTotalHeight) / 2);
	const contentHeight = numEntries * itemTotalHeight;
	// Derive integer scroll offset from pixel scrollTop for gamepad navigation
	const scrollOffset = Math.round(scrollTop / itemTotalHeight);

	const doSelect = useCallback(
		(entry: Entry) => {
			if (entry.name === '..' && dir.href.endsWith(':/')) {
				return onClose?.();
			}

			let selection: URL;
			try {
				selection = new URL(
					entry.isDirectory ? `${entry.name}/` : entry.name,
					dir,
				);
			} catch (err) {
				console.debug(`Failed to parse URL from entry: ${entry} from ${dir}`);
				return;
			}
			console.debug('Selection:', selection.href);

			if (entry.isDirectory) {
				setDir(selection);
				setSelectedIndex(0);
			} else {
				onSelect?.(selection);
			}
		},
		[dir, onClose, onSelect],
	);

	useDirection(
		'Up',
		() => {
			setSelectedIndex((i) => {
				const newIndex = Math.max(0, i - 1);
				// If we're at the top of the visible area and there are items above
				if (newIndex < scrollOffset && scrollOffset > 0) {
					setScrollTop(newIndex * itemTotalHeight);
				}
				return newIndex;
			});
		},
		[numEntries, scrollOffset, itemsPerPage, itemTotalHeight],
		focused,
		true,
	);

	useDirection(
		'Down',
		() => {
			setSelectedIndex((i) => {
				const newIndex = Math.min(numEntries - 1, i + 1);
				// If we're at the bottom of the visible area and there are items below
				if (newIndex >= scrollOffset + itemsPerPage) {
					setScrollTop(
						Math.min(numEntries - itemsPerPage, scrollOffset + 1) *
							itemTotalHeight,
					);
				}
				return newIndex;
			});
		},
		[numEntries, scrollOffset, itemsPerPage, itemTotalHeight],
		focused,
		true,
	);

	useGamepadButton(
		'A',
		() => {
			doSelect(entries[selectedIndex]);
		},
		[doSelect, entries, selectedIndex],
		focused,
	);

	// FIXME: exit the picker when we're at the root directory
	useGamepadButton(
		'B',
		() => doSelect(entries[0]),
		[doSelect, entries],
		focused,
	);

	useEffect(() => {
		const names = Switch.readDirSync(dir) ?? [];
		const entries: Entry[] = names
			.map((name) => {
				// Skip hidden files
				if (name.startsWith('.')) return;

				try {
					const stat = Switch.statSync(new URL(name, dir));
					return {
						name,
						isDirectory: stat ? isDirectory(stat.mode) : false,
					};
				} catch (err) {
					console.debug(`Failed to stat "${name}" in "${dir}": ${err}`);
				}
			})
			.filter((v) => typeof v !== 'undefined');
		setEntries(
			[{ name: '..', isDirectory: true }, ...entries].sort((a, b) => {
				if (a.isDirectory && !b.isDirectory) return -1;
				if (b.isDirectory && !a.isDirectory) return 1;
				return a.name.localeCompare(b.name);
			}),
		);
		// Reset when changing directories
		setSelectedIndex(0);
		setScrollTop(0);
	}, [dir]);

	return (
		<>
			<Rect
				width={root.ctx.canvas.width}
				height={root.ctx.canvas.height}
				fill='rgba(0, 0, 0, 0.5)'
			/>
			<Group width={visibleWidth} height={visibleHeight} x={40} y={40}>
				<Rect
					width={visibleWidth}
					height={visibleHeight}
					fill='black'
					lineWidth={4}
				/>
				{numEntries > 0 && (
					<ScrollGroup
						width={visibleWidth}
						height={visibleHeight - centeringPadding * 2}
						contentHeight={contentHeight}
						scrollTop={scrollTop}
						onScrollTopChange={setScrollTop}
						numEntries={numEntries}
						itemsPerPage={itemsPerPage}
						y={centeringPadding}
					>
						{entries.map((entry, i) => (
							<FilePickerItem
								key={entry.name}
								entry={entry}
								index={i}
								selected={i === selectedIndex}
								width={visibleWidth}
							/>
						))}
					</ScrollGroup>
				)}
				<Rect
					width={visibleWidth}
					height={visibleHeight}
					stroke='white'
					lineWidth={4}
				/>
			</Group>
		</>
	);
}

function FilePickerItem({
	entry,
	index,
	selected,
	width,
}: {
	entry: Entry;
	index: number;
	selected: boolean;
	width: number;
}) {
	const height = 20;
	const padding = 8;
	const y = (height + padding * 2) * index;
	return (
		<Group width={width} height={height + padding * 2} x={0} y={y}>
			{selected && (
				<Rect width={width} height={height + padding * 2} fill='blue' />
			)}
			<Text
				fill='white'
				fontFamily='system-icons'
				fontSize={height}
				x={padding}
				y={padding}
			>
				{entry.isDirectory ? '' : ''}
			</Text>
			<Text fill='white' fontSize={height} x={padding + 28} y={padding}>
				{entry.name}
			</Text>
		</Group>
	);
}
