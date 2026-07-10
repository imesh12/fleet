import type { FastifyPluginAsync } from 'fastify';

const contractTags = [
  'Health',
  'Authentication',
  'Navigation',
  'Dashboard',
  'Admin',
  'Organizations',
  'Customers',
  'Vehicles',
  'Drivers',
  'Trips',
  'Dispatch',
  'Tracking',
  'Maintenance',
  'Fuel',
  'Reports',
  'Files',
  'Settings',
];

function successResponse(description = 'Success envelope') {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/SuccessEnvelope' },
      },
    },
  };
}

function errorResponse(description = 'Error envelope') {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorEnvelope' },
      },
    },
  };
}

function bearerSecurity() {
  return [{ bearerAuth: [] }];
}

const frontendCriticalPaths = {
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login with email/username and password',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            examples: {
              default: {
                value: {
                  emailOrUsername: 'admin@trackigniter8.local',
                  password: 'ChangeMe123!',
                },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Access token, refresh token, and user summary'),
        400: errorResponse(),
        401: errorResponse('Invalid credentials'),
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get the current authenticated user',
      security: bearerSecurity(),
      responses: { 200: successResponse('Current user envelope'), 401: errorResponse('Unauthorized') },
    },
  },
  '/navigation/menu': {
    get: {
      tags: ['Navigation'],
      summary: 'Get current user navigation menu filtered by RBAC and status',
      security: bearerSecurity(),
      parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
      responses: { 200: successResponse('Menu groups and menu items'), 401: errorResponse('Unauthorized') },
    },
  },
  '/admin/dashboard/summary': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get operational dashboard summary',
      security: bearerSecurity(),
      parameters: [
        { $ref: '#/components/parameters/OrganizationHeader' },
        { $ref: '#/components/parameters/OrganizationIdQuery' },
      ],
      responses: { 200: successResponse('Dashboard summary'), 403: errorResponse('Missing permission') },
    },
  },
  '/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'List users',
      security: bearerSecurity(),
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/PageSizeQuery' },
        { $ref: '#/components/parameters/SearchQuery' },
      ],
      responses: { 200: successResponse('Paginated users'), 403: errorResponse('Missing permission') },
    },
  },
  '/admin/organizations': {
    get: {
      tags: ['Organizations'],
      summary: 'List organizations',
      security: bearerSecurity(),
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/PageSizeQuery' },
        { $ref: '#/components/parameters/SearchQuery' },
      ],
      responses: { 200: successResponse('Paginated organizations'), 403: errorResponse('Missing permission') },
    },
  },
  '/admin/vehicles': {
    get: {
      tags: ['Vehicles'],
      summary: 'List vehicles',
      security: bearerSecurity(),
      parameters: [
        { $ref: '#/components/parameters/OrganizationHeader' },
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/PageSizeQuery' },
        { $ref: '#/components/parameters/SearchQuery' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'vehicleTypeId', in: 'query', schema: { type: 'string' } },
        { name: 'vehicleGroupId', in: 'query', schema: { type: 'string' } },
        { name: 'customerAccountId', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: successResponse('Paginated vehicles'), 403: errorResponse('Missing permission') },
    },
  },
  '/admin/drivers': {
    get: {
      tags: ['Drivers'],
      summary: 'List drivers',
      security: bearerSecurity(),
      parameters: [
        { $ref: '#/components/parameters/OrganizationHeader' },
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/PageSizeQuery' },
        { $ref: '#/components/parameters/SearchQuery' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'driverGroupId', in: 'query', schema: { type: 'string' } },
        { name: 'customerAccountId', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: successResponse('Paginated drivers'), 403: errorResponse('Missing permission') },
    },
  },
  '/admin/trips': {
    get: {
      tags: ['Trips'],
      summary: 'List executed trips',
      security: bearerSecurity(),
      parameters: [
        { $ref: '#/components/parameters/OrganizationHeader' },
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/PageSizeQuery' },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'vehicleId', in: 'query', schema: { type: 'string' } },
        { name: 'driverId', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: successResponse('Paginated trips'), 403: errorResponse('Missing permission') },
    },
  },
  '/admin/tracking/vehicles/latest': {
    get: {
      tags: ['Tracking'],
      summary: 'List latest tracked vehicle positions',
      security: bearerSecurity(),
      parameters: [
        { $ref: '#/components/parameters/OrganizationHeader' },
        { name: 'vehicleId', in: 'query', schema: { type: 'string' } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500 } },
      ],
      responses: { 200: successResponse('Latest vehicle positions'), 403: errorResponse('Missing permission') },
    },
  },
};

function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Trackigniter8 Backend API',
      version: '0.22.0',
      description:
        'Stage 22 OpenAPI skeleton. Use docs/api/route-inventory.json for the generated route inventory until full per-route schemas are attached.',
    },
    servers: [{ url: '/api/v1' }],
    tags: contractTags.map((name) => ({ name })),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      parameters: {
        OrganizationHeader: {
          name: 'x-organization-id',
          in: 'header',
          required: false,
          schema: { type: 'string' },
          description: 'Tenant organization context. Required for most organization-scoped reads unless inferable from user membership.',
        },
        OrganizationIdQuery: {
          name: 'organizationId',
          in: 'query',
          required: false,
          schema: { type: 'string' },
        },
        PageQuery: {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        PageSizeQuery: {
          name: 'pageSize',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
        SearchQuery: {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['emailOrUsername', 'password'],
          properties: {
            emailOrUsername: { type: 'string' },
            password: { type: 'string', format: 'password' },
          },
        },
        SuccessEnvelope: {
          type: 'object',
          required: ['success', 'data', 'meta'],
          properties: {
            success: { type: 'boolean', const: true },
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
        ErrorEnvelope: {
          type: 'object',
          required: ['success', 'error', 'meta'],
          properties: {
            success: { type: 'boolean', const: false },
            error: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    security: bearerSecurity(),
    paths: frontendCriticalPaths,
  };
}

export const apiContractRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/openapi.json', async (_request, reply) => {
    return reply.send(buildOpenApiDocument());
  });

  fastify.get('/docs', async (_request, reply) => {
    return reply
      .type('text/html')
      .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Trackigniter8 API Docs</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 3rem; color: #172033; background: #f7f4ee; }
      main { max-width: 760px; padding: 2rem; border: 1px solid #d8cfbf; background: #fffaf0; border-radius: 18px; }
      code { background: #efe6d6; padding: 0.15rem 0.35rem; border-radius: 6px; }
      a { color: #885a1f; }
    </style>
  </head>
  <body>
    <main>
      <h1>Trackigniter8 API Docs</h1>
      <p>Stage 22 exposes an OpenAPI skeleton at <a href="/api/v1/openapi.json"><code>/api/v1/openapi.json</code></a>.</p>
      <p>The generated route inventory lives in <code>docs/api/route-inventory.md</code> and <code>docs/api/route-inventory.json</code>.</p>
      <p>Swagger UI can be added later without changing the API contract endpoint.</p>
    </main>
  </body>
</html>`);
  });
};
