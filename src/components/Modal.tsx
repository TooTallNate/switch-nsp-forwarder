import { Group, Rect, Text, useRoot } from 'react-tela';
import { FooterItem } from './Footer';
import { Shade } from './Shade';
import type { ButtonName } from '../types';

export type ModalButton = {
	text: string;
	button: ButtonName;
	selected?: boolean;
};

type ModalProps = {
	width?: number;
	height?: number;
	title?: string;
	/** Newlines will be converted into separate, centered <Text> elements */
	body?: string;
	buttons: ModalButton[];
};

export const Modal = ({
	width = 770,
	height = 290,
	title,
	body,
	buttons,
}: ModalProps) => {
	const root = useRoot();
	const dividerWidth = 2;

	const rows = body?.split('\n') || [];

	const bodyHeight = rows.length * 28; // 22font height, 26 spacing, add some extra for ligatures

	const buttonCount = buttons.length;
	const totalDividerWidth =
		buttonCount > 1 ? (buttonCount - 1) * dividerWidth : 0;
	const availableWidth = width - totalDividerWidth;
	// Calculate base button width and remainder
	const baseButtonWidth = Math.floor(availableWidth / buttonCount);
	const remainder = availableWidth % buttonCount;

	const { width: w, height: h } = root.ctx.canvas;

	return (
		<>
			<Shade />
			<Group
				width={width}
				height={height}
				x={w / 2 - width / 2}
				y={h / 2 - height / 2}
			>
				<Rect width={width} height={height} fill='#484848' />
				{title && (
					<Text fill='white' fontSize={22} x={20} y={20} fontWeight='bold'>
						{title}
					</Text>
				)}
				<Group
					x={0}
					y={(title ? 80 : 40) + bodyHeight / 2}
					width={width}
					height={bodyHeight}
				>
					{rows.map((row, i) => {
						return (
							<Text
								key={row}
								fill='white'
								fontSize={22}
								x={width / 2}
								y={26 * i}
								textAlign='center'
							>
								{row}
							</Text>
						);
					})}
				</Group>
				{/* Pseudo footer area */}
				<Group width={width} height={74} y={height - 74}>
					<Rect width={width} height={2} fill='white' />
					{buttons.reverse().map((button, index, arr) => {
						// Divide the space evenly, sharing the remainder to the first items
						const buttonWidth = baseButtonWidth + (index < remainder ? 1 : 0);
						const x = index * (buttonWidth + dividerWidth);

						const hasLeftDivider = index > 0;
						const hasRightDivider = index < arr.length - 1;
						// lineWidth appears to be from the center of the bounding box, but the dividers are pixel based
						const selectionX = hasLeftDivider ? x - dividerWidth / 2 : x;
						const selectionWidth =
							buttonWidth +
							(hasLeftDivider ? dividerWidth / 2 : 0) +
							(hasRightDivider ? dividerWidth / 2 : 0);

						return (
							<>
								{button.selected && (
									<Rect
										x={x}
										y={0}
										width={buttonWidth}
										height={74}
										fill='rgba(255,255,255,0.15)'
									/>
								)}
								<FooterItem
									key={`${button.button}${button.text}`}
									button={button.button}
									x={x + buttonWidth / 2 - 30}
								>
									{button.text}
								</FooterItem>
								{index < arr.length - 1 && (
									<Rect
										width={dividerWidth}
										height={height}
										x={x + buttonWidth}
										fill='white'
									/>
								)}
								{button.selected && (
									<Rect
										x={selectionX}
										y={0}
										width={selectionWidth}
										height={74}
										stroke='white'
										lineWidth={dividerWidth * 2}
									/>
								)}
							</>
						);
					})}
				</Group>
			</Group>
		</>
	);
};
