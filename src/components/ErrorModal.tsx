import { Group, Rect, Text, useRoot } from 'react-tela';
import { FooterItem } from './Footer';
import { useGamepadButton } from '../hooks/use-gamepad';

interface ErrorModalProps {
	message: string;
	onClose: () => void;
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
	const root = useRoot();
	useGamepadButton('A', onClose, [onClose], true);
	return (
		<Group
			width={root.ctx.canvas.width}
			height={root.ctx.canvas.height}
			x={0}
			y={0}
		>
			<Rect
				width={root.ctx.canvas.width}
				height={root.ctx.canvas.height}
				fill='rgba(0,0,0,0.5)'
			/>
			<Group
				x={root.ctx.canvas.width / 2 - 200}
				y={root.ctx.canvas.height / 2 - 80}
				width={400}
				height={160}
			>
				<Rect
					width={400}
					height={160}
					fill='black'
					stroke='white'
					lineWidth={4}
				/>
				<Text fill='white' fontSize={22} x={20} y={40}>
					{message}
				</Text>
				<FooterItem button='A' x={170}>
					OK
				</FooterItem>
			</Group>
		</Group>
	);
}
