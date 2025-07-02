import { useCallback, useState } from 'react';
import { Text, useRoot } from 'react-tela';
import { useLocation, useNavigate } from 'react-router-dom';
import { TextInput } from '../components/TextInput';
import { AppIconSelector } from '../components/AppIconSelector';
import { useDirection, useGamepadButton } from '../hooks/use-gamepad';
import { generateRandomID } from '../utils/title-id';
import { Footer, FooterItem } from '../components/Footer';
import type { GenerateState } from './Generate';
import type { AppInfo } from '../apps';

export interface EditState extends AppInfo {
	romPath?: string;
}

export function Edit() {
	const initialState: EditState = useLocation().state;
	if (!initialState) {console.error('No initial state');}
	const root = useRoot();
	const navigate = useNavigate();
	const [id, setId] = useState(() => {
		let idVal = 0n;
		try {
			idVal = BigInt(`0x${initialState.id}`);
		} catch (err) {
			console.debug(
				`Failed to parse id: ${initialState.id} for ${initialState.path}`,
			);
		}
		return idVal === 0n ? generateRandomID() : initialState.id;
	});
	const [name, setName] = useState(() => initialState.name);
	const [author, setAuthor] = useState(() => initialState.author);
	const [version, setVersion] = useState(() => initialState.version);
	const [profileSelector, _setProfileSelector] = useState(false);
	const [nroPath, setNroPath] = useState(() => initialState.path);
	const [romPath, setRomPath] = useState(() => initialState.romPath ?? '');
	const [icon, setIcon] = useState<ArrayBuffer | undefined>(initialState.icon);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const [iconSelected, setIconSelected] = useState(false);

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
		!keyboardShown,
	);

	useGamepadButton(
		'Y',
		() => goToGenerate(false),
		[goToGenerate],
		!keyboardShown,
	);

	useGamepadButton(
		'B',
		() => {
			// Go back
			navigate(-1);
		},
		[navigate],
		!keyboardShown,
	);

	useDirection(
		'Up',
		() => {
			if (!iconSelected) {
				setFocusedIndex((i) => Math.max(0, i - 1));
			}
		},
		[iconSelected],
		!keyboardShown,
	);

	useDirection(
		'Down',
		() => {
			if (!iconSelected) {
				setFocusedIndex((i) => Math.min(fieldsLength - 1, i + 1));
			}
		},
		[iconSelected, fieldsLength],
		!keyboardShown,
	);

	useDirection(
		'Left',
		() => {
			if (iconSelected) {
				setIconSelected(false);
				// focusedIndex remains the same
			}
		},
		[iconSelected],
		!keyboardShown,
	);

	useDirection(
		'Right',
		() => {
			setIconSelected(true);
		},
		[],
		!keyboardShown,
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
						focused={focusedIndex === i && !iconSelected}
						onTouchEnd={() => {setFocusedIndex(i); setIconSelected(false);}}
					/>
				</>
			))}

			<Footer>
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

			{/* Place below the Footer to render modals on top */}
			<AppIconSelector
				icon={icon}
				focused={iconSelected}
				x={root.ctx.canvas.width - 320}
				y={64}
				onChange={setIcon}
				onClick={() => setIconSelected(true)}
			/>

		</>
	);
}
