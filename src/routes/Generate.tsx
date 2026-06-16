import { installNsp } from '@nx.js/install-title';
import { NcmStorageId } from '@nx.js/ncm';
import { buildNsp } from '@tootallnate/hacbrewpack';
import { NACP } from '@tootallnate/nacp';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Text } from 'react-tela';
import type { AppInfo } from '../apps';
import { prodKeys } from '../prod-keys';

const MAX_ICON_SIZE = 0x20000;

async function processIcon(icon: Uint8Array): Promise<Uint8Array> {
	if (icon.byteLength < MAX_ICON_SIZE) {
		return icon;
	}

	const bitmap = await createImageBitmap(new Blob([icon]));
	const canvas = new OffscreenCanvas(256, 256);
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, 256, 256);
	ctx.drawImage(bitmap, 0, 0, 256, 256);
	bitmap.close();

	let quality = 1;
	while (true) {
		const blob = await canvas.convertToBlob({
			type: 'image/jpeg',
			quality,
		});
		const buf = new Uint8Array(await blob.arrayBuffer());
		if (buf.byteLength < MAX_ICON_SIZE || quality <= 0.02) return buf;
		quality -= 0.02;
	}
}

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

			// Use the icon as-is when it already fits. Oversized icons are resized and
			// re-encoded via native canvas instead of running a JS JPEG encoder on the
			// Switch CPU, which is too slow in applet mode.
			let iconBuf = icon ? new Uint8Array(icon) : undefined;
			if (iconBuf) {
				iconBuf = await processIcon(iconBuf);
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
