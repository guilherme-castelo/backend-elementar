#!/bin/sh

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_FILE="${BACKUP_DIR}/elementar_${DATE}.sql"

# Check if environment variables are set
if [ -z "$MYSQL_HOST" ] || [ -z "$MYSQL_USER" ] || [ -z "$MYSQL_PASSWORD" ] || [ -z "$MYSQL_DATABASE" ]; then
  echo "Error: Required environment variables (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE) are not set."
  exit 1
fi

echo "Starting backup for database: $MYSQL_DATABASE at $DATE"

# mysqldump
mysqldump \
  -h "$MYSQL_HOST" \
  -u "$MYSQL_USER" \
  --password="$MYSQL_PASSWORD" \
  --no-tablespaces \
  "$MYSQL_DATABASE" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup created successfully: $BACKUP_FILE"
else
  echo "Error creating backup!"
  exit 1
fi

# Retention Policy: Delete files older than 7 days
echo "Cleaning up backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -delete
echo "Cleanup complete."
