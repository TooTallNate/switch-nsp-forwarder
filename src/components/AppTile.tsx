import { useCallback } from 'react';
import { Group, Rect, Text, useParent } from 'react-tela';
import { AppIcon } from './AppIcon';
import { useScrollDrag } from './ScrollGroup';

export function AppTile({
	icon,
	name,
	index,
	selected,
	onTouchEnd,
}: {
	icon: ArrayBuffer | undefined;
	name: string;
	index: number;
	selected: boolean;
	onTouchEnd?: () => void;
}) {
	const root = useParent();
	const { isDragging } = useScrollDrag();
	const perRow = 5;
	const width = root.ctx.canvas.width / perRow;
	const height = width;
	const x = (index % perRow) * width;
	const y = Math.floor(index / perRow) * height;
	const iconSize = width * 0.75;
	const handleTouchEnd = useCallback(() => {
		if (!isDragging()) {
			onTouchEnd?.();
		}
	}, [isDragging, onTouchEnd]);
	return (
		<Group
			width={width}
			height={height}
			x={x}
			y={y}
			onTouchEnd={handleTouchEnd}
		>
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
