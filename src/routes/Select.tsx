import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, Text, useParent } from 'react-tela';
import { type AppInfo, apps, pathToAppInfo } from '../apps';
import { AppTile } from '../components/AppTile';
import { FilePicker } from '../components/FilePicker';
import { Footer, FooterItem } from '../components/Footer';
import { Scrollbar } from '../components/Scrollbar';
import { useDirection, useGamepadButton } from '../hooks/use-gamepad';

export function Select() {
	const root = useParent();
	const navigate = useNavigate();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [filePickerShowing, setFilePickerShowing] = useState(false);

	const perRow = 5;
	const focused = !filePickerShowing;
	const viewportWidth = root.ctx.canvas.width;
	const viewportHeight = root.ctx.canvas.height - 114;
	const tileHeight = viewportWidth / perRow;
	const totalRows = Math.ceil(apps.length / perRow);
	const contentHeight = totalRows * tileHeight;

	// Calculate scroll position to keep selected row centered in the viewport
	const selectedRow = Math.floor(selectedIndex / perRow);
	const rowsVisible = Math.floor(viewportHeight / tileHeight);
	const centerRow = Math.floor(rowsVisible / 2);
	const scrollTop = Math.max(
		0,
		Math.min(
			(selectedRow - centerRow) * tileHeight,
			contentHeight - viewportHeight,
		),
	);
	// Scrollbar uses item-based offset
	const scrollOffset = Math.round(scrollTop / tileHeight);

	const goToEdit = useCallback(
		(appInfo: AppInfo) => {
			navigate('/edit', { state: appInfo });
		},
		[navigate],
	);

	useGamepadButton(
		'A',
		() => goToEdit(apps[selectedIndex]),
		[selectedIndex, goToEdit],
		focused,
	);

	useGamepadButton('B', () => navigate(-1), [navigate], focused);

	useGamepadButton(
		'X',
		() => {
			setFilePickerShowing(true);
		},
		[],
		focused,
	);

	useDirection(
		'Left',
		() => {
			setSelectedIndex((i) => {
				if (i % perRow === 0) return i;
				return i - 1;
			});
		},
		[],
		focused,
	);

	useDirection(
		'Right',
		() => {
			setSelectedIndex((i) => {
				if (i === apps.length - 1) return i;
				if (i % perRow === perRow - 1) return i;
				return i + 1;
			});
		},
		[],
		focused,
	);

	useDirection(
		'Up',
		() => {
			setSelectedIndex((i) => Math.max(0, i - perRow));
		},
		[],
		focused,
	);

	useDirection(
		'Down',
		() => {
			setSelectedIndex((i) => Math.min(apps.length - 1, i + perRow));
		},
		[],
		focused,
	);

	return (
		<>
			<Text fill='white' fontSize={24}>
				Select an app to create a forwarder for:
			</Text>
			<Text fill='white' fontSize={24} x={500}>
				{apps[selectedIndex].path}
			</Text>

			<Group
				y={40}
				width={viewportWidth}
				height={viewportHeight}
				contentHeight={contentHeight}
				scrollTop={scrollTop}
			>
				{apps.map((app, i) => (
					<AppTile
						key={app.path}
						icon={app.icon}
						name={app.name}
						index={i}
						onTouchEnd={() => goToEdit(app)}
						selected={selectedIndex === i}
					/>
				))}
			</Group>
			<Scrollbar
				height={viewportHeight}
				x={viewportWidth}
				y={40}
				numEntries={totalRows}
				itemsPerPage={rowsVisible}
				scrollOffset={scrollOffset}
			/>

			<Footer>
				<FooterItem button='Plus' x={root.ctx.canvas.width - 560}>
					Exit
				</FooterItem>
				<FooterItem button='X' x={root.ctx.canvas.width - 450}>
					File Picker
				</FooterItem>
				<FooterItem button='B' x={root.ctx.canvas.width - 260}>
					Back
				</FooterItem>
				<FooterItem button='A' x={root.ctx.canvas.width - 140}>
					Select
				</FooterItem>
			</Footer>

			{filePickerShowing && (
				<FilePicker
					onClose={() => {
						setFilePickerShowing(false);
					}}
					onSelect={(url) => {
						const app = pathToAppInfo(url);
						if (app) {
							goToEdit(app);
						}
					}}
				/>
			)}
		</>
	);
}
