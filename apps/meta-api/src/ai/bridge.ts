import { env } from '../config/env';

var DEFAULT_TIMEOUT_MS = 8000;

function parseTimeout(raw: string | undefined): number {
  if (!raw) {
    return DEFAULT_TIMEOUT_MS;
  }
  var parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return parsed;
}

function fetchWithTimeout(url: string, options: any, timeoutMs: number): Promise<any> {
  var controller = new AbortController();
  var timer = setTimeout(function () {
    controller.abort();
  }, timeoutMs);
  var finalOptions = Object.assign({}, options, { signal: controller.signal });

  return fetch(url, finalOptions).finally(function () {
    clearTimeout(timer);
  });
}

function createAiBridge(baseUrl?: string, timeoutRaw?: string) {
  var serviceUrl = baseUrl || '';
  var timeoutMs = parseTimeout(timeoutRaw);

  function isConfigured(): boolean {
    return serviceUrl.length > 0;
  }

  async function ask(question: string, k: number, sources?: string[]): Promise<any> {
    if (!serviceUrl) {
      throw new Error('AI embeddings service not configured');
    }
    var payload: any = {
      question: question,
      k: k > 0 ? k : 5
    };
    if (sources && Array.isArray(sources) && sources.length > 0) {
      payload.sources = sources;
    }

    var response = await fetchWithTimeout(
      serviceUrl.replace(/\/+$/, '') + '/ask',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      },
      timeoutMs
    );

    if (!response.ok) {
      var text = await response.text();
      throw new Error('AI service error (' + response.status + '): ' + text);
    }

    return response.json();
  }

  return {
    isConfigured: isConfigured,
    ask: ask
  };
}

var aiBridge = createAiBridge(env.AI_EMBEDDINGS_URL, env.AI_EMBEDDINGS_TIMEOUT_MS);

export { aiBridge, createAiBridge };
