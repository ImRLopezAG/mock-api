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

The server runs at `http://localhost:3001`

### Access OpenAPI Documentation

Once the server is running, visit the interactive Swagger UI at:
- **Swagger UI**: http://localhost:3001/spec (recommended)
- **API Root**: http://localhost:3001/

## API Endpoints

### GET `/generate` - Generate Mock Data

Main endpoint for generating mock data with customizable field definitions.

**Query Parameters:**
- `fields` (required): JSON array of field definitions or QS array notation  
- `count` (optional): Number of records to generate (1-10000, default: 10)  
- `seed` (optional): Seed for reproducible results  

**Example - Basic JSON:**
```bash
cURL "http://localhost:3001/generate?fields=[{\"name\":\"id\",\"type\":\"uuid\"},{\"name\":\"email\",\"type\":\"email\"}]&count=5"
```

**Example - With Faker Related Properties:**
```bash
cURL "http://localhost:3001/generate?fields=[{\"name\":\"animal\",\"type\":\"string\",\"related\":\"animal.dog\"},{\"name\":\"vehicle\",\"type\":\"string\",\"related\":\"vehicle.bicycle\"}]&count=3"
```

### GET `/types` - List Supported Types

Returns all supported field types for use in field definitions.

```bash
curl http://localhost:3001/types
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

## Load Testing (Artillery)

You can run load and stress tests against the API using Artillery. The test scripts are located in the `artillery/` directory and target the `/api/generate` and `/api/types` endpoints.

Run locally (requires Artillery installed):

```bash
# start the server first
bun run dev

# in another terminal run Artillery
npm run artillery:stress
```

Run with Docker (no Artillery install required):

```bash
# start the server first
bun run dev

# pre-pull the Artillery image
npm run artillery:pull

# run Artillery using Docker
npm run artillery:stress:docker
```

If you use the `artillery` CLI directly, you can override the `target` in the config, otherwise the scripts will use `http://localhost:3001` by default.

Example commands to run a soak scenario via the CLI:

```bash
# Run soak scenario using global Artillery CLI
artillery run artillery/soak.yml

# Run soak scenario using npx
npx artillery run artillery/soak.yml
```
The Artillery scripts ramp load, run a mix of GET and POST traffic, and collect basic thresholds.

Set `TARGET` environment variable to override the target URL (defaults to `http://localhost:3001`):

```bash
TARGET=http://localhost:3001 npm run artillery:stress
```

The script ramps virtual users up and runs a mix of GET and POST traffic, validating responses and collecting basic thresholds.