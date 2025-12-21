## Setup for development
Requirements:
 - Docker
 - dotenvx

For Windows development, it is recommended to use WSL2 with a Linux distribution, and clone the repository inside it. This allows to use file watching instead of polling.

1. Clone this repository
2. Install precommit hook:
``` bash
    dotenvx ext precommit --install
```
3. Create a .env.keys file in the root directory and add your encryption key (use the `.env.keys.example` template)
4. Decrypt the .env file:  

Linux or MacOS:
``` bash
    dotenvx decrypt -f .env.development --stdout >.env
``` 
Windows (PowerShell):
``` powershell
   dotenvx decrypt -f .env.development --stdout | Set-Content .env -Encoding UTF8
```

5. If using windows (outside of WSL), set `POLLING=true` in the .env file

6. Start the Docker containers:
``` bash
    docker compose -f compose.dev.yaml up -d --build
```

After changing the .env.development file, run:
``` bash
    dotenvx encrypt -f .env.development
```

## Development URLs
Main server: http://localhost:8080 (through nginx, needed for assets to work properly)  
Direct connection to web server: http://localhost:3000  
Prisma studio: http://localhost:5555

## Commands
To run commands inside a container (e.g. `worker`, `web`) , use:
``` bash
    docker compose exec <container> <command>
```

To create a migration, use:
``` bash
    docker compose -f compose.dev.yaml run --rm -w /app/packages/db dev-init pnpm exec prisma migrate dev
```