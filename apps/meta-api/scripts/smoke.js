var fetch = global.fetch || require('node-fetch');

function check(path) {
  var headers = {};
  if (process.env.API_KEY) {
    headers['x-api-key'] = process.env.API_KEY;
  }
  return fetch('http://localhost:4000' + path, { headers: headers })
    .then(function (res) {
      if (!res.ok) {
        throw new Error(path + ' HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (json) {
      return { path: path, ok: true, data: json };
    })
    .catch(function (err) {
      return { path: path, ok: false, error: err && err.message ? err.message : String(err) };
    });
}

Promise.all([check('/health'), check('/projects'), check('/businesses'), check('/packages')])
  .then(function (results) {
    var failures = results.filter(function (r) {
      return !r.ok;
    });
    if (failures.length) {
      console.error('Smoke failures:', failures);
      process.exit(1);
    }
    console.log('Smoke ok:', results.map(function (r) { return r.path; }).join(', '));
  })
  .catch(function (err) {
    console.error('Smoke error:', err);
    process.exit(1);
  });
