import { Jimp } from 'jimp';

export function isDirectory(mode: number) {
	return (mode & 16384) === 16384;
}

export function abToHex(arr: ArrayBuffer) {
	return Array.from(new Uint8Array(arr))
		.map((v) => v.toString(16).padStart(2, '0'))
		.join('');
}

export const MAX_IMAGE_BUFFER = 0x20000;

/**
 * Processes an icon buffer: resizes to 256x256, converts to JPEG, and ensures size < 0x20000 bytes by reducing quality if needed.
 * @param iconBuf ArrayBuffer of the image
 * @returns Promise<ArrayBuffer> processed icon buffer
 */
export async function processAppIcon(
	iconBuf: ArrayBuffer,
): Promise<ArrayBuffer> {
	const logo = await Jimp.fromBuffer(iconBuf);
	// Check if already processed
	if (
		iconBuf.byteLength < MAX_IMAGE_BUFFER &&
		logo.mime === 'image/jpeg' &&
		logo.bitmap.width === 256 &&
		logo.bitmap.height === 256
	) {
		return iconBuf;
	}
	logo.resize({ w: 256, h: 256 });
	let quality = 100;
	let jpegBuf: ArrayBuffer;
	while (true) {
		jpegBuf = await logo.getBuffer('image/jpeg', { quality });
		console.debug(
			`icon size: ${jpegBuf.byteLength} with JPEG quality ${quality}%`,
		);
		if (jpegBuf.byteLength < MAX_IMAGE_BUFFER) {
			break;
		}
		quality -= 2;
		if (quality <= 0) {
			console.debug('icon size is still too large - giving up...');
			break;
		}
		console.debug(
			`icon size is too large, reducing JPEG quality to ${quality}%`,
		);
	}
	return jpegBuf;
}

export async function AppIconFromImageUrl(url: URL): Promise<ArrayBuffer> {
	const ext = url.pathname.split('.').pop()?.toLowerCase();
	if (!ext || (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png')) {
		throw new Error('Only JPEG and PNG images are supported.');
	}
	const fileData = Switch.readFileSync(url); // Returns ArrayBuffer type
	if (!fileData) throw new Error('Failed to read file');
	try {
		const icon = await processAppIcon(fileData);
		if (icon.byteLength >= MAX_IMAGE_BUFFER)
			throw new Error(
				'Icon size was too large / uncompressable. Try a new file.',
			);
		return icon;
	} catch (err) {
		throw new Error(`Failed to process image.\nReason: ${err}`);
	}
}
