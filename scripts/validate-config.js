#!/usr/bin/env node
// scripts/validate-config.js
// Checks config files for exposed secrets or environment mismatches

var fs = require('fs');
var path = require('path');

var FORBIDDEN_PATTERNS = [
  /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /secret\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
  /bearer\s+[a-z0-9]{20,}/gi,
  /sk[_-]live[_-][a-z0-9]{20,}/gi,
  /pk[_-]live[_-][a-z0-9]{20,}/gi,
  /ghp_[a-zA-Z0-9]{36}/g,
  /gho_[a-zA-Z0-9]{36}/g,
  /xox[baprs]-[a-zA-Z0-9-]+/g
];

var SAFE_PLACEHOLDERS = [
  'YOUR_API_KEY',
  'YOUR_SECRET',
  'REPLACE_ME',
  'TODO',
  'EXAMPLE',
  'localhost'
];

var CONFIG_FILES = [
  'config.js',
  'config-production.js',
  '.env',
  '.env.local',
  '.env.production'
];

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { file: filePath, status: 'not_found', issues: [] };
  }

  var content = fs.readFileSync(filePath, 'utf8');
  var issues = [];

  FORBIDDEN_PATTERNS.forEach(function(pattern) {
    var matches = content.match(pattern);
    if (matches) {
      matches.forEach(function(match) {
        var isSafe = SAFE_PLACEHOLDERS.some(function(placeholder) {
          return match.toUpperCase().indexOf(placeholder) !== -1;
        });

        if (!isSafe) {
          issues.push({
            pattern: pattern.toString(),
            match: match.slice(0, 30) + '...',
            severity: 'error'
          });
        }
      });
    }
  });

  return {
    file: filePath,
    status: issues.length > 0 ? 'failed' : 'passed',
    issues: issues
  };
}

function main() {
  console.log('Validating configuration files for secrets...\n');

  var results = [];
  var hasErrors = false;

  CONFIG_FILES.forEach(function(configFile) {
    var filePath = path.join(process.cwd(), configFile);
    var result = checkFile(filePath);
    results.push(result);

    if (result.status === 'not_found') {
      console.log('  - ' + configFile + ': skipped (not found)');
    } else if (result.status === 'passed') {
      console.log('  ✓ ' + configFile + ': clean');
    } else {
      console.log('  ✗ ' + configFile + ': POTENTIAL SECRETS DETECTED');
      result.issues.forEach(function(issue) {
        console.log('    → ' + issue.match);
      });
      hasErrors = true;
    }
  });

  console.log('\n---');

  if (hasErrors) {
    console.error('\nERROR: Potential secrets detected in config files!');
    console.error('Please remove or replace with environment variables.\n');
    process.exit(1);
  }

  console.log('\nAll config files validated successfully.');
}

main();
