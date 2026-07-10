type SmokeResult = {
  name: string;
  ok: boolean;
  status?: number;
  detail: string;
};

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const emailOrUsername = process.env.SUPER_ADMIN_EMAIL ?? 'admin@trackigniter8.local';
const password = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';
const skipServerCheck = process.argv.includes('--skip-server-check');

function printSmokeHelp() {
  console.log('');
  console.log('API smoke test setup:');
  console.log(`- API_BASE_URL=${baseUrl}`);
  console.log('- SUPER_ADMIN_EMAIL defaults to admin@trackigniter8.local unless provided.');
  console.log('- SUPER_ADMIN_PASSWORD defaults to the local development password unless provided.');
  console.log('');
  console.log('Start the API server in another terminal, then rerun:');
  console.log('  npm.cmd run dev');
  console.log('  npm.cmd run api:smoke');
  console.log('');
  console.log('To only validate script wiring without a running server:');
  console.log('  npm.cmd run api:smoke -- --skip-server-check');
}

async function requestJson(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

async function runSmokeTests(): Promise<SmokeResult[]> {
  const results: SmokeResult[] = [];
  let accessToken: string | undefined;

  try {
    const { response, body } = await requestJson('/health');
    results.push({
      name: 'health',
      ok: response.ok && body?.success === true,
      status: response.status,
      detail: response.ok ? 'health endpoint responded' : JSON.stringify(body),
    });
  } catch (error) {
    if (skipServerCheck) {
      return [
        {
          name: 'server availability',
          ok: true,
          detail: 'skipped because --skip-server-check was supplied',
        },
      ];
    }

    return [
      {
        name: 'server availability',
        ok: false,
        detail: `${error instanceof Error ? error.message : 'API server is not reachable'}. Start the server with "npm.cmd run dev" or set API_BASE_URL.`,
      },
    ];
  }

  const login = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername, password }),
  });
  accessToken = login.body?.data?.accessToken;
  results.push({
    name: 'login',
    ok: login.response.ok && Boolean(accessToken),
    status: login.response.status,
    detail: accessToken ? 'received access token' : JSON.stringify(login.body),
  });

  const authenticatedChecks = [
    ['auth/me', '/auth/me'],
    ['navigation menu', '/navigation/menu'],
    ['dashboard summary', '/admin/dashboard/summary'],
    ['admin users list', '/admin/users'],
    ['vehicles list', '/admin/vehicles'],
    ['drivers list', '/admin/drivers'],
    ['files list', '/admin/files'],
  ] as const;

  for (const [name, path] of authenticatedChecks) {
    if (!accessToken) {
      results.push({ name, ok: false, detail: 'skipped because login failed' });
      continue;
    }

    const { response, body } = await requestJson(path, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    results.push({
      name,
      ok: response.ok && body?.success === true,
      status: response.status,
      detail: response.ok ? 'success envelope returned' : JSON.stringify(body),
    });
  }

  return results;
}

async function main() {
  const results = await runSmokeTests();
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.status ? ` (${result.status})` : ''}: ${result.detail}`);
  }

  if (results.some((result) => !result.ok)) {
    printSmokeHelp();
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
