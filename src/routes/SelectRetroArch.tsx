import { useNavigate } from 'react-router-dom';
import { FilePicker } from '../components/FilePicker';
import type { EditState } from './Edit';
import { pathToAppInfo } from '../apps';
import { useCallback } from 'react';

export function SelectRetroArch() {
	const navigate = useNavigate();

	const handleSelect = useCallback(
		async (value: URL) => {
			// TODO: Fetch the guessed values from the `rom-id` API service

			const path = new URL('sdmc:/switch/retroarch_switch.nro');
			const app = pathToAppInfo(path);
			if (!app) return;

			const state: EditState = {
				id: '0',
				path: app.path,
				romPath: value.href,
				name: '',
				author: '',
				version: '',
				icon: app.icon,
			};

			navigate('/edit', { state });
		},
		[navigate],
	);

	return <FilePicker onSelect={handleSelect} onClose={() => navigate(-1)} />;
}
