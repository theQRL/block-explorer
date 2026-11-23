> [!NOTE]
> This code relates to version 1.x of QRL, the world's first open-source PQ blockchain, which has been securing digital assets since December 2016.
> The next generation of QRL, version 2.0, is in development and has its own repositories. See [this discussion page](https://github.com/orgs/theQRL/discussions/2).

# QRL Block Explorer

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5ff0de0b5c1142a48732a2e07867e055)](https://app.codacy.com/gh/theQRL/block-explorer/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

Currently running at: [https://explorer.theqrl.org/](https://explorer.theqrl.org/)

## Dependencies

[Meteor](https://www.meteor.com/install)

## Install

	git clone https://github.com/theQRL/block-explorer.git
	cd block-explorer
	npm install
	meteor

## (Optional) Configuration

Edit `development.json`

## Run

	meteor

or

	meteor --settings development.json

## CI smoke test

The `Smoke test` workflow installs the existing lockfile, builds CSS and a Meteor
production bundle, then runs that bundle against a fresh MongoDB. It also runs
ESLint and audits both npm lockfiles. CI uses a digest-pinned Playwright image
with browsers and OS libraries preinstalled. Keep its version aligned with
`tests/smoke/package-lock.json`. Chromium checks
that the default public **testnet** nodes return synced status and a positive
height, and that `/status` and `/lastblocks` render that data without browser
exceptions. No credentials or private settings are needed. This is a live network
test: a testnet outage or blocked outbound gRPC can fail it. Failed runs retain
browser screenshots and traces for seven days.

Run the same checks locally (Node 26, Meteor 3.6, and MongoDB 8 on port 27017):

```sh
npm ci
npm ci --prefix tests/smoke
npm audit
npm audit --prefix tests/smoke
npm run lint
npm run build:css
meteor build ../block-explorer-build --directory --server-only
node .github/scripts/prepare-meteor-bundle.cjs ../block-explorer-build/bundle/programs/server
(cd ../block-explorer-build/bundle/programs/server && npm install --omit=dev && npm audit --omit=dev)
npm exec --prefix tests/smoke -- playwright install --with-deps chromium
npm test --prefix tests/smoke
actionlint
zizmor --persona=pedantic .github/workflows
```

`MONGO_URL` and `SMOKE_BUNDLE` can override the smoke test's database and bundle
path. The test starts and stops its own server on port 3100; it refuses to reuse an
existing server. Use a disposable database to avoid testing cached data.

With Docker and [act](https://github.com/nektos/act), run the workflow itself:

```sh
act push -j smoke -P ubuntu-24.04=ghcr.io/catthehacker/ubuntu:act-24.04
act workflow_dispatch -W .github/workflows/actionlint.yml -s GITHUB_TOKEN \
  -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-24.04
```

The actionlint wrapper needs a GitHub token under act (`-s GITHUB_TOKEN` reads it
from your environment or prompts). GitHub Actions supplies its own token.

On an ARM Linux VM, add `--container-architecture linux/arm64` to act. The
`Lint GitHub Actions` workflow uses actionlint and zizmor's pedantic audits, with
SHA-pinned actions, read-only repository permissions, and disabled checkout
credentials, following the same gates as `go-qrllib`.

The npm packages `lodash`, `pino`, and `pino-pretty` are production dependencies
required by the logger used by `pwix:blaze-layout` 2.4. Keep them in `dependencies`
so the production bundle can start. The npm Meteor installer version differs from
the framework release; CI explicitly installs the release in `.meteor/release`.

After `meteor build`, run the bundle preparation command above before installing
server dependencies. Meteor 3.6 generates separate bootstrap pins for Underscore
1.13.7 and Node-gyp 10.2.0, including vulnerable Tar dependencies. The preparation
script updates them to 1.13.8 and 13.1.0 respectively; CI audits and browser-tests
the resulting production bundle. The script rejects unfamiliar pins to avoid
silently downgrading a future Meteor release.
