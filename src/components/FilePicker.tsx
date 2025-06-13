import { useCallback, useEffect, useState } from "react";
import { Group, Rect, Text, useRoot } from "react-tela";
import { useGamepadButton, useDirection } from "../hooks/use-gamepad";
import { isDirectory } from "../util";

interface Entry {
	name: string;
	isDirectory: boolean;
}

export interface FilePickerProps {
	onSelect?: (url: URL) => void;
	onClose?: () => void;
}

export function FilePicker({ onSelect, onClose }: FilePickerProps) {
	const [dir, setDir] = useState(new URL("sdmc:/"));
	const [entries, setEntries] = useState<Entry[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const root = useRoot();
	const focused = true;
	const numEntries = entries.length;
	const itemHeight = 20;
	const padding = 8;
	const visibleHeight = root.ctx.canvas.height - 80;
	const itemsPerPage = Math.floor(visibleHeight / (itemHeight + padding * 2));
	const centeringPadding = Math.floor(
		(visibleHeight % (itemHeight + padding * 2)) / 2
	);

	// Calculate if we have items above
	const hasItemsAbove = scrollOffset > 0;
	// Calculate if we have items below
	const hasItemsBelow =
		scrollOffset + itemsPerPage + (hasItemsAbove ? 1 : 0) < numEntries;

	// Calculate visible entries
	const visibleEntries = entries.slice(
		scrollOffset,
		scrollOffset +
			itemsPerPage -
			(hasItemsAbove ? 1 : 0) -
			(hasItemsBelow ? 1 : 0)
	);

	const doSelect = useCallback(
		(entry: Entry) => {
			if (entry.name === ".." && dir.href.endsWith(":/")) {
				return onClose?.();
			}

			let selection: URL;
			try {
				selection = new URL(
					entry.isDirectory ? `${entry.name}/` : entry.name,
					dir
				);
			} catch (err) {
				console.debug(
					`Failed to parse URL from entry: ${entry} from ${dir}`
				);
				return;
			}
			console.debug("Selection:", selection.href);

			if (entry.isDirectory) {
				setDir(selection);
				setSelectedIndex(0);
			} else {
				onSelect?.(selection);
			}
		},
		[dir, onClose, onSelect]
	);

	useDirection(
		"Up",
		() => {
			setSelectedIndex((i) => {
				const newIndex = Math.max(0, i - 1);
				// If we're at the top of the visible area and there are items above
				if (newIndex === scrollOffset && scrollOffset > 0) {
					setScrollOffset(Math.max(0, scrollOffset - 1));
				}
				return newIndex;
			});
		},
		[scrollOffset],
		focused,
		true
	);

	useDirection(
		"Down",
		() => {
			setSelectedIndex((i) => {
				const newIndex = Math.min(numEntries - 1, i + 1);
				// If we're at the bottom of the visible area and there are items below
				if (
					newIndex >= scrollOffset + visibleEntries.length &&
					scrollOffset + visibleEntries.length < numEntries
				) {
					setScrollOffset(
						Math.min(numEntries - itemsPerPage, scrollOffset + 1)
					);
				}
				return newIndex;
			});
		},
		[numEntries, scrollOffset, visibleEntries.length],
		focused,
		true
	);

	useGamepadButton(
		"A",
		() => {
			const adjustedIndex = selectedIndex - (scrollOffset > 0 ? 1 : 0);
			doSelect(entries[adjustedIndex]);
		},
		[doSelect, entries, selectedIndex, scrollOffset],
		focused
	);

	// FIXME: exit the picker when we're at the root directory
	useGamepadButton(
		"B",
		() => doSelect(entries[0]),
		[doSelect, entries],
		focused
	);

	useEffect(() => {
		const names = Switch.readDirSync(dir) ?? [];
		const entries: Entry[] = names
			.map((name) => {
				// Skip hidden files
				if (name.startsWith(".")) return;

				try {
					const stat = Switch.statSync(new URL(name, dir));
					return {
						name,
						isDirectory: stat ? isDirectory(stat.mode) : false,
					};
				} catch (err) {
					console.debug(
						`Failed to stat "${name}" in "${dir}": ${err}`
					);
				}
			})
			.filter((v) => typeof v !== "undefined");
		setEntries(
			[{ name: "..", isDirectory: true }, ...entries].sort((a, b) => {
				if (a.isDirectory && !b.isDirectory) return -1;
				if (b.isDirectory && !a.isDirectory) return 1;
				return a.name.localeCompare(b.name);
			})
		);
	}, [dir]);

	return (
		<>
			<Rect
				width={root.ctx.canvas.width}
				height={root.ctx.canvas.height}
				fill="rgba(0, 0, 0, 0.5)"
			/>
			<Group
				width={root.ctx.canvas.width - 80}
				height={root.ctx.canvas.height - 80}
				x={40}
				y={40}
			>
				<Rect
					width={root.ctx.canvas.width - 80}
					height={root.ctx.canvas.height - 80}
					fill="black"
					lineWidth={4}
				/>
				<Group
					width={root.ctx.canvas.width - 80}
					height={root.ctx.canvas.height - 80}
					y={centeringPadding}
					x={0}
				>
					{visibleEntries.map((entry, i) => (
						<>
							{i === 0 && hasItemsAbove && (
								<Arrow direction="Up" index={0} />
							)}
							<FilePickerItem
								key={entry.name}
								entry={entry}
								index={scrollOffset + i}
								selected={
									scrollOffset +
										i +
										(hasItemsAbove ? 1 : 0) ===
									selectedIndex
								}
								scrollOffset={scrollOffset}
							/>
							{i === visibleEntries.length - 1 &&
								hasItemsBelow && (
									<Arrow
										direction="Down"
										index={itemsPerPage - 1}
									/>
								)}
						</>
					))}
				</Group>
				<Rect
					width={root.ctx.canvas.width - 80}
					height={root.ctx.canvas.height - 80}
					stroke="white"
					lineWidth={4}
				/>
			</Group>
		</>
	);
}

function Arrow({
	direction,
	index,
}: {
	direction: "Up" | "Down";
	index: number;
}) {
	const width = useRoot().ctx.canvas.width - 80;
	const height = 20;
	const padding = 8;
	const y = (height + padding * 2) * index;
	return (
		<Group
			width={width}
			height={height + padding * 2}
			x={padding * 2}
			y={y}
		>
			<Text
				fill="white"
				fontSize={height}
				x={padding}
				y={padding}
				textAlign="center"
			>
				{direction === "Up" ? "▲" : "▼"}
			</Text>
		</Group>
	);
}

function FilePickerItem({
	entry,
	index,
	selected,
	scrollOffset,
	onTouchEnd,
}: {
	entry: Entry;
	index: number;
	selected: boolean;
	onTouchEnd?: () => void;
	scrollOffset: number;
}) {
	const root = useRoot();
	const width = root.ctx.canvas.width - 80;
	const height = 20;
	const padding = 8;
	// Calculate if we need to adjust for up arrow
	const hasUpArrow = scrollOffset > 0;
	const y =
		(height + padding * 2) * (index - scrollOffset + (hasUpArrow ? 1 : 0));
	return (
		<Group
			width={width}
			height={height + padding * 2}
			x={0}
			y={y}
			onTouchEnd={onTouchEnd}
		>
			{selected && (
				<Rect width={width} height={height + padding * 2} fill="blue" />
			)}
			<Text
				fill="white"
				fontFamily="system-icons"
				fontSize={height}
				x={padding}
				y={padding}
			>
				{entry.isDirectory ? "" : ""}
			</Text>
			<Text fill="white" fontSize={height} x={padding + 28} y={padding}>
				{entry.name}
			</Text>
		</Group>
	);
}
