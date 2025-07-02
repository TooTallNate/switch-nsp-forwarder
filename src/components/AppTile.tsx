import { Group, Rect, Text, useRoot } from 'react-tela';
import { AppIcon } from './AppIcon';

export function AppTile({
	icon,
	name,
	index,
	selected,
	onTouchEnd,
	perRow,
	scrollOffset = 0,
}: {
	icon: ArrayBuffer | undefined;
	name: string;
	index: number;
	selected: boolean;
	onTouchEnd?: () => void;
	perRow: number;
	scrollOffset?: number;
}) {
	const root = useRoot();
	const width = root.ctx.canvas.width / perRow;
	const height = width;
	const x = (index % perRow) * width;
	const row = Math.floor(index / perRow)
	const y = row * height - (scrollOffset * height) / 2;
	const iconSize = width * 0.75;
	return (
		<Group width={width} height={height} x={x} y={y} onTouchEnd={onTouchEnd}>
			{selected && (
				<Rect width={width} height={height} fill='rgba(0, 0, 255, 0.5)' />
			)}
			<AppIcon
				icon={icon}
				width={iconSize}
				height={iconSize}
				x={width / 2 - iconSize / 2}
				y={16}
			/>
			<Text
				fill='white'
				fontSize={18}
				x={width / 2}
				y={iconSize + 30}
				textAlign='center'
			>
				{name}
			</Text>
		</Group>
	);
}
