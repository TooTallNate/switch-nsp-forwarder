import { installNsp } from '@nx.js/install-title';
import { NcmStorageId } from '@nx.js/ncm';
import { buildNsp } from '@tootallnate/hacbrewpack';
import { NACP } from '@tootallnate/nacp';
import { Jimp } from 'jimp';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Text } from 'react-tela';
import type { AppInfo } from '../apps';
import { prodKeys } from '../prod-keys';

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
			const mainData = Switch.readFileSync('romfs:/template/exefs/main');
			const mainNpdmData = Switch.readFileSync(
				'romfs:/template/exefs/main.npdm',
			);
			if (!name) {
				setStatus('error');
				setError('missing `name` field');
				return;
			}
			if (!author) {
				setStatus('error');
				setError('missing `author` field');
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

			// Run the icon through Jimp to resize it and/or remove EXIF metadata
			let iconBuf = icon;
			if (iconBuf) {
				const logo = await Jimp.fromBuffer(iconBuf);
				logo.resize({ w: 256, h: 256 });

				// The icon size must be less than 0x20000 bytes otherwise
				// Atmosphère shows a "?" icon on the home screen, so we
				// generate the JPEG in a loop until we get a smaller icon.
				let quality = 100;
				while (true) {
					iconBuf = await logo.getBuffer('image/jpeg', { quality });
					console.debug(
						`icon size: ${iconBuf.byteLength} with JPEG quality ${quality}%`,
					);

					if (iconBuf.byteLength < 0x20000) {
						// The generated icon is within the allowed size, so we're done.
						break;
					}

					// Icon is too large, so reduce the JPEG quality and try again.
					quality -= 2;
					if (quality <= 0) {
						console.debug('icon size is still too large - giving up...');
						break;
					}
					console.debug(
						`icon size is too large, reducing JPEG quality to ${quality}%`,
					);
				}
			}

			const log = (text: string) => {
				console.debug(text);
				setLogs((logs) => `${logs + text}\n`);
			};

			try {
				log('Building NSP...');

				// Build NACP
				const nacp = new NACP();
				nacp.id = id;
				nacp.title = name;
				nacp.author = author;
				nacp.version = version;
				nacp.startupUserAccount = profileSelector ? 1 : 0;

				// Prepare control files
				const control = new Map<string, Uint8Array>();
				control.set('control.nacp', new Uint8Array(nacp.buffer));
				if (iconBuf) {
					control.set('icon_AmericanEnglish.dat', new Uint8Array(iconBuf));
				}

				// Prepare romfs
				const encoder = new TextEncoder();
				let argv = path;
				if (romPath) {
					argv += ` "${romPath}"`;
				}
				const romfs = {
					nextArgv: new Blob([encoder.encode(argv)]),
					nextNroPath: new Blob([encoder.encode(path)]),
				};

				const result = await buildNsp({
					keys: prodKeys,
					titleId: id,
					plaintext: true,
					noPatchNacpLogo: true,
					noLogo: true,
					noSignNcaSig2: true,
					exefs: new Map([
						['main', new Uint8Array(mainData)],
						['main.npdm', new Uint8Array(mainNpdmData)],
					]),
					control,
					romfs,
				});

				const duration = Date.now() - start;
				log(`NSP built in ${duration}ms`);

				if (install) {
					// Install the generated NSP forwarder
					setStatus('installing');
					for await (const event of installNsp(
						result.nsp,
						NcmStorageId.SdCard,
					)) {
						console.debug(event);
					}
					const query = new URLSearchParams({
						installed: '1',
						name,
						duration: String(duration),
					});
					navigate(`/success?${query}`);
				} else {
					// Save the generated NSP forwarder to the SD card
					const fileName = `${name.replace(/[:/\\]/g, '-')} [${id}].nsp`;
					const outUrl = new URL(fileName, 'sdmc:/');
					const nspData = new Uint8Array(await result.nsp.arrayBuffer());
					Switch.writeFileSync(outUrl, nspData);

					const query = new URLSearchParams({
						name: fileName,
						duration: String(duration),
					});
					navigate(`/success?${query}`);
				}
			} catch (err) {
				setStatus('error');
				setError(`${err}`);
				console.debug(err);
			}
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
