# SIHAT administrative completion steps

These actions deliberately require an administrator. They have not been run by the
deployment user and do not alter any other application.

```bash
set -a
source /home/dilovar/sihat/.env
set +a
sudo -u postgres psql -v ON_ERROR_STOP=1 \
  -v db_user="$POSTGRES_USER" -v db_password="$POSTGRES_PASSWORD" -v db_name="$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SQL

# Keep the user service alive after the SSH session ends.
sudo loginctl enable-linger dilovar

# Run schema migration and idempotent initial content seeding as the application user.
sudo -u dilovar bash -lc 'cd /home/dilovar/sihat && .venv/bin/alembic upgrade head && .venv/bin/python deploy/seed_initial_content.py'

sudo install -d -m 0755 /var/log/sihat
sudo install -m 0644 /home/dilovar/sihat/deploy/nginx/sihat.king.tj.conf /etc/nginx/sites-available/sihat
sudo ln -s /etc/nginx/sites-available/sihat /etc/nginx/sites-enabled/sihat
sudo nginx -t && sudo systemctl reload nginx
```

DNS for `sihat.king.tj` already points to this server. After the HTTP virtual host is
enabled, issue the certificate for that exact domain, then add the HTTPS virtual host
and HTTP-to-HTTPS redirect.

```bash
# Use a real operational email address; do not use a placeholder.
sudo certbot certonly --webroot -w /var/www/certbot -d sihat.king.tj --email YOUR_EMAIL --agree-tos --no-eff-email
sudo install -m 0644 /home/dilovar/sihat/deploy/nginx/sihat.king.tj.https.conf.template /etc/nginx/sites-available/sihat
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run
```
Before enabling the public virtual host, update `PASSWORD_RESET_URL` and
`ALLOWED_ORIGINS` in `/home/dilovar/sihat/.env` to the assigned HTTPS origin, then run
`systemctl --user restart sihat-api.service` as `dilovar`.
