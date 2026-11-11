// Meteor 3.6 still generates vulnerable bootstrap dependencies independently of
// the app lockfile. Update these two pins before installing the server bundle.
const fs = require('node:fs');
const path = require('node:path');

const serverDir = process.argv[2];
if (!serverDir) throw new Error('Usage: node prepare-meteor-bundle.cjs <bundle/programs/server>');
const filename = path.join(serverDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(filename, 'utf8'));
if (pkg.name !== 'meteor-dev-bundle') throw new Error('Expected a Meteor server bundle');

const updates = {
  // Node-gyp 13 supports Node 26 and replaces the vulnerable Tar 6 toolchain.
  'node-gyp': { previous: '10.2.0', version: '13.1.0' },
  underscore: { previous: '1.13.7', version: '1.13.8' },
};
for (const [name, { previous, version }] of Object.entries(updates)) {
  const current = pkg.dependencies?.[name];
  if (current !== previous && current !== version) {
    throw new Error(`Review the bundle dependency update for ${name}: found ${current}`);
  }
  pkg.dependencies[name] = version;
}

// Meteor emits read-only files. Replace the manifest rather than changing any
// shared file, and let npm reconcile its generated shrinkwrap during install.
const temporary = `${filename}.prepared`;
fs.writeFileSync(temporary, `${JSON.stringify(pkg, null, 2)}\n`);
fs.renameSync(temporary, filename);
const shrinkwrap = path.join(serverDir, 'npm-shrinkwrap.json');
fs.chmodSync(shrinkwrap, fs.statSync(shrinkwrap).mode | 0o200);
