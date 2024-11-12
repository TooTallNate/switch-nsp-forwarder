import { NACP } from '@tootallnate/nacp';
import { Text } from 'react-tela';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { prodKeys } from '../prod-keys';
import type { Module } from '../hacbrewpack';

export function Generate() {
	const { state } = useLocation();
	const [status, setStatus] = useState('generating');
	const [logs, setLogs] = useState('');

	useEffect(() => {
		async function g() {
			const ModuleFactory = await import('../hacbrewpack.js');
			const titleId = state.titleId;
			const helloWasm = Switch.readFileSync('romfs:/hacbrewpack.wasm');
			const mainData = Switch.readFileSync('romfs:/template/exefs/main');
			const mainNpdmData = Switch.readFileSync(
				'romfs:/template/exefs/main.npdm',
			);
			if (!helloWasm) {
				setStatus('error: missing `hacbrewpack.wasm` file');
				return;
			}
			if (!prodKeys) {
				setStatus('error: missing `prod.keys` file');
				return;
			}
			if (!mainData) {
				setStatus('error: missing `main` file');
				return;
			}
			if (!mainNpdmData) {
				setStatus('error: missing `main.npdm` file');
				return;
			}

			const main = new Uint8Array(mainData);
			const mainNpdm = new Uint8Array(mainNpdmData);
			const keys = new Uint8Array(prodKeys);

			let Module: Module;
			await ModuleFactory.default({
				noInitialRun: true,
				wasmBinary: helloWasm,
				print(text) {
					console.debug(text);
					setLogs((logs) => `${logs + text}\n`);
				},
				printErr(text) {
					console.debug(text);
					setLogs((logs) => `${logs + text}\n`);
				},
				preRun(_Module) {
					Module = _Module;
					setStatus('preRun');
					const { FS } = Module;

					FS.writeFile('/keys.dat', keys);

					FS.mkdir('/exefs');
					FS.writeFile('/exefs/main', main);
					FS.writeFile('/exefs/main.npdm', mainNpdm);

					const nacp = new NACP();
					nacp.id = titleId;
					nacp.title = state.name;
					nacp.author = state.author;
					nacp.version = state.version;

					nacp.startupUserAccount = 0;

					FS.mkdir('/control');
					FS.writeFile('/control/control.nacp', new Uint8Array(nacp.buffer));

					const image = new Uint8Array(state.app.icon);
					FS.writeFile('/control/icon_AmericanEnglish.dat', image);

					//FS.mkdir('/logo');
					//FS.writeFile('/logo/NintendoLogo.png', logo);
					//FS.writeFile('/logo/StartupMovie.gif', startupMovie);

					FS.mkdir('/romfs');
					FS.writeFile('/romfs/nextArgv', state.path);
					FS.writeFile('/romfs/nextNroPath', state.path);
				},
				onRuntimeInitialized: () => {
					setStatus('onRuntimeInitialized');
					try {
						const exitCode = Module.callMain([
							'--nopatchnacplogo',
							'--titleid',
							titleId,
							'--nologo',
						]);
						//const exitCode = 1;
						setStatus(`exit code: ${exitCode}`);

						if (exitCode === 0) {
							try {
								const nspName = Module.FS.readdir('/hacbrewpack_nsp').filter(
									(n) => n.endsWith('.nsp'),
								)[0];

								const data = Module.FS.readFile(`/hacbrewpack_nsp/${nspName}`);

								// TODO: Sanitize characters that are not allowed in filenames
								const outUrl = new URL(
									`${state.name} [${titleId}].nsp`,
									'sdmc:/',
								);

								Switch.writeFileSync(outUrl, data);
								setStatus(`Saved NSP to ${outUrl}`);
							} catch (err: any) {
								setStatus(`Failed to locate NSP file: ${err.message}`);
							}
						}
					} catch (err) {
						setStatus(`error: ${err}`);
					}
				},
			});
		}
		setTimeout(g, 250);
	}, []);

	return (
		<>
			<Text fill='white' fontSize={24}>
				{status}
			</Text>
			<Text fill='white' fontSize={24} y={32}>
				{state.name}
			</Text>
			{logs.split('\n').map((line, i) => (
				<Text key={i} fill='white' fontSize={24} y={64 + i * 30}>
					{line}
				</Text>
			))}
		</>
	);
}
