/* eslint-disable no-console */
const { exec } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const PACKAGE_JSON_PATH = path.join(__dirname, 'release/app/package.json');
const PACKAGE_LOCK_JSON_PATH = path.join(
  __dirname,
  'release/app/package-lock.json'
);

const args = process.argv
  .filter((a) => a.includes('='))
  .reduce((result, current) => {
    const values = current.split('=');

    result[values[0]] = values[1] || '';
    return result;
  }, {});

exec(`git fetch && git tag`, (e1, tagsExecResult) => {
  if (e1) {
    console.log(`error: ${e1.message}`);
    return;
  }

  const latestVersion = tagsExecResult
    .split('\n')
    .filter((a) => a.startsWith('v'))
    .map((i) =>
      i
        .slice(1)
        .split('.')
        .map((j) => parseInt(j.trim(), 10))
    )
    .sort((a, b) => {
      if (a[0] !== b[0]) {
        return b[0] - a[0];
      }

      if (a[1] !== b[1]) {
        return b[1] - a[1];
      }

      return b[2] - a[2];
    })[0] || [0, 0, 0];

  const op = args.type?.toLowerCase() || 'major';

  switch (op) {
    case 'major':
      latestVersion[0] += 1;
      latestVersion[1] = 0;
      latestVersion[2] = 0;
      break;

    case 'minor':
      latestVersion[1] += 1;
      latestVersion[2] = 0;
      break;
    case 'patch':
      latestVersion[2] += 1;
      break;

    default:
      break;
  }

  const newVersion = latestVersion.join('.');

  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH));
  const packageLockJson = JSON.parse(readFileSync(PACKAGE_LOCK_JSON_PATH));

  packageJson.version = newVersion;
  packageLockJson.version = newVersion;
  packageLockJson.packages[''].version = newVersion;

  writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
  writeFileSync(
    PACKAGE_LOCK_JSON_PATH,
    JSON.stringify(packageLockJson, null, 2)
  );

  exec(
    `git fetch && git add --all && git commit -m "Before Release v${newVersion}" && git tag v${newVersion} && git push --tags`,
    (e2, stdout, stderr) => {
      if (e2) {
        console.log(`error: ${e2.message}`);
        return;
      }

      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
});

/*



*/
