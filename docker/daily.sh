#!/bin/sh
# Runs inside the `daily` container (docker-compose.yml). Every day at 13:00 UTC
# it calls the scheduled-reports route (the job Vercel Cron used to trigger) and
# then writes a dated archive of the documents volume to /backups, keeping the
# last BACKUP_KEEP_DAYS days.
set -u

while :; do
  now=$(date -u +%s)
  next=$(( now - now % 86400 + 13 * 3600 ))
  [ "$next" -le "$now" ] && next=$(( next + 86400 ))
  sleep $(( next - now ))

  echo "$(date -u +%FT%TZ) sending scheduled reports"
  wget -q -T 120 -O - --header "Authorization: Bearer $CRON_SECRET" \
    http://app:3000/api/cron/send-scheduled-reports || echo "scheduled reports call FAILED"
  echo

  backup="/backups/documents-$(date -u +%F).tar.gz"
  if tar -czf "$backup.partial" -C /data/documents . && mv "$backup.partial" "$backup"; then
    echo "$(date -u +%FT%TZ) backup written: $backup"
  else
    rm -f "$backup.partial"
    echo "$(date -u +%FT%TZ) backup FAILED"
  fi
  find /backups -name 'documents-*.tar.gz' -mtime +"$BACKUP_KEEP_DAYS" -delete
done
