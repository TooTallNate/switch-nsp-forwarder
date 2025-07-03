import { useState, useCallback, useEffect } from 'react';
import { Group, Rect, Text } from 'react-tela';
import { AppIcon } from './AppIcon';
import { FilePicker } from './FilePicker';
import { useGamepadButton } from '../hooks/use-gamepad';
import { AppIconFromImageUrl } from '../utils/util';
import { Shade } from './Shade';
import { Modal } from './Modal';

export interface AppIconSelectorProps {
	icon: ArrayBuffer | undefined;
	focused: boolean;
	x: number;
	y: number;
	/** Returns a new iconBuffer when selecting a supported image */
	onChange: (icon: ArrayBuffer) => void;
	onStealFocus: (isFocus: boolean) => void;
	onClick?: () => void;
}

export function AppIconSelector({
	icon,
	focused,
	x,
	y,
	onChange,
	onClick,
	onStealFocus,
}: AppIconSelectorProps) {
	const [filePickerOpen, setFilePickerOpen] = useState(false);
	const [errorModal, setErrorModal] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);

	const selectedStrokeWidth = 4;

	// Used to tell the parent that it should stop any button event listeners.
	useEffect(() => {
		onStealFocus(filePickerOpen || (errorModal?.length ?? 0) > 0);
	}, [onStealFocus, filePickerOpen, errorModal]);

	useGamepadButton(
		'A',
		() => {
			if (!filePickerOpen && !errorModal) {
				setFilePickerOpen(true);
			} else if (errorModal) {
				setErrorModal(null);
			}
		},
		[filePickerOpen, errorModal],
		focused && !filePickerOpen,
	);

	// TESTING ONLY
	useGamepadButton(
		'X',
		() => {
			if (!errorModal) {
				setErrorModal('Testing The Error Modal.\nThis is a multi-line message');
			} else {
				setErrorModal(null);
			}
		},
		[errorModal],
		focused,
	);

	const handleFileSelect = useCallback(
		async (url: URL) => {
			setFilePickerOpen(false);
			setProcessing(true);
			// setTimeout to let React flush the updates, otherwise the filePicker UI gets stuck.
			// Is there a better way?
			setTimeout(async () => {
				try {
					const iconBuf = await AppIconFromImageUrl(url);
					onChange(iconBuf);
				} catch (err) {
					setErrorModal(err instanceof Error ? err.message : 'Unknown error');
				}
				setProcessing(false);
			}, 20);
		},
		[onChange],
	);

	return (
		<>
			<Group
				x={x}
				y={y}
				width={256 + selectedStrokeWidth}
				height={256 + selectedStrokeWidth}
				onTouchEnd={onClick}
			>
				<AppIcon icon={icon} width={256} height={256} x={2} y={2} />
				{processing && (
					<>
						<Rect fill='rgba(0,0,0,0.5)' width={256} height={256} x={2} y={2} />
						<Text
							fill='white'
							textAlign='center'
							fontFamily='system-icons'
							fontSize={64}
							x={130}
							y={130 - 32}
						>
							{'\uE0C8 \uE0C9'}
						</Text>
					</>
				)}
				<Rect
					width={focused ? 260 : 256}
					height={focused ? 260 : 256}
					stroke={focused ? '#00ffca' : 'rgba(255, 255, 255, 0.5)'}
					lineWidth={focused ? selectedStrokeWidth : selectedStrokeWidth / 2}
					x={focused ? 0 : selectedStrokeWidth / 2}
					y={focused ? 0 : selectedStrokeWidth / 2}
				/>
			</Group>
			{filePickerOpen && (
				<>
					<Shade />
					<FilePicker
						onSelect={handleFileSelect}
						onClose={() => setFilePickerOpen(false)}
					/>
				</>
			)}
			{errorModal && (
				<Modal
					title='ERROR'
					body={errorModal}
					buttons={[{ button: 'A', text: 'OK' }]}
				/>
			)}
		</>
	);
}
