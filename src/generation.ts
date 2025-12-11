import { faker } from '@faker-js/faker'
import SuperJSON from 'superjson'
import { z } from 'zod'
export const SUPPORTED_TYPES = [
	'string',
	'number',
	'boolean',
	'date',
	'enum',
	'email',
	'phone',
	'uuid',
	'url',
	'image',
	'address',
	'city',
	'country',
	'zipcode',
	'firstname',
	'lastname',
	'fullname',
	'username',
	'password',
	'hexcolor',
	'credit_card',
	'company',
	'job_title',
	'ipv4',
	'ipv6',
	'latitude',
	'longitude',
	'sentence',
	'paragraph',
	'word',
] as const

export interface FieldDefinition {
	name: string
	type: (typeof SUPPORTED_TYPES)[number]
	related?: string
	values?: (string | number | boolean)[]
	min?: number
	max?: number
	length?: number
	format?: string
}

interface QueryParams {
	fields: FieldDefinition[]
	count?: number
	seed?: number
}

// Zod schemas for validation
export const fieldDefinitionSchema = z.object({
	name: z.string().min(1, 'Field name is required'),
	type: z.enum([
		'string',
		'number',
		'boolean',
		'date',
		'enum',
		'email',
		'phone',
		'uuid',
		'url',
		'image',
		'address',
		'city',
		'country',
		'zipcode',
		'firstname',
		'lastname',
		'fullname',
		'username',
		'password',
		'hexcolor',
		'credit_card',
		'company',
		'job_title',
		'ipv4',
		'ipv6',
		'latitude',
		'longitude',
		'sentence',
		'paragraph',
		'word',
	]),
	related: z.string().optional(),
	values: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	length: z.number().optional(),
	format: z.string().optional(),
})

export const queryParamsSchema = z.object({
	fields: z.array(fieldDefinitionSchema),
	count: z.number().min(1).max(10000).optional().default(10),
	seed: z.number().optional(),
})

// Data generation functions
function generateFieldValue(field: FieldDefinition): unknown {
	const { type, related, values, min, max, length } = field

	// Handle enum type
	if (type === 'enum' && values && values.length > 0) {
		return values[Math.floor(Math.random() * values.length)]
	}

	// Handle related (faker API path)
	if (related) {
		try {
			const keys = related.split('.')
			let value: unknown = faker
			for (const key of keys) {
				if (typeof value === 'object' && value !== null && key in value) {
					value = (value as Record<string, unknown>)[key]
				} else {
					break
				}
			}
			if (typeof value === 'function') {
				return value()
			}
			return value
		} catch (err) {
			console.error(`Error accessing faker.${related}:`, err)
		}
	}

	// Built-in type handlers
	switch (type) {
		case 'string':
			return faker.string.alphanumeric(length || 10)
		case 'number':
			return faker.number.int({
				min: min || 0,
				max: max || 1000,
			})
		case 'boolean':
			return faker.datatype.boolean()
		case 'date':
			return faker.date.recent().toISOString()
		case 'email':
			return faker.internet.email()
		case 'phone':
			return faker.phone.number()
		case 'uuid':
			return faker.string.uuid()
		case 'url':
			return faker.internet.url()
		case 'image':
			return faker.image.url()
		case 'address':
			return faker.location.streetAddress()
		case 'city':
			return faker.location.city()
		case 'country':
			return faker.location.country()
		case 'zipcode':
			return faker.location.zipCode()
		case 'firstname':
			return faker.person.firstName()
		case 'lastname':
			return faker.person.lastName()
		case 'fullname':
			return faker.person.fullName()
		case 'username':
			return faker.internet.username()
		case 'password':
			return faker.internet.password({ length: 12 })
		case 'hexcolor':
			return faker.color.rgb({ casing: 'upper', format: 'hex' })
		case 'credit_card':
			return faker.finance.creditCardNumber()
		case 'company':
			return faker.company.name()
		case 'job_title':
			return faker.person.jobTitle()
		case 'ipv4':
			return faker.internet.ipv4()
		case 'ipv6':
			return faker.internet.ipv6()
		case 'latitude':
			return faker.location.latitude()
		case 'longitude':
			return faker.location.longitude()
		case 'sentence':
			return faker.lorem.sentence()
		case 'paragraph':
			return faker.lorem.paragraph()
		case 'word':
			return faker.lorem.word()
		default:
			return faker.string.alphanumeric(10)
	}
}

export function generateMockData(
	params: QueryParams,
): Record<string, unknown>[] {
	const { fields, count = 10, seed } = params

	// Set seed if provided
	if (seed !== undefined) {
		faker.seed(seed)
	}

	const results: Record<string, unknown>[] = []

	for (let i = 0; i < count; i++) {
		const row: Record<string, unknown> = {}
		for (const field of fields) {
			row[field.name] = generateFieldValue(field)
		}
		results.push(row)
	}

	return results
}

// Helper function to convert numeric string values in field definitions
export function normalizeFields(fields: unknown[]): FieldDefinition[] {
	return fields.map((field: unknown) => {
		const f = field as Record<string, unknown>
		return {
			name: f.name as string,
			type: f.type as (typeof SUPPORTED_TYPES)[number],
			related: f.related ? String(f.related) : undefined,
			values: f.values
				? Array.isArray(f.values)
					? f.values
					: [f.values]
				: undefined,
			min: f.min ? Number(f.min) : undefined,
			max: f.max ? Number(f.max) : undefined,
			length: f.length ? Number(f.length) : undefined,
			format: f.format ? String(f.format) : undefined,
		}
	})
}

// Helper function to serialize response with SuperJSON
export function serializeResponse(data: unknown): Record<string, unknown> {
	return SuperJSON.parse(SuperJSON.stringify(data)) as Record<string, unknown>
}

// API Routes
