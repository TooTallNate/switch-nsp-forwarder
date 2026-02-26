/**
 * Generates a deterministic title ID from the NRO path and arguments,
 * matching sphaira's logic:
 *   SHA-256(nro_path + args)
 *   tid = 0x0100000000000000 | (first_8_bytes_as_u64 & 0x00FFFFFFFFFFF000)
 *
 * @see https://github.com/ITotalJustice/sphaira/blob/c8ae2a787225b0eefb6ca98a9c77503393c2beac/sphaira/source/owo.cpp#L1018-L1022
 */
export async function generateDeterministicID(
	nroPath: string,
	args: string,
): Promise<string> {
	const hashInput = nroPath + args;
	const data = new TextEncoder().encode(hashInput);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);

	// Read the first 8 bytes as a big-endian u64 (BigInt)
	const view = new DataView(hashBuffer);
	const hash64 = view.getBigUint64(0, /* littleEndian */ true);

	// Apply the same mask as sphaira:
	const tid = 0x0100000000000000n | (hash64 & 0x00fffffffffff000n);

	return tid.toString(16).padStart(16, '0');
}
