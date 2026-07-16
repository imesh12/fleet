const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const skipServerCheck = process.argv.includes('--skip-server-check');

function validateOpenApiDocument(document: Record<string, unknown>) {
  const errors: string[] = [];
  if (document.openapi !== '3.1.0' && typeof document.openapi !== 'string') {
    errors.push('openapi version is missing');
  }
  if (!document.info || typeof document.info !== 'object') {
    errors.push('info object is missing');
  }
  if (!document.paths || typeof document.paths !== 'object') {
    errors.push('paths object is missing');
  }
  if (!document.components || typeof document.components !== 'object') {
    errors.push('components object is missing');
  }
  return errors;
}

async function main() {
  try {
    const response = await fetch(`${baseUrl}/openapi.json`);
    const body = await response.json();
    const document = body?.success === true ? body.data : body;
    const errors = validateOpenApiDocument(document);

    if (!response.ok) {
      console.error(`OpenAPI endpoint returned HTTP ${response.status}`);
      process.exitCode = 1;
      return;
    }

    if (errors.length > 0) {
      console.error(`OpenAPI validation failed: ${errors.join('; ')}`);
      process.exitCode = 1;
      return;
    }

    console.log(`OpenAPI skeleton validated from ${baseUrl}/openapi.json`);
  } catch (error) {
    if (skipServerCheck) {
      console.log('OpenAPI validation skipped because --skip-server-check was supplied.');
      return;
    }
    console.error(`${error instanceof Error ? error.message : 'Unable to validate OpenAPI document'}. Start the API server or pass --skip-server-check.`);
    process.exitCode = 1;
  }
}

void main();
