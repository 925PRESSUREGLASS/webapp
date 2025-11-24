function resolveApiBase(): string {
  var env = (import.meta as any).env || {};
  if (env && env.VITE_META_API_URL) {
    return env.VITE_META_API_URL;
  }
  return 'http://localhost:4000';
}

var apiBaseUrl = resolveApiBase();
var apiKey = ((import.meta as any).env && (import.meta as any).env.VITE_META_API_KEY) || '';

function fetchHealth(): Promise<{
  status: string;
  projectsTracked?: number;
  appsTracked?: number;
  assetsTracked?: number;
  featuresTracked?: number;
  dbMode?: string;
}> {
  return fetch(apiBaseUrl + '/health', {
    headers: apiKey ? { 'x-api-key': apiKey } : undefined
  }).then(function (response) {
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    return response.json();
  });
}

function authHeaders(): { [key: string]: string } {
  return apiKey ? { 'x-api-key': apiKey } : {};
}

export { apiBaseUrl, fetchHealth, authHeaders };
