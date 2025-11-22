function resolveApiBase(): string {
  var env = (import.meta as any).env || {};
  if (env && env.VITE_META_API_URL) {
    return env.VITE_META_API_URL;
  }
  return 'http://localhost:4000';
}

var apiBaseUrl = resolveApiBase();

function fetchHealth(): Promise<{
  status: string;
  projectsTracked?: number;
  appsTracked?: number;
  assetsTracked?: number;
  featuresTracked?: number;
}> {
  return fetch(apiBaseUrl + '/health').then(function (response) {
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    return response.json();
  });
}

export { apiBaseUrl, fetchHealth };
