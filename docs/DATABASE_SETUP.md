# Database Infrastructure (Step 3)

TaskFlow now runs as two containers on a private Docker network: the app and MongoDB. The database is intentionally **not** published to the host — only containers on `taskflow-net` can reach it.

## One-time setup

```bash
# Custom network so the app and db can resolve each other by name
docker network create taskflow-net

# Named volume so MongoDB's data survives container removal
docker volume create taskflow-db-data
```

## Start MongoDB

```bash
docker run -d --name taskflow-db \
  --network taskflow-net \
  -v taskflow-db-data:/data/db \
  mongo:8.0.15
```

No `-p` flag: the database is reachable only from containers on `taskflow-net`, not from the host.

## Build and run TaskFlow

```bash
docker build -t taskflow:2.0 .

docker run -d --name taskflow-app \
  --network taskflow-net \
  -p 3000:3000 \
  -e DB_HOST=taskflow-db \
  -e DB_NAME=taskflow \
  taskflow:2.0
```

`DB_HOST=taskflow-db` works because Docker's embedded DNS resolves container names to IPs for containers on the same user-defined network.

## Verify

```bash
docker logs taskflow-app
# Should eventually show: "MongoDB connected: taskflow-db:27017/taskflow"
# A few "MongoDB not ready" lines first is normal - the app retries
# every 3s while the database finishes starting up.
```

Open http://localhost:3000 and create a few tasks.

## Inspecting the data (optional)

```bash
docker exec -it taskflow-db mongosh
use taskflow
db.tasks.find()
exit
```
