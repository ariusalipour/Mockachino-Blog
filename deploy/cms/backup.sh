#!/bin/sh
set -eu
# Run from the directory holding compose.yml. Back up SQLite online with its API.
backup_root="${CMS_BACKUP_ROOT:-./backups}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="$backup_root/$stamp"
umask 077
mkdir -p "$backup_dir"
docker compose exec -T cms sqlite3 /data/payload.db '.backup /data/payload-backup.db'
docker compose cp cms:/data/payload-backup.db "$backup_dir/payload.db"
docker compose cp cms:/data/media "$backup_dir/media"
cp .env "$backup_dir/environment.env"
printf 'Backup saved to %s\n' "$backup_dir"
