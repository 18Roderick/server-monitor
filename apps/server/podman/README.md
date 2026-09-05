# Podman Quadlet setup

Systemd unit files for running ping-server rootless under Podman, as an alternative
to `docker-compose.yml`. Requires Podman >= 5.0.

## Files

- `ping-net.network` — the container network (equivalent to the compose `ping-net`).
- `ping-db-data.volume`, `ping-cache-data.volume` — named volumes for Postgres and Valkey.
- `ping-database.container` — Postgres 16.
- `ping-cache.container` — Valkey 9 (Redis-protocol-compatible cache/queue backend).
- `ping-node.build` — builds the app image from the repo's `Dockerfile` (`runtime` stage).
- `ping-node.container` — runs the app image, depends on the two containers above.

## Install

1. Edit `ping-node.build` (`SetWorkingDirectory=`) and `ping-node.container`
   (`EnvironmentFile=`) to point at the absolute path where this repo is checked out.
2. Copy all `.network`, `.volume`, `.build` and `.container` files into
   `~/.config/containers/systemd/` (rootless) or `/etc/containers/systemd/` (system-wide).
3. Reload and start:

   ```sh
   systemctl --user daemon-reload
   systemctl --user start ping-node.service
   ```

   Starting `ping-node.service` pulls in `ping-database.service` and `ping-cache.service`
   automatically via `Requires=`/`After=`.

4. Check status / logs:

   ```sh
   systemctl --user status ping-node.service
   journalctl --user -u ping-node.service -f
   ```

To enable on login/boot: `loginctl enable-linger $USER` (rootless) then the units start
automatically via `WantedBy=default.target`.
