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
		})
});
