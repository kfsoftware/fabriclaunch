---
sidebar_position: 2
---

# Using Docker Compose

## Prerequisites:

1. Ensure Docker and Docker Compose are installed on your system.
2. Git should be installed to clone the repository.

## Step-by-step Instructions:

1. Clone the repository:
   ```bash
   git clone https://github.com/kfsoftware/fabriclaunch.git
   cd fabriclaunch
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and fill in the required values:
   - `AUTH_SECRET` is already set, but you can generate a new one with:
     ```bash
     openssl rand -hex 32
     ```
   - Set `PASSWORD_SALT` (you can use the same method as `AUTH_SECRET`)
   - Add your GitHub OAuth credentials for `GH_CLIENT_ID` and `GH_CLIENT_SECRET`
   - Add your Resend API key for `RESEND_API_KEY`

3. Build the Docker images:
   ```bash
   docker-compose build
   ```

4. Start the services:
   ```bash
   docker-compose up
   ```
   Or in detached mode:
   ```bash
   docker-compose up -d
   ```

5. Wait for the services to start up. You should see logs indicating that the services are ready.

6. Open a web browser and navigate to:
   ```
   http://localhost:3000/dashboard
   ```

7. If everything is working correctly, you should see the dashboard of your FabricLaunch application.

## Troubleshooting:

- Check Docker logs:
  ```bash
  docker-compose logs
  ```
- Check logs for a specific service:
  ```bash
  docker-compose logs web
  ```
- Ensure ports 3000, 5432, 9000, and 9001 are not in use by other applications.
- If you make changes, rebuild the images:
  ```bash
  docker-compose build
  docker-compose up
  ```

## Platform-specific notes:

- Windows: Use PowerShell or Command Prompt. Ensure Docker Desktop is running.
- Mac: Use Terminal. Ensure Docker Desktop is running.
- Linux: You might need to use `sudo` before docker commands, depending on your setup.

## Stopping the services:

```bash
docker-compose down
```
To remove volumes as well:
```bash
docker-compose down -v
```

By following these steps, you should be able to launch FabricLaunch on any machine (Linux, Windows, or Mac) and access the dashboard at http://localhost:3000/dashboard to verify that it's working correctly.
