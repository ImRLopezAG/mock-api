import { logger } from '@chneau/elysia-logger'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import qs from 'qs'
import { z } from 'zod'
import {
	type FieldDefinition,
	generateMockData,
	normalizeFields,
	queryParamsSchema,
	SUPPORTED_TYPES,
	serializeResponse,
} from './generation'
import { corsMiddleware } from './middleware/cors'

const api = new Elysia({ prefix: '/api' })
	.get(
		'/generate',
		({ query }) => {
			try {
				let fields: FieldDefinition[]

				// First, parse the raw query string with qs to handle qs array notation
				const rawQueryString = Object.entries(query)
					.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
					.join('&')

				const parsedWithQS = qs.parse(rawQueryString)

				// Check if fields came from qs parsing (array-like structure)
				if (parsedWithQS.fields && Array.isArray(parsedWithQS.fields)) {
					// Normalize numeric fields that came from qs parsing (they're strings)
					fields = normalizeFields(parsedWithQS.fields as unknown[])
				} else {
					// Otherwise, try parsing fields as JSON string
					const fieldsQuery = query.fields as string | unknown

					if (typeof fieldsQuery === 'string') {
						try {
							fields = JSON.parse(fieldsQuery)
						} catch {
							throw new Error('Invalid fields format. Must be a JSON array.')
						}
					} else {
						fields = fieldsQuery as FieldDefinition[]
					}
				}

				// Ensure fields are normalized (convert numeric strings and set defaults)
				fields = normalizeFields(fields as unknown[])

				if (!Array.isArray(fields)) {
					throw new Error('Invalid fields format. Must be a JSON array.')
				}

				// Validate query params
				const validatedParams = queryParamsSchema.parse({
					fields,
					count: parsedWithQS.count
						? parseInt(String(parsedWithQS.count), 10)
						: query.count
							? Number.parseInt(query.count, 10)
							: 10,
					seed: parsedWithQS.seed
						? parseInt(String(parsedWithQS.seed), 10)
						: query.seed
							? Number.parseInt(query.seed, 10)
							: undefined,
				})

				// Generate mock data
				const data = generateMockData(validatedParams)

				return serializeResponse({
					success: true,
					count: data.length,
					data,
				})
			} catch (error) {
				const errorMessage =
					error instanceof z.ZodError ? z.treeifyError(error) : String(error)
				return serializeResponse({
					success: false,
					error: 'Failed to generate mock data',
					details: errorMessage,
				})
			}
		},
		{
			detail: {
				summary: 'Generate Mock Data',
				description:
					'Generate mock data based on field definitions. Supports both JSON and QS array notation for fields parameter. Use /types to see all supported field types.',
				tags: ['Data Generation'],
				parameters: [
					{
						name: 'fields',
						in: 'query',
						required: true,
						schema: { type: 'string' },
						description:
							'JSON array of field definitions or QS array notation. Example: [{"name":"id","type":"uuid"},{"name":"email","type":"email"}]',
					},
					{
						name: 'count',
						in: 'query',
						required: false,
						schema: {
							type: 'integer',
							default: 10,
							minimum: 1,
							maximum: 10000,
						},
						description:
							'Number of mock records to generate (default: 10, max: 10000)',
					},
					{
						name: 'seed',
						in: 'query',
						required: false,
						schema: { type: 'integer' },
						description: 'Optional seed for reproducible results',
					},
				],
			},
		},
	)
	.post(
		'/generate',
		async ({ query, body }) => {
			try {
				let fields: FieldDefinition[]

				if (body?.fields && Array.isArray(body.fields)) {
					fields = normalizeFields(body.fields)
				} else if (body && typeof body.fields === 'string') {
					try {
						fields = JSON.parse(body.fields)
					} catch {
						throw new Error('Invalid fields format. Must be a JSON array.')
					}
				} else {
					// No or invalid body, fall back to normal query parsing
					const rawQueryString = Object.entries(query)
						.map(
							([key, value]) => `${key}=${encodeURIComponent(String(value))}`,
						)
						.join('&')

					const parsedWithQS = qs.parse(rawQueryString)

					if (parsedWithQS.fields && Array.isArray(parsedWithQS.fields)) {
						fields = normalizeFields(parsedWithQS.fields as unknown[])
					} else {
						const fieldsQuery = query.fields as string | unknown

						if (typeof fieldsQuery === 'string') {
							try {
								fields = JSON.parse(fieldsQuery)
							} catch {
								throw new Error('Invalid fields format. Must be a JSON array.')
							}
						} else {
							fields = fieldsQuery as FieldDefinition[]
						}
					}

					// Ensure fields are normalized (convert numeric strings and set defaults)
					fields = normalizeFields(fields as unknown[])
				}

				if (!Array.isArray(fields)) {
					throw new Error('Invalid fields format. Must be a JSON array.')
				}

				// Determine count and seed from body (preferred) or query
				const countValue =
					body && body.count !== undefined
						? Number(body.count)
						: query.count
							? parseInt(query.count as string, 10)
							: 10
				const seedValue =
					body && body.seed !== undefined
						? Number(body.seed)
						: query.seed
							? parseInt(query.seed as string, 10)
							: undefined

				// Validate query params
				const validatedParams = queryParamsSchema.parse({
					fields,
					count: countValue,
					seed: seedValue,
				})

				// Generate mock data
				const data = generateMockData(validatedParams)

				return serializeResponse({
					success: true,
					count: data.length,
					data,
				})
			} catch (error) {
				const errorMessage =
					error instanceof z.ZodError ? z.treeifyError(error) : String(error)
				return serializeResponse({
					success: false,
					error: 'Failed to generate mock data',
					details: errorMessage,
				})
			}
		},
		{
			detail: {
				summary: 'Generate Mock Data (POST)',
				description:
					'Generate mock data based on field definitions passed in the request body as JSON. Request body follows the same schema as the query params.',
				tags: ['Data Generation'],
			},
			body: queryParamsSchema,
		},
	)
	.get(
		'/types',
		() => {
			const response = {
				supportedTypes: SUPPORTED_TYPES,
				description: 'All supported field types for mock data generation',
			}
			return serializeResponse(response)
		},
		{
			detail: {
				summary: 'List Supported Types',
				description:
					'Get a list of all supported field types for mock data generation. Use these types in the "type" property of field definitions.',
				tags: ['Data Generation'],
			},
		},
	)

const app = new Elysia()
	.use(corsMiddleware)
	.use(
		openapi({
			path: '/spec',
			mapJsonSchema: {
				zod: z.toJSONSchema,
			},
			documentation: {
				info: {
					title: 'Mock Data Generator API',
					version: '1.0.0',
					description:
						'Generate realistic mock data with customizable field types using Faker.js. Similar to mockaroo.com but as an API.',
					contact: {
						name: 'API Support',
					},
				},
				tags: [
					{
						name: 'Info',
						description: 'API information endpoints',
					},
					{
						name: 'Data Generation',
						description: 'Mock data generation endpoints',
					},
				],
			},
		}),
	)
	.use(logger() as Elysia)
	.get('/', (c) => c.redirect('/spec'), {
		detail: {
			hide: true,
		},
	})
	.use(api)
	.listen(3001)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)

export default app
