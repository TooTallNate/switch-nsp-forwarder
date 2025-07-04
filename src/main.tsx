import { openSession, PcvModuleId } from '@nx.js/clkrst';

const session = openSession(PcvModuleId.CpuBus);
const originalClockRate = session.getClockRate();
const { rates } = session.getPossibleClockRates();
session.setClockRate(rates[rates.length - 1]);
addEventListener('unload', () => {
	session.setClockRate(originalClockRate);
});

import { render } from 'react-tela/render';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppletType } from '@nx.js/constants';
import { prodKeys } from './utils/prod-keys';

// Routes
import { ErrorAppletMode } from './routes/ErrorAppletMode';
import { ErrorMissingProdKeys } from './routes/ErrorMissingProdKeys';
import { Generate } from './routes/Generate';
import { Select } from './routes/Select';
import { SelectForwarderType } from './routes/SelectForwarderType';
import { SelectRetroArch } from './routes/SelectRetroArch';
import { Success } from './routes/Success';
import { RouteErrorBoundary } from './routes/Error';
import { Edit } from './routes/Edit';

const routes = [
	{
		path: '/error-applet-mode',
		element: <ErrorAppletMode />,
		errorElement: <RouteErrorBoundary />,
	},
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
if (Switch.appletType() !== AppletType.Application) {
	// Ensure the app is running in full-memory mode
	initialRoute = '/error-applet-mode';
} else if (!prodKeys) {
	// Ensure the `prod.keys` file exists
	initialRoute = '/error-missing-prod-keys';
}

const router = createMemoryRouter(routes, {
	initialEntries: [initialRoute],
	initialIndex: 0,
});

render(<RouterProvider router={router} />, screen);
