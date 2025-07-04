export function generateRandomID() {
	let titleId = '01';
	for (let i = 0; i < 10; i++) {
		titleId += Math.floor(Math.random() * 16).toString(16);
	}
	titleId += '0000';
	return titleId;
}
