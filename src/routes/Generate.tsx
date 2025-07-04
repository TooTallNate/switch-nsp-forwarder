import { Text } from 'react-tela';
import { NACP } from '@tootallnate/nacp';
import { NcmStorageId } from '@nx.js/ncm';
import { installNsp } from '@nx.js/install-title';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { prodKeys } from '../utils/prod-keys';
import type { Module } from '../hacbrewpack';
import type { AppInfo } from '../apps';
import { processAppIcon } from '../utils/util';

type Status = 'generating' | 'installing' | 'error' | 'success';

export interface GenerateState extends AppInfo {
	romPath: string;
	profileSelector: boolean;
	install: boolean;
}

export function Generate() {
	const navigate = useNavigate();
	const {
		id,
		icon,
		path,
		romPath,
		name,
		author,
		version,
		profileSelector,
		install,
	}: GenerateState = useLocation().state;
	const [status, setStatus] = useState<Status>('generating');
	const [error, setError] = useState<string | null>(null);
	const [logs, setLogs] = useState('');

	useEffect(() => {
		async function g() {
			const start = Date.now();
			const ModuleFactory = await import('../hacbrewpack.js');
			const helloWasm = Switch.readFileSync('romfs:/hacbrewpack.wasm');
			const mainData = Switch.readFileSync('romfs:/template/exefs/main');
			const mainNpdmData = Switch.readFileSync(
				'romfs:/template/exefs/main.npdm',
			);
			if (!helloWasm) {
				setStatus('error');
				setError('missing `hacbrewpack.wasm` file');
				return;
			}
			if (!prodKeys) {
				setStatus('error');
				setError('missing `prod.keys` file');
				return;
			}
			if (!mainData) {
				setStatus('error');
				setError('missing `main` file');
				return;
			}
			if (!mainNpdmData) {
				setStatus('error');
				setError('missing `main.npdm` file');
				return;
			}

			const main = new Uint8Array(mainData);
			const mainNpdm = new Uint8Array(mainNpdmData);
			const keys = new Uint8Array(prodKeys);

			// Run the icon through Jimp to resize it and/or remove EXIF metadata
			let iconBuf = icon;
			if (iconBuf) {
				iconBuf = await processAppIcon(iconBuf);
			}

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
					const { FS } = Module;

					FS.writeFile('/keys.dat', keys);

					FS.mkdir('/exefs');
					FS.writeFile('/exefs/main', main);
					FS.writeFile('/exefs/main.npdm', mainNpdm);

					const nacp = new NACP();
					nacp.id = id;
					nacp.title = name;
					nacp.author = author;
					nacp.version = version;

					nacp.startupUserAccount = profileSelector ? 1 : 0;

					FS.mkdir('/control');
					FS.writeFile('/control/control.nacp', new Uint8Array(nacp.buffer));

					if (iconBuf) {
						const image = new Uint8Array(iconBuf);
						FS.writeFile('/control/icon_AmericanEnglish.dat', image);
					}

					//FS.mkdir('/logo');
					//FS.writeFile('/logo/NintendoLogo.png', logo);
					//FS.writeFile('/logo/StartupMovie.gif', startupMovie);

					FS.mkdir('/romfs');
					let argv = path;
					if (romPath) {
						argv += ` ${romPath}`;
					}
					FS.writeFile('/romfs/nextArgv', argv);
					FS.writeFile('/romfs/nextNroPath', path);
				},
				onRuntimeInitialized: () => {
					try {
						const exitCode = Module.callMain([
							'--nopatchnacplogo',
							'--titleid',
							id,
							'--nologo',
							'--plaintext',
						]);
						console.debug(`exit code: ${exitCode}`);

						if (exitCode === 0) {
							try {
								const nspName = Module.FS.readdir('/hacbrewpack_nsp').filter(
									(n) => n.endsWith('.nsp'),
								)[0];

								const data = Module.FS.readFile(`/hacbrewpack_nsp/${nspName}`);
								const duration = Date.now() - start;

								if (install) {
									// Install the generated NSP forwarder
									setStatus('installing');
									(async () => {
										for await (const event of installNsp(
											new Blob([data]),
											NcmStorageId.SdCard,
										)) {
											console.debug(event);
										}
									})().then(() => {
										const query = new URLSearchParams({
											installed: '1',
											name,
											duration: String(duration),
										});
										navigate(`/success?${query}`);
									});
								} else {
									// Save the generated NSP forwarder to the SD card
									const fileName = `${name.replace(/[:/\\]/g, '-')} [${id}].nsp`;
									const outUrl = new URL(fileName, 'sdmc:/');
									Switch.writeFileSync(outUrl, data);

									const query = new URLSearchParams({
										name: fileName,
										duration: String(duration),
									});
									navigate(`/success?${query}`);
								}
							} catch (err) {
								setStatus('error');
								setError(`Failed to locate NSP file: ${err}`);
								console.debug(`Failed to locate NSP file: ${err}`);
							}
						} else {
							setStatus('error');
							setError(`exit code: ${exitCode}`);
						}
					} catch (err) {
						setStatus('error');
						setError(`error: ${err}`);
						console.debug(err);
					}
				},
			});
		}
		setTimeout(g, 50);
	}, [
		navigate,
		icon,
		path,
		romPath,
		id,
		name,
		author,
		version,
		profileSelector,
		install,
	]);

	return (
		<>
			<Text fill='white' fontSize={24}>
				{error || status}
			</Text>
			<Text fill='white' fontSize={24} y={32}>
				{name}
			</Text>
			{logs.split('\n').map((line, i) => (
				<Text key={line} fill='white' fontSize={24} y={64 + i * 30}>
					{line}
				</Text>
			))}
		</>
	);
}
