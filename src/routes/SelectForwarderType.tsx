import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text, useRoot } from 'react-tela';
import { Footer, FooterItem } from '../components/Footer';
import { useDirection, useGamepadButton } from '../hooks/use-gamepad';
import {
	NROForwarderIcon,
	RetroArchForwarderIcon,
} from '../components/ForwarderIcon';

const NEXT_ROUTES = ['/select', '/select-retroarch'];

export function SelectForwarderType() {
	const root = useRoot();
	const navigate = useNavigate();
	const [selectedIndex, setSelectedIndex] = useState(0);

	useGamepadButton('A', () => navigate(NEXT_ROUTES[selectedIndex]), [
		navigate,
		selectedIndex,
	]);

	useDirection('Left', () => setSelectedIndex(0), []);

	useDirection('Right', () => setSelectedIndex(1), []);

	return (
		<>
			<Text
				fill='white'
				fontSize={32}
				textAlign='center'
				x={root.ctx.canvas.width / 2}
				y={100}
			>
				What type of forwarder do you want to generate?
			</Text>
			<NROForwarderIcon
				x={root.ctx.canvas.width / 2 - 380}
				y={200}
				selected={selectedIndex === 0}
				onTouchEnd={() => navigate(NEXT_ROUTES[0])}
			/>
			<RetroArchForwarderIcon
				x={root.ctx.canvas.width / 2 + 50}
				y={200}
				selected={selectedIndex === 1}
				onTouchEnd={() => navigate(NEXT_ROUTES[1])}
			/>
			<Footer>
				<FooterItem button='Plus' x={root.ctx.canvas.width - 260}>
					Exit
				</FooterItem>
				<FooterItem button='A' x={root.ctx.canvas.width - 140}>
					Select
				</FooterItem>
			</Footer>
		</>
	);
}
