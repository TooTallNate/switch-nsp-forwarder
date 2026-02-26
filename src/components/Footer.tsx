import { Group, Rect, Text, useParent } from 'react-tela';
import { BUTTON_ICONS } from '../button-icons';
import type { ButtonName } from '../types';

export function Footer({ children }: { children: React.ReactNode }) {
	const root = useParent();
	return (
		<Group
			width={root.ctx.canvas.width}
			height={74}
			y={root.ctx.canvas.height - 74}
		>
			<Rect width={root.ctx.canvas.width} height={2} fill='white' />
			{children}
		</Group>
	);
}

export function FooterItem({
	button,
	children,
	x,
}: { button: ButtonName; children: string; x: number }) {
	return (
		<>
			<Text
				fontFamily='system-icons'
				fill='white'
				fontSize={24}
				textBaseline='middle'
				x={x}
				y={37}
			>
				{BUTTON_ICONS[button]}
			</Text>
			<Text
				fontFamily='system-ui'
				fill='white'
				fontSize={24}
				textBaseline='middle'
				x={x + 30}
				y={37}
			>
				{children}
			</Text>
		</>
	);
}
