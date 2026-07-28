import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Text, useParent } from 'react-tela';
import type { AppInfo } from '../apps';
import { AppIcon } from '../components/AppIcon';
import { FilePicker } from '../components/FilePicker';
import { Footer, FooterItem } from '../components/Footer';
import { TextInput } from '../components/TextInput';
import { useGamepadButton } from '../hooks/use-gamepad';
import { generateDeterministicID } from '../title-id';
import type { GenerateState } from './Generate';

export interface EditState extends AppInfo {
	romPath?: string;
}

// Image formats supported by Jimp, re-encodes icon as a JPEG in the "Generate" route
const ICON_EXTENSIONS = ['jpg', 'jpeg', 'png'];

export function Edit() {
	const initialState: EditState = useLocation().state;
	const root = useParent();
	const navigate = useNavigate();
	const [id, setId] = useState('');
	const [icon, setIcon] = useState(() => initialState.icon);
	const [iconPickerShowing, setIconPickerShowing] = useState(false);
	const [name, setName] = useState(() => initialState.name);
	const [author, setAuthor] = useState(() => initialState.author);
	const [version, setVersion] = useState(() => initialState.version);
	const [profileSelector, _setProfileSelector] = useState(false);
	const [nroPath, setNroPath] = useState(() => decodeURI(initialState.path));
	const [romPath, setRomPath] = useState(() =>
		decodeURI(initialState.romPath ?? ''),
	);
	const [focusedIndex, setFocusedIndex] = useState(-1);

	// Generate a deterministic title ID based on the NRO path and arguments.
	// This matches sphaira's logic so the same NRO always gets the same title ID.
	useEffect(() => {
		let argv = nroPath;
		if (romPath) {
			argv += ` "${romPath}"`;
		}
		generateDeterministicID(nroPath, argv).then(setId);
	}, [nroPath, romPath]);

	const fields = [
		{ name: 'Title ID', value: id, onChange: setId, description: '' },
		{ name: 'App Title', value: name, onChange: setName },
		{ name: 'Author', value: author, onChange: setAuthor },
		{ name: 'Version', value: version, onChange: setVersion },
		{
			name: romPath ? 'Core Path' : 'NRO Path',
			value: nroPath,
			onChange: setNroPath,
		},
		//{ name: 'Enable Profile Selector', value: profileSelector, onChange: setProfileSelector },
	];
	if (initialState.romPath) {
		fields.push({ name: 'ROM Path', value: romPath, onChange: setRomPath });
	}
	const fieldsLength = fields.length;
	const keyboardShown = navigator.virtualKeyboard.boundingRect.height > 0;
	const focused = !keyboardShown && !iconPickerShowing;

	const handleIconSelect = useCallback((url: URL) => {
		try {
			// I/O error may be thrown for files that are currently open
			const data = Switch.readFileSync(url);
			if (data) {
				setIcon(data);
			}
		} catch (err) {
			console.debug(`Failed to read "${url}": ${err}`);
		}
		setIconPickerShowing(false);
	}, []);

	const goToGenerate = useCallback(
		(install: boolean) => {
			const state: GenerateState = {
				id,
				icon,
				path: nroPath,
				romPath,
				name,
				author,
				version,
				profileSelector,
				install,
			};
			navigate('/generate', { state });
		},
		[
			id,
			icon,
			nroPath,
			romPath,
			name,
			author,
			version,
			profileSelector,
			navigate,
		],
	);

	useGamepadButton(
		'X',
		() => goToGenerate(true),
		[goToGenerate],
		focused,
	);

	useGamepadButton(
		'Y',
		() => goToGenerate(false),
		[goToGenerate],
		focused,
	);

	useGamepadButton(
		'L',
		() => {
			// Select a custom icon image
			setIconPickerShowing(true);
		},
		[],
		focused,
	);

	useGamepadButton(
		'B',
		() => {
			// Go back
			navigate(-1);
		},
		[navigate],
		focused,
	);

	useGamepadButton(
		'Up',
		() => {
			setFocusedIndex((i) => Math.max(0, i - 1));
		},
		[],
		focused,
	);

	useGamepadButton(
		'Down',
		() => {
			setFocusedIndex((i) => Math.min(fieldsLength - 1, i + 1));
		},
		[fieldsLength],
		focused,
	);

	return (
		<>
			<Text fill='white' fontSize={32} x={4} y={8}>
				Edit configuration for your forwarder:
			</Text>

			{fields.map(({ name, value, onChange }, i) => (
				<>
					<Text
						key={`${name}-label`}
						fill='white'
						fontSize={24}
						x={20}
						y={88 + i * 50}
					>
						{name}:
					</Text>
					<TextInput
						key={`${name}-input`}
						value={value}
						onChange={onChange}
						width={700}
						x={160}
						y={80 + i * 50}
						fontSize={24}
						fill='white'
						focused={focusedIndex === i && !iconPickerShowing}
						onTouchEnd={() => setFocusedIndex(i)}
					/>
				</>
			))}

			<AppIcon
				icon={icon}
				x={root.ctx.canvas.width - 320}
				y={64}
				onTouchEnd={() => setIconPickerShowing(true)}
			/>

			<Footer>
				<FooterItem button='L' x={root.ctx.canvas.width - 960}>
					Change Icon
				</FooterItem>
				<FooterItem button='B' x={root.ctx.canvas.width - 740}>
					Back
				</FooterItem>
				<FooterItem button='A' x={root.ctx.canvas.width - 620}>
					Edit
				</FooterItem>
				<FooterItem button='Y' x={root.ctx.canvas.width - 510}>
					Save Forwarder
				</FooterItem>
				<FooterItem button='X' x={root.ctx.canvas.width - 260}>
					Install Forwarder
				</FooterItem>
			</Footer>

			{iconPickerShowing && (
				<FilePicker
					extensions={ICON_EXTENSIONS}
					onSelect={handleIconSelect}
					onClose={() => setIconPickerShowing(false)}
				/>
			)}
		</>
	);
}
