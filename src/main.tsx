import { PcvModuleId, openSession } from '@nx.js/clkrst';

const session = openSession(PcvModuleId.CpuBus);
const originalClockRate = session.getClockRate();
const { rates } = session.getPossibleClockRates();
session.setClockRate(rates[rates.length - 1]);
addEventListener('unload', () => {
	session.setClockRate(originalClockRate);
});

import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { render } from 'react-tela/render';
import { prodKeys } from './prod-keys';

import { Edit } from './routes/Edit';
import { RouteErrorBoundary } from './routes/Error';
// Routes
import { ErrorMissingProdKeys } from './routes/ErrorMissingProdKeys';
import { Generate } from './routes/Generate';
import { Select } from './routes/Select';
import { SelectForwarderType } from './routes/SelectForwarderType';
import { SelectRetroArch } from './routes/SelectRetroArch';
import { Success } from './routes/Success';

const routes = [
	{
		path: '/error-missing-prod-keys',
		element: <ErrorMissingProdKeys />,
		errorElement: <RouteErrorBoundary />,
	},
	{
		path: '/select',
		element: <Select />,
		errorElement: <RouteErrorBoundary />,
	},
	{
		path: '/select-forwarder-type',
		element: <SelectForwarderType />,
		errorElement: <RouteErrorBoundary />,
	},
	{
		path: '/select-retroarch',
		element: <SelectRetroArch />,
		errorElement: <RouteErrorBoundary />,
	},
	{
		path: '/edit',
		element: <Edit />,
		errorElement: <RouteErrorBoundary />,
	},
	{
		path: '/generate',
		element: <Generate />,
		errorElement: <RouteErrorBoundary />,
	},
	{
		path: '/success',
		element: <Success />,
		errorElement: <RouteErrorBoundary />,
	},
];

let initialRoute = '/select-forwarder-type';
if (!prodKeys) {
	// Ensure the `prod.keys` file exists
	initialRoute = '/error-missing-prod-keys';
}

const router = createMemoryRouter(routes, {
	initialEntries: [initialRoute],
	initialIndex: 0,
});

// Enable high-quality image smoothing for the canvas
const ctx = screen.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

render(<RouterProvider router={router} />, screen);
