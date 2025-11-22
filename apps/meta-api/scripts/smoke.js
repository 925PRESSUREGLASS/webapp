/* Simple smoke test for running API against localhost */
/* Requires the API to be running on port 4000 */
var endpoints = ['/health', '/projects', '/features', '/assets'];

function logResult(path, status, detail) {
  console.log(path + ' -> ' + status + (detail ? ' (' + detail + ')' : ''));
}

(async function () {
  for (var i = 0; i < endpoints.length; i++) {
    var path = endpoints[i];
    try {
      var res = await fetch('http://localhost:4000' + path);
      var text = await res.text();
      logResult(path, res.status, text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : '');
    } catch (e) {
      logResult(path, 'error', e && e.message ? e.message : 'unknown error');
    }
  }
})();
