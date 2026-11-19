import { z } from 'zod';

export const DeploymentConfigSchema = z.object({
	basePath: z
		.string()
		.optional()
		.default('')
		.refine((value) => !value || value.startsWith('/'), { message: 'basePath must start with /' }),
	// A route parameter, e.g. orgslug: pages that have it load data/ and api/ from
	// <basePath>/<value>/ and prerender their query results there, so each value's
	// data can be served from its own prefix
	dataScope: z
		.string()
		.optional()
		.refine((value) => !value || /^[A-Za-z_][A-Za-z0-9_]*$/.test(value), {
			message: 'dataScope must be a route parameter name'
		}),
	// The IANA time zone page queries run in: current_date, timestamptz values and the strings
	// compared to them; UTC if not set
	timeZone: z.string().optional(),
	// SQL giving a data scope's time zone in its first column, ${scope} being the scope as a
	// string literal; pages whose scope it gives no zone for use timeZone
	timeZoneQuery: z.string().optional()
});
