import { useEffect, useMemo, useState } from 'react';
import { Group, Rect, Text, type TextProps, useParent } from 'react-tela';
import { useGamepadButton } from '../hooks/use-gamepad';

export interface TextInputProps extends TextProps {
	width: number;
	value: string;
	padding?: number;
	focused?: boolean;
	onChange: (value: string) => void;
}

export function TextInput({
	value,
	onChange,
	onTouchEnd,
	width,
	x,
	y,
	padding = 8,
	fontSize = 24,
	fontFamily = 'system-ui',
	focused = false,
	...textProps
}: TextInputProps) {
	const root = useParent();
	const [cursorPosition, setCursorPosition] = useState(-1);

	useGamepadButton(
		'A',
		() => {
			const vk = navigator.virtualKeyboard;
			if (vk.boundingRect.height) return; // Ignore since the keyboard is already open
			vk.value = value;
			vk.cursorIndex = cursorPosition >= 0 ? cursorPosition : value.length;
			vk.show();
		},
		[value, cursorPosition],
		focused,
	);

	useEffect(() => {
		if (!focused) return;
		const vk = navigator.virtualKeyboard;
		function onCursorMoveEvent() {
			setCursorPosition(vk.cursorIndex);
		}
		function onChangeEvent() {
			setCursorPosition(vk.cursorIndex);
			onChange(vk.value);
		}
		function onSubmitEvent() {
			setCursorPosition(-1);
		}
		vk.addEventListener('submit', onSubmitEvent);
		vk.addEventListener('change', onChangeEvent);
		vk.addEventListener('cursormove', onCursorMoveEvent);
		return () => {
			vk.removeEventListener('submit', onSubmitEvent);
			vk.removeEventListener('change', onChangeEvent);
			vk.removeEventListener('cursormove', onCursorMoveEvent);
		};
	}, [focused, onChange]);

	const cursorPositionX = useMemo(() => {
		const { ctx } = root;
		ctx.font = `${fontSize}px ${fontFamily}`;
		return root.ctx.measureText(value.slice(0, cursorPosition)).width;
	}, [root, fontSize, fontFamily, cursorPosition, value]);

	return (
		<Group
			width={width + padding * 2}
			height={fontSize + padding * 2}
			x={x}
			y={y}
			onTouchEnd={onTouchEnd}
		>
			<Text
				{...textProps}
				fontSize={fontSize}
				fontFamily={fontFamily}
				x={padding}
				y={padding}
			>
				{value}
			</Text>
			{focused && cursorPosition >= 0 ? (
				<Rect
					width={2}
					height={fontSize}
					y={padding}
					x={cursorPositionX + padding}
					fill='#00ffca'
				/>
			) : null}
			<Rect
				width={width + padding * 2}
				height={fontSize + padding * 2}
				stroke={focused ? '#00ffca' : 'rgba(255, 255, 255, 0.5)'}
				lineWidth={2}
			/>
		</Group>
	);
}
