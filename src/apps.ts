import { isDirectory } from './utils/util';

export interface AppInfo {
	path: string;
	id: string;
	name: string;
	author: string;
	version: string;
	icon: ArrayBuffer | undefined;
}

export function* nroIterator(
	dir: string | URL,
	recursive = true,
): IteratorObject<URL, void> {
	const entries = Switch.readDirSync(dir) ?? [];
	for (const entry of entries) {
		// Skip hidden files
		if (entry.startsWith('.')) continue;

		const path = new URL(entry, dir);

		let stat = null;
		try {
			stat = Switch.statSync(path);
		} catch (err) {
			// I/O error may be thrown for files that are currently
			// open, which happens for the `nxjs-debug.log` file
			console.debug(`Failed to stat ${path}: ${err}`);
		}

		if (!stat) continue;

		if (isDirectory(stat.mode)) {
			if (recursive) {
				// Only traverse one level deep into the "switch" directory
				yield* nroIterator(new URL(`${path}/`), false);
			}
		} else if (entry.endsWith('.nro')) {
			yield path;
		}
	}
}

export function pathToAppInfo(path: URL): AppInfo | undefined {
	try {
		const app = new Switch.Application(path);
		return {
			path: path.href,
			id: app.id.toString(16).padStart(16, '0'),
			name: app.name,
			author: app.author,
			version: app.version,
			icon: app.icon,
		};
	} catch (err) {
		console.debug(`Failed to parse "${path}": ${err}`);
	}
}

export const apps: AppInfo[] = [
	new URL('sdmc:/hbmenu.nro'),
	...nroIterator('sdmc:/switch/'),
]
	.map(pathToAppInfo)
	.filter((v) => typeof v !== 'undefined');
