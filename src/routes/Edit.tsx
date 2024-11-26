import { useState } from 'react';
import { Text, useRoot } from 'react-tela';
import { useLocation, useNavigate } from 'react-router-dom';
import { TextInput } from '../components/TextInput';
import { AppIcon } from '../components/AppIcon';
import { useGamepad } from '../hooks/use-gamepad';
import { usePreventExit } from '../hooks/use-prevent-exit';
import { generateRandomID } from '../title-id';
import { Footer, FooterItem } from '../components/Footer';
import type { GenerateState } from './Generate';

export interface EditState {
	app: Switch.Application;
	path: string;
}

export function Edit() {
	const { app, path }: EditState = useLocation().state;
	const root = useRoot();
	const navigate = useNavigate();
	const [titleId, setTitleId] = useState(() =>
		app.id > 0n ? app.id.toString(16).padStart(16, '0') : generateRandomID(),
	);
	const [name, setName] = useState(() => app.name);
	const [author, setAuthor] = useState(() => app.author);
	const [version, setVersion] = useState(() => app.version);
	const [profileSelector, setProfileSelector] = useState(false);
	const [nroPath, setNroPath] = useState(path);
	const [focusedIndex, setFocusedIndex] = useState(-1);

	const fields = [
		{ name: 'Title ID', value: titleId, onChange: setTitleId, description: '' },
		{ name: 'App Title', value: name, onChange: setName },
		{ name: 'Author', value: author, onChange: setAuthor },
		{ name: 'Version', value: version, onChange: setVersion },
		{ name: 'NRO Path', value: nroPath, onChange: setNroPath },
	];
	const fieldsLength = fields.length;

	usePreventExit();

	useGamepad(
		{
			Plus() {
				if (navigator.virtualKeyboard.boundingRect.height) return;
				const state: GenerateState = {
					app,
					path: nroPath,
					titleId,
					name,
					author,
					version,
					profileSelector,
				};
				navigate('/generate', { state });
			},
			B() {
				if (navigator.virtualKeyboard.boundingRect.height) return;
				// Go back
				navigate(-1);
			},
			Up() {
				if (navigator.virtualKeyboard.boundingRect.height) return;
				setFocusedIndex((i) => Math.max(0, i - 1));
			},
			Down() {
				if (navigator.virtualKeyboard.boundingRect.height) return;
				setFocusedIndex((i) => Math.min(fieldsLength - 1, i + 1));
			},
		},
		[app, nroPath, titleId, name, author, version, fieldsLength, navigate],
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
						width={500}
						x={160}
						y={80 + i * 50}
						fontSize={24}
						fill='white'
						focused={focusedIndex === i}
						onTouchEnd={() => setFocusedIndex(i)}
					/>
				</>
			))}

			<AppIcon app={app} x={root.ctx.canvas.width - 320} y={64} />

			<Footer>
				<FooterItem button='B' x={root.ctx.canvas.width - 400}>
					Back
				</FooterItem>
				<FooterItem button='A' x={root.ctx.canvas.width - 266}>
					Edit
				</FooterItem>
				<FooterItem button='Plus' x={root.ctx.canvas.width - 160}>
					Generate
				</FooterItem>
			</Footer>
		</>
	);
}
