# Snoopy

Snoopy is a disposable Codex development workbench. Codex runs inside a Docker
container with the repo mounted at `/workspace`.

The default container is intentionally useful for development while still
avoiding broad host access:

- mounted: this repo, Codex state volume, cache volume
- enabled by default: GPU access
- not mounted: host home directory, SSH keys, Docker socket
- not enabled: privileged mode or extra mount namespace control

## Start Codex

```bash
./codex-workbench.sh
```

The first run may ask for a Codex device code. After login, auth is stored in
the Docker volume `snoopy_codex_home`, so it should persist across normal runs.

You may need to log in again if you delete volumes, use a different Compose
project name, revoke auth, or run `docker compose down -v`.

## Start a Shell

```bash
./codex-workbench.sh shell
```

Run a one-off command inside the workbench:

```bash
./codex-workbench.sh shell -lc 'codex --version && nvidia-smi'
```

## Rebuild

The launcher builds the image if it is missing. Force a rebuild after changing
the Dockerfile:

```bash
CODEX_WORKBENCH_BUILD=1 ./codex-workbench.sh shell
```

## API Key Option

Device-code login is the normal interactive path. For a one-off API-key run:

```bash
OPENAI_API_KEY=... ./codex-workbench.sh
```

## Security Notes

The container is the security boundary. Codex runs inside the container with:

```bash
codex --sandbox danger-full-access
```

That gives Codex full access inside `/workspace`, not to the host filesystem.
Keep the Docker socket out of this setup unless you intentionally want to grant
near-host-root power. Treat `privileged: true`, `CAP_SYS_ADMIN`, and broad mount
namespace control the same way.
