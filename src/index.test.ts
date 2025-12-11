import { describe, expect, it } from 'bun:test'
import qs from 'qs'
import { app } from './index'

describe('Mock API Generator', () => {
	const HOST = 'http://localhost:3000'
	const HOST_API = `${HOST}/api`
	describe('GET /', () => {
		it('should return API documentation', async () => {
			const response = await app.handle(new Request(`${HOST}/`))

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json).toHaveProperty('message')
			expect(json.message).toBe('Mock Data Generator API')
			expect(json).toHaveProperty('documentation')
			expect(json.documentation).toContain('/swagger')
		})
	})

	describe('GET /types', () => {
		it('should return all supported types', async () => {
			const response = await app.handle(new Request(`${HOST_API}/types`))

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json).toHaveProperty('supportedTypes')
			expect(Array.isArray(json.supportedTypes)).toBe(true)
			expect(json.supportedTypes.length).toBeGreaterThan(20)
			expect(json.supportedTypes).toContain('uuid')
			expect(json.supportedTypes).toContain('email')
			expect(json.supportedTypes).toContain('enum')
		})

		it('should include all expected field types', async () => {
			const response = await app.handle(new Request(`${HOST_API}/types`))
			const json = await response.json()
			const types = json.supportedTypes

			const expectedTypes = [
				'string',
				'number',
				'boolean',
				'date',
				'email',
				'phone',
				'uuid',
				'url',
				'firstname',
				'lastname',
				'fullname',
				'address',
				'city',
				'country',
			]

			for (const type of expectedTypes) {
				expect(types).toContain(type)
			}
		})
	})

	describe('GET /generate', () => {
		it('should generate data with uuid field', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([{ name: 'id', type: 'uuid' }]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			expect(json.count).toBe(10) // default count
			expect(Array.isArray(json.data)).toBe(true)
			expect(json.data.length).toBe(10)
			expect(json.data[0]).toHaveProperty('id')
			expect(typeof json.data[0].id).toBe('string')
		})

		it('should generate data with email field', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([{ name: 'email', type: 'email' }]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			expect(json.data[0]).toHaveProperty('email')
			expect(json.data[0].email).toMatch(/@/)
		})

		it('should generate enum values from values array', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{
						name: 'role',
						type: 'enum',
						values: ['admin', 'user', 'guest'],
					},
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			const validRoles = ['admin', 'user', 'guest']

			for (const row of json.data) {
				expect(validRoles).toContain(row.role)
			}
		})

		it('should respect custom count parameter', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([{ name: 'id', type: 'uuid' }]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=5`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.count).toBe(5)
			expect(json.data.length).toBe(5)
		})

		it('should generate multiple fields', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{ name: 'id', type: 'uuid' },
					{ name: 'email', type: 'email' },
					{ name: 'name', type: 'fullname' },
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			expect(json.count).toBe(2)
			expect(json.data[0]).toHaveProperty('id')
			expect(json.data[0]).toHaveProperty('email')
			expect(json.data[0]).toHaveProperty('name')
		})

		it('should handle number type with min/max constraints', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{
						name: 'age',
						type: 'number',
						min: 18,
						max: 65,
					},
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=5`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(row.age).toBeGreaterThanOrEqual(18)
				expect(row.age).toBeLessThanOrEqual(65)
			}
		})

		it('should generate boolean values', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([{ name: 'active', type: 'boolean' }]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=5`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			for (const row of json.data) {
				expect(typeof row.active).toBe('boolean')
			}
		})

		it('should generate date fields in ISO format', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([{ name: 'createdAt', type: 'date' }]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			for (const row of json.data) {
				expect(typeof row.createdAt).toBe('string')
				expect(row.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
			}
		})

		it('should handle related faker properties', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{
						name: 'vehicle',
						type: 'string',
						related: 'vehicle.bicycle',
					},
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=3`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.vehicle).toBe('string')
				expect(row.vehicle.length).toBeGreaterThan(0)
			}
		})

		it('should handle related animal faker property', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{
						name: 'animal',
						type: 'string',
						related: 'animal.dog',
					},
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.animal).toBe('string')
			}
		})

		it('should generate person fields', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{ name: 'firstName', type: 'firstname' },
					{ name: 'lastName', type: 'lastname' },
					{ name: 'fullName', type: 'fullname' },
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.firstName).toBe('string')
				expect(typeof row.lastName).toBe('string')
				expect(typeof row.fullName).toBe('string')
			}
		})

		it('should generate location fields', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{ name: 'city', type: 'city' },
					{ name: 'country', type: 'country' },
					{ name: 'zipcode', type: 'zipcode' },
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.city).toBe('string')
				expect(typeof row.country).toBe('string')
				expect(typeof row.zipcode).toBe('string')
			}
		})

		it('should generate web-related fields', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{ name: 'url', type: 'url' },
					{ name: 'ipv4', type: 'ipv4' },
					{ name: 'username', type: 'username' },
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.url).toBe('string')
				expect(row.url).toMatch(/^https?:\/\//)
				expect(typeof row.ipv4).toBe('string')
				expect(typeof row.username).toBe('string')
			}
		})

		it('should generate hex color values', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([{ name: 'color', type: 'hexcolor' }]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=3`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			for (const row of json.data) {
				expect(typeof row.color).toBe('string')
				expect(row.color).toMatch(/^#[0-9A-F]{6}$/)
			}
		})

		it('should fail with invalid fields format', async () => {
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=invalid&count=5`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(false)
			expect(json.error).toBeDefined()
		})

		it('should fail with missing required field properties', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{
						type: 'uuid',
						// missing 'name' property
					},
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(false)
		})

		it('should reject count exceeding maximum', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([{ name: 'id', type: 'uuid' }]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=50000`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(false)
		})

		it('should generate different data with different seeds', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([{ name: 'id', type: 'uuid' }]),
			)

			const response1 = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&seed=123`),
			)
			const json1 = await response1.json()

			const response2 = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&seed=123`),
			)
			const json2 = await response2.json()

			// Same seed should produce same data
			expect(json1.data[0].id).toBe(json2.data[0].id)
		})

		it('should generate composite fields with all types', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{ name: 'id', type: 'uuid' },
					{ name: 'email', type: 'email' },
					{ name: 'role', type: 'enum', values: ['admin', 'user'] },
					{ name: 'age', type: 'number', min: 18, max: 65 },
					{ name: 'active', type: 'boolean' },
					{ name: 'createdAt', type: 'date' },
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=1`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			const data = json.data[0]

			expect(data.id).toBeDefined()
			expect(data.email).toBeDefined()
			expect(['admin', 'user']).toContain(data.role)
			expect(data.age).toBeGreaterThanOrEqual(18)
			expect(data.age).toBeLessThanOrEqual(65)
			expect(typeof data.active).toBe('boolean')
			expect(typeof data.createdAt).toBe('string')
		})

		it('should generate content fields', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{ name: 'sentence', type: 'sentence' },
					{ name: 'word', type: 'word' },
					{ name: 'paragraph', type: 'paragraph' },
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.sentence).toBe('string')
				expect(row.sentence.length).toBeGreaterThan(0)
				expect(typeof row.word).toBe('string')
				expect(row.word.length).toBeGreaterThan(0)
				expect(typeof row.paragraph).toBe('string')
				expect(row.paragraph.length).toBeGreaterThan(10)
			}
		})

		it('should generate business fields', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{ name: 'company', type: 'company' },
					{ name: 'jobTitle', type: 'job_title' },
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.company).toBe('string')
				expect(typeof row.jobTitle).toBe('string')
			}
		})

		it('should generate latitude and longitude', async () => {
			const fields = encodeURIComponent(
				JSON.stringify([
					{ name: 'lat', type: 'latitude' },
					{ name: 'lng', type: 'longitude' },
				]),
			)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?fields=${fields}&count=2`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.lat).toBe('number')
				expect(row.lat).toBeGreaterThanOrEqual(-90)
				expect(row.lat).toBeLessThanOrEqual(90)
				expect(typeof row.lng).toBe('number')
				expect(row.lng).toBeGreaterThanOrEqual(-180)
				expect(row.lng).toBeLessThanOrEqual(180)
			}
		})
	})

	describe('QS Package Integration', () => {
		it('should parse qs formatted array parameters', async () => {
			// Using qs.stringify to create query string
			const params = {
				fields: [{ name: 'id', type: 'uuid' }],
				count: 2,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			expect(json.count).toBe(2)
			expect(json.data[0]).toHaveProperty('id')
		})

		it('should parse multiple qs array fields', async () => {
			// Using qs.stringify with multiple fields
			const params = {
				fields: [
					{ name: 'id', type: 'uuid' },
					{ name: 'email', type: 'email' },
				],
				count: 3,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			expect(json.count).toBe(3)
			expect(json.data[0]).toHaveProperty('id')
			expect(json.data[0]).toHaveProperty('email')
		})

		it('should parse qs enum with values array', async () => {
			// Using qs.stringify with enum and values array
			const params = {
				fields: [
					{
						name: 'role',
						type: 'enum',
						values: ['admin', 'user', 'guest'],
					},
				],
				count: 5,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			const validRoles = ['admin', 'user', 'guest']

			for (const row of json.data) {
				expect(validRoles).toContain(row.role)
			}
		})

		it('should parse qs number with min and max constraints', async () => {
			// Using qs.stringify with number constraints
			const params = {
				fields: [
					{
						name: 'age',
						type: 'number',
						min: 18,
						max: 65,
					},
				],
				count: 5,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(row.age).toBeGreaterThanOrEqual(18)
				expect(row.age).toBeLessThanOrEqual(65)
			}
		})

		it('should parse qs with related property', async () => {
			// Using qs.stringify with related faker property
			const params = {
				fields: [
					{
						name: 'vehicle',
						type: 'string',
						related: 'vehicle.bicycle',
					},
				],
				count: 2,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.vehicle).toBe('string')
				expect(row.vehicle.length).toBeGreaterThan(0)
			}
		})

		it('should parse complex qs with mixed field types', async () => {
			// Using qs.stringify with complex mixed types
			const params = {
				fields: [
					{ name: 'id', type: 'uuid' },
					{ name: 'email', type: 'email' },
					{
						name: 'role',
						type: 'enum',
						values: ['admin', 'user'],
					},
					{
						name: 'age',
						type: 'number',
						min: 18,
						max: 65,
					},
					{ name: 'active', type: 'boolean' },
				],
				count: 2,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			expect(json.count).toBe(2)

			const row = json.data[0]
			expect(row).toHaveProperty('id')
			expect(row).toHaveProperty('email')
			expect(['admin', 'user']).toContain(row.role)
			expect(row.age).toBeGreaterThanOrEqual(18)
			expect(row.age).toBeLessThanOrEqual(65)
			expect(typeof row.active).toBe('boolean')
		})

		it('should parse qs parameters with count parameter', async () => {
			// Using qs.stringify with count parameter
			const params = {
				fields: [
					{ name: 'firstName', type: 'firstname' },
					{ name: 'lastName', type: 'lastname' },
				],
				count: 10,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.count).toBe(10)
			expect(json.data.length).toBe(10)
		})

		it('should parse qs with seed parameter', async () => {
			// Using qs.stringify with seed for reproducibility
			const params = {
				fields: [{ name: 'id', type: 'uuid' }],
				count: 3,
				seed: 12345,
			}
			const qsQuery = qs.stringify(params)

			const response1 = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)
			const json1 = await response1.json()

			const response2 = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)
			const json2 = await response2.json()

			// Same seed should produce same results
			expect(json1.data[0].id).toBe(json2.data[0].id)
			expect(json1.data[1].id).toBe(json2.data[1].id)
			expect(json1.data[2].id).toBe(json2.data[2].id)
		})

		it('should parse qs with location fields', async () => {
			// Using qs.stringify with location fields
			const params = {
				fields: [
					{ name: 'city', type: 'city' },
					{ name: 'country', type: 'country' },
					{ name: 'zipcode', type: 'zipcode' },
				],
				count: 2,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.city).toBe('string')
				expect(typeof row.country).toBe('string')
				expect(typeof row.zipcode).toBe('string')
			}
		})

		it('should parse qs with web-related fields', async () => {
			// Using qs.stringify with web fields
			const params = {
				fields: [
					{ name: 'url', type: 'url' },
					{ name: 'ipv4', type: 'ipv4' },
					{ name: 'username', type: 'username' },
				],
				count: 2,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.url).toBe('string')
				expect(row.url).toMatch(/^https?:\/\//)
				expect(typeof row.ipv4).toBe('string')
				expect(typeof row.username).toBe('string')
			}
		})

		it('should parse qs with multiple related properties', async () => {
			// Using qs.stringify with multiple related properties
			const params = {
				fields: [
					{
						name: 'vehicle',
						type: 'string',
						related: 'vehicle.bicycle',
					},
					{
						name: 'animal',
						type: 'string',
						related: 'animal.dog',
					},
				],
				count: 2,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.vehicle).toBe('string')
				expect(typeof row.animal).toBe('string')
			}
		})

		it('should handle qs with special characters in enum values', async () => {
			// Using qs.stringify with special characters in enum values
			const params = {
				fields: [
					{
						name: 'status',
						type: 'enum',
						values: ['pending', 'in-progress', 'completed'],
					},
				],
				count: 5,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			const validStatuses = ['pending', 'in-progress', 'completed']

			for (const row of json.data) {
				expect(validStatuses).toContain(row.status)
			}
		})

		it('should parse qs with date and content fields', async () => {
			// Using qs.stringify with date and content fields
			const params = {
				fields: [
					{ name: 'createdAt', type: 'date' },
					{ name: 'sentence', type: 'sentence' },
					{ name: 'word', type: 'word' },
				],
				count: 2,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.createdAt).toBe('string')
				expect(row.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
				expect(typeof row.sentence).toBe('string')
				expect(row.sentence.length).toBeGreaterThan(0)
				expect(typeof row.word).toBe('string')
				expect(row.word.length).toBeGreaterThan(0)
			}
		})

		it('should parse qs with all string-type variants', async () => {
			// Using qs.stringify with all string type variants
			const params = {
				fields: [
					{ name: 'firstName', type: 'firstname' },
					{ name: 'lastName', type: 'lastname' },
					{ name: 'fullName', type: 'fullname' },
					{ name: 'company', type: 'company' },
					{ name: 'jobTitle', type: 'job_title' },
				],
				count: 1,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			const row = json.data[0]

			expect(typeof row.firstName).toBe('string')
			expect(typeof row.lastName).toBe('string')
			expect(typeof row.fullName).toBe('string')
			expect(typeof row.company).toBe('string')
			expect(typeof row.jobTitle).toBe('string')
		})

		it('should parse qs with coordinates fields', async () => {
			// Using qs.stringify with coordinates
			const params = {
				fields: [
					{ name: 'latitude', type: 'latitude' },
					{ name: 'longitude', type: 'longitude' },
				],
				count: 3,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.latitude).toBe('number')
				expect(row.latitude).toBeGreaterThanOrEqual(-90)
				expect(row.latitude).toBeLessThanOrEqual(90)
				expect(typeof row.longitude).toBe('number')
				expect(row.longitude).toBeGreaterThanOrEqual(-180)
				expect(row.longitude).toBeLessThanOrEqual(180)
			}
		})

		it('should parse qs with business fields', async () => {
			// Using qs.stringify with business fields
			const params = {
				fields: [
					{ name: 'company', type: 'company' },
					{ name: 'jobTitle', type: 'job_title' },
				],
				count: 2,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.company).toBe('string')
				expect(typeof row.jobTitle).toBe('string')
			}
		})

		it('should handle qs default count when not specified', async () => {
			// Using qs.stringify without count parameter (defaults to 10)
			const params = {
				fields: [{ name: 'id', type: 'uuid' }],
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.count).toBe(10) // default count
			expect(json.data.length).toBe(10)
		})

		it('should parse qs with string length constraint', async () => {
			// Using qs.stringify with string length
			const params = {
				fields: [
					{
						name: 'code',
						type: 'string',
						length: 8,
					},
				],
				count: 3,
			}
			const qsQuery = qs.stringify(params)
			const response = await app.handle(
				new Request(`${HOST_API}/generate?${qsQuery}`),
			)

			expect(response.status).toBe(200)
			const json = await response.json()

			expect(json.success).toBe(true)
			for (const row of json.data) {
				expect(typeof row.code).toBe('string')
				expect(row.code.length).toBe(8)
			}
		})
	})
})
