# How to Update the Database (Run Migrations) on Render

If `/api/v1/notebooks` returns 500, the **Notebooks** and **NotebookPages** tables are usually missing. Follow one of the two options below to apply migrations.

---

## Option A: Run migrations from your computer (one-time, recommended)

This applies migrations directly to your Render PostgreSQL database using the connection string from Render.

### Step 1: Get the database connection string from Render

1. Log in to [Render](https://dashboard.render.com).
2. Open your **PostgreSQL** service (e.g. `asidenote-db-prod` or the one linked to your API).
3. In the **Connections** section, copy **External Database URL** (or **Internal Database URL** if you run the command from a Render Shell — see Option B below).
   - It looks like: `postgres://user:password@hostname/database?sslmode=require`
   - If you use **External**, ensure **Allow connections from anywhere** (or your IP) is enabled under **Security** if required.

### Step 2: Run migrations from your machine

1. Open a terminal and go to the backend folder:
   ```bash
   cd Source/backend
   ```
   (From the repo root: `cd d:\Projects\ASideNote` then `cd Source\backend`.)

2. Set the connection string and run the migrate-only command.

   **Windows (PowerShell):**
   ```powershell
   $env:DATABASE_URL = "postgres://USER:PASSWORD@HOST/DATABASE?sslmode=require"
   dotnet run --project src/TableWorks.API/ASideNote.API.csproj -- --migrate
   ```
   Replace the value of `$env:DATABASE_URL` with the URL you copied from Render (keep the quotes).

   **Windows (Command Prompt):**
   ```cmd
   set DATABASE_URL=postgres://USER:PASSWORD@HOST/DATABASE?sslmode=require
   dotnet run --project src/TableWorks.API/ASideNote.API.csproj -- --migrate
   ```

   **Mac / Linux:**
   ```bash
   export DATABASE_URL="postgres://USER:PASSWORD@HOST/DATABASE?sslmode=require"
   dotnet run --project src/TableWorks.API/ASideNote.API.csproj -- --migrate
   ```

3. Check the output. You should see something like:
   ```
   Applying 1 pending migration(s): 20260215120000_AddNotebooksAndNotebookPages
   All migrations applied successfully.
   ```
   If you see **No pending migrations**, the database was already up to date.

4. Clear the env var (optional):
   - PowerShell: `Remove-Item Env:DATABASE_URL`
   - Cmd: `set DATABASE_URL=`
   - Bash: `unset DATABASE_URL`

### Step 3: Confirm the API is using the same database

1. In Render, open your **API** web service.
2. Go to **Environment** and check that **INTERNAL_DATABASE_URL** or **DATABASE_URL** is set (usually automatic when the Postgres service is linked).
3. If you used the **External** URL in Step 2, the API will use the **Internal** URL; both point to the same database, so the tables you just created are the ones the API uses.

After this, reload the app and try the notebooks endpoints again; the 500s should stop if the only issue was missing tables.

---

## Option B: Ensure migrations run when the API container starts (Docker)

Your API Docker image should run migrations on every container start via `entrypoint.sh`. Use this to confirm it’s set up and running.

### Step 1: Confirm the entrypoint is in the image

1. In the repo, check that these exist and are committed:
   - `Source/backend/entrypoint.sh`
   - `Source/backend/Dockerfile` with something like:
     ```dockerfile
     COPY entrypoint.sh /app/publish/entrypoint.sh
     ...
     ENTRYPOINT ["/app/entrypoint.sh"]
     ```
2. Push to the branch Render deploys (e.g. `main`).

### Step 2: Trigger a new deploy

1. In Render, open your **API** web service.
2. Click **Manual Deploy** → **Deploy latest commit** (or push a small change and wait for auto-deploy).

### Step 3: Check logs to see if migrations ran

1. In the API service, open the **Logs** tab.
2. For the **latest** deploy, look for lines like:
   - `Running database migrations...`
   - `No pending migrations. Database is up to date.` or `All migrations applied successfully.`
   - `Migrations complete. Starting API.`
3. If you see **Migrations failed...**, the container could not reach the database. Then:
   - Confirm the API service is **linked** to the Postgres service (so **INTERNAL_DATABASE_URL** is set).
   - In **Environment**, check that **INTERNAL_DATABASE_URL** (or **DATABASE_URL**) is present and not empty.

### Step 4: If the entrypoint is not running

- If logs show no “Running database migrations...” line, the running image may be an older one without the entrypoint.
- Ensure the Dockerfile and `entrypoint.sh` are on the branch that Render builds, then do **Step 2** again and recheck logs.
- As a one-time fix, use **Option A** to run migrations from your computer.

---

## Verify the Notebooks table exists (optional)

If you have a PostgreSQL client (psql, DBeaver, etc.) and the **External** connection string:

1. Connect using the same URL you used in Option A Step 2.
2. Run:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name IN ('Notebooks', 'NotebookPages');
   ```
3. You should see both `Notebooks` and `NotebookPages`. If not, run **Option A** again and recheck.

---

## Summary

| Goal                         | What to do |
|-----------------------------|------------|
| Fix 500 on notebooks now    | Use **Option A**: get External Database URL from Render, set `DATABASE_URL`, run `dotnet run ... -- --migrate` from `Source/backend`. |
| Make future deploys migrate | Use **Option B**: ensure `entrypoint.sh` and Dockerfile are in the repo and deployed, then check logs for “Migrations complete”. |
| Confirm tables exist        | Connect to the DB with the same URL and run the `information_schema` query above. |
