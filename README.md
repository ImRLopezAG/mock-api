# Mock Data Generator API

A production-ready REST API for generating realistic mock data, similar to [mockaroo.com](https://mockaroo.com). Built with [Elysia](https://elysia.js.org/), [Faker.js](https://fakerjs.dev/), and comprehensive TypeScript support.

## Features

✨ **25+ Field Types** - string, number, boolean, date, email, phone, uuid, url, and many more  
🎭 **Faker.js Integration** - Access any faker method via the `related` property (e.g., `animal.dog`, `vehicle.bicycle`)  
📝 **Flexible API** - Supports both JSON and QS array notation for query parameters  
✅ **Full Type Safety** - Zod validation for all inputs and responses  
🔍 **OpenAPI Documentation** - Auto-generated Swagger UI for interactive API exploration  
📦 **SuperJSON Serialization** - Handles complex types and date serialization  
🧪 **Comprehensive Tests** - 43 unit tests with 315+ expect() calls  
⚡ **High Performance** - Built on Elysia for minimal overhead

## Installation

```bash
bun install
```

## Development

Start the development server:

```bash
bun run dev
```

The server runs at `http://localhost:3000`

### Access OpenAPI Documentation

Once the server is running, visit the interactive Swagger UI at:
- **Swagger UI**: http://localhost:3000/spec (recommended)
- **API Root**: http://localhost:3000/

## API Endpoints

### GET `/generate` - Generate Mock Data

Main endpoint for generating mock data with customizable field definitions.

**Query Parameters:**
- `fields` (required): JSON array of field definitions or QS array notation  
- `count` (optional): Number of records to generate (1-10000, default: 10)  
- `seed` (optional): Seed for reproducible results  

**Example - Basic JSON:**
```bash
curl "http://localhost:3000/generate?fields=[{\"name\":\"id\",\"type\":\"uuid\"},{\"name\":\"email\",\"type\":\"email\"}]&count=5"
```

**Example - With Faker Related Properties:**
```bash
curl "http://localhost:3000/generate?fields=[{\"name\":\"animal\",\"type\":\"string\",\"related\":\"animal.dog\"},{\"name\":\"vehicle\",\"type\":\"string\",\"related\":\"vehicle.bicycle\"}]&count=3"
```

### GET `/types` - List Supported Types

Returns all supported field types for use in field definitions.

```bash
curl http://localhost:3000/types
```

## Supported Field Types

**String & Text:** string, word, sentence, paragraph, password  
**Identifiers:** uuid, username  
**Internet:** email, phone, url, image, ipv4, ipv6  
**Numbers:** number (with min/max), latitude, longitude  
**Location:** address, city, country, zipcode  
**Person:** firstname, lastname, fullname  
**Business:** company, job_title, credit_card, hexcolor  
**Other:** date, boolean, enum (with values array)

## Testing

Run the comprehensive test suite:

```bash
bun test
```

**Test Coverage:**
- ✅ 43 unit tests
- ✅ 315+ expect() calls
- ✅ All 3 endpoints covered
- ✅ All 25+ field types tested
- ✅ QS package integration tests

## Technology Stack

- **Framework**: [Elysia.js](https://elysia.js.org/)
- **Data Generation**: [@faker-js/faker](https://fakerjs.dev/)
- **Validation**: [Zod](https://zod.dev/)
- **Query Parsing**: [qs](https://www.npmjs.com/package/qs)
- **Serialization**: [SuperJSON](https://github.com/blitz-js/superjson)
- **Documentation**: [@elysiajs/openapi](https://elysia.js.org/plugins/openapi.html)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## License

MIT