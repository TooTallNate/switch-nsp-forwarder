import { splCryptoGenerateAesKek, splCryptoGenerateAesKey } from '../ipc/spl';
import { abToHex } from './util';

export let prodKeys = Switch.readFileSync('sdmc:/switch/prod.keys');

if (prodKeys) {
	console.debug('Found `prod.keys` file');
} else {
	// If there is no `prod.keys` file, then generate the header key from the "spl" service.

	// These source values are seen in other open source repos:
	//   - https://github.com/blawar/tinleaf/blob/3363538600e47e1862d64d265dab1a031b32d037/include/util/crypto.hpp#L41-L42
	//   - https://github.com/ITotalJustice/sphaira/blob/0370e47f7fac0e426675624f363fe50f3b442048/sphaira/source/owo.cpp#L339-L346
	const headerKekSource = new Uint8Array([
		0x1f, 0x12, 0x91, 0x3a, 0x4a, 0xcb, 0xf0, 0x0d, 0x4c, 0xde, 0x3a, 0xf6,
		0xd5, 0x23, 0x88, 0x2a,
	]);
	const headerKeySource = new Uint8Array([
		0x5a, 0x3e, 0xd8, 0x4f, 0xde, 0xc0, 0xd8, 0x26, 0x31, 0xf7, 0xe2, 0x5d,
		0x19, 0x7b, 0xf5, 0xd0, 0x1c, 0x9b, 0x7b, 0xfa, 0xf6, 0x28, 0x18, 0x3d,
		0x71, 0xf6, 0x4d, 0x73, 0xf1, 0x50, 0xb9, 0xd2,
	]);

	const kek = splCryptoGenerateAesKek(headerKekSource.buffer, 0, 0);
	const key0 = splCryptoGenerateAesKey(
		kek,
		headerKeySource.buffer.slice(0, 0x10),
	);
	const key1 = splCryptoGenerateAesKey(kek, headerKeySource.buffer.slice(0x10));
	const key = new Uint8Array([
		...new Uint8Array(key0),
		...new Uint8Array(key1),
	]);
	const keyHex = abToHex(key);
	console.debug(
		`Generated header key from "spl" service: ${keyHex.slice(0, 8)}...${keyHex.slice(-8)}`,
	);

	const prodKeysText = `header_key = ${keyHex}
key_area_key_application_00 = 00000000000000000000000000000001
`;
	prodKeys = new TextEncoder().encode(prodKeysText);
}
