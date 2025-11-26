#!/usr/bin/env node
// scripts/cap-verify.js
// Verifies Capacitor sync produced consistent native assets

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;

var ASSETS_TO_CHECK = [
  'capacitor.config.json',
  'icon-192.png',
  'icon-512.png',
  'manifest.json'
];

function hashFile(filePath) {
  try {
    var content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  } catch (e) {
    return 'NOT_FOUND';
  }
}

function main() {
  console.log('Running Capacitor sync...');
  
  try {
    execSync('npm run cap:sync', { stdio: 'inherit' });
  } catch (e) {
    console.error('cap:sync failed:', e.message);
    process.exit(1);
  }

  console.log('\nVerifying asset checksums...\n');

  var checksums = {};
  var allFound = true;

  ASSETS_TO_CHECK.forEach(function(asset) {
    var hash = hashFile(path.join(process.cwd(), asset));
    checksums[asset] = hash;
    
    if (hash === 'NOT_FOUND') {
      console.log('  ✗ ' + asset + ': NOT FOUND');
      allFound = false;
    } else {
      console.log('  ✓ ' + asset + ': ' + hash);
    }
  });

  console.log('\n---');
  
  if (!allFound) {
    console.log('WARNING: Some assets were not found');
    process.exit(1);
  }

  // Save checksums for comparison
  var checksumFile = path.join(process.cwd(), '.cap-checksums.json');
  
  if (fs.existsSync(checksumFile)) {
    var previous = JSON.parse(fs.readFileSync(checksumFile, 'utf8'));
    var changed = [];
    
    Object.keys(checksums).forEach(function(key) {
      if (previous[key] && previous[key] !== checksums[key]) {
        changed.push(key);
      }
    });

    if (changed.length > 0) {
      console.log('Changed assets since last verify:');
      changed.forEach(function(asset) {
        console.log('  - ' + asset);
      });
    } else {
      console.log('No asset changes detected.');
    }
  }

  fs.writeFileSync(checksumFile, JSON.stringify(checksums, null, 2));
  console.log('Checksums saved to .cap-checksums.json');
  console.log('\nCapacitor verify complete!');
}

main();
