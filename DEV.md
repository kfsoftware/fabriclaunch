## Running the Web Interface

To run the web interface located in the `./apps/web` directory using Bun, follow these steps:

1. Ensure you have Bun installed on your system. If not, you can install it by following the instructions at https://bun.sh/

2. Navigate to the web application directory:
```
cd ./apps/web
```

3. Install dependencies (if not already done):
```
bun install
```

4. Set up the environment variables:
- Copy the `.env.example` file to create a new `.env` file:
```
cp .env.example .env
```
- Open the `.env` file in a text editor and update the values as needed:
	- Set `AUTH_SECRET` to a secure random string (keep the example value for development only)
	- Update `AUTH_DRIZZLE_URL` and `POSTGRES_URL` with your PostgreSQL connection details
	- Set `PASSWORD_SALT` to a secure random string
	- Add your GitHub OAuth credentials for `GH_CLIENT_ID` and `GH_CLIENT_SECRET`
	- Set `RESEND_API_KEY` to your Resend API key
	- Configure MinIO settings (`MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, etc.) as per your setup

Note: Ensure you keep sensitive information secure and do not commit the `.env` file to version control.


4. Start the development server:
```
bun run dev
```

5. Open your web browser and visit `http://localhost:3000` (or the port specified in the console output).

For production deployment:

1. Build the application:
```
bun run build
```

2. Start the production server:
```
bun start
```

Note: Make sure to update any scripts in your `package.json` to use Bun instead of npm or Node.js if necessary.

Remember to set any necessary environment variables before running the application in production.

