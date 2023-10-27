### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `npm install` to install dependencies.
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.

### Docker

- After making changes, rebuild docker image and update version in docker compose: docker build . -f ./worker.Dockerfile -t temporal/worker:<version>
- In temporal-server: docker compose up
- In root for worker: docker compose -f docker-compose.worker.yml up

