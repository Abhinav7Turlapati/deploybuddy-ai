import { ExampleError } from '../types/diagnosis';

export const EXAMPLE_ERRORS: ExampleError[] = [
  // --- Spring Boot ---
  {
    id: 'spring-port-8080',
    name: 'Port 8080 Already in Use',
    category: 'spring-boot',
    categoryLabel: 'Spring Boot',
    badge: 'Port Conflict',
    description: 'Tomcat fails to bind because an old Java process or local service is running.',
    snippet: `***************************
APPLICATION FAILED TO START
***************************

Description:

Web server failed to start. Port 8080 was already in use.

Action:

Identify and stop the process that's listening on port 8080 or configure this application to listen on another port.

2026-10-09 14:22:01.312 ERROR 19482 --- [           main] o.s.b.d.LoggingFailureAnalysisReporter   : 
org.springframework.boot.web.server.PortInUseException: Port 8080 is already in use
\tat org.springframework.boot.web.embedded.tomcat.TomcatWebServer.start(TomcatWebServer.java:241)
\tat org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.startWebServer(ServletWebServerApplicationContext.java:318)
\tat org.springframework.context.support.DefaultLifecycleProcessor.doStart(DefaultLifecycleProcessor.java:178)`,
    previewNote: 'Common when re-running Spring Boot while the previous instance is still running in the background.'
  },
  {
    id: 'spring-missing-bean',
    name: 'NoSuchBeanDefinitionException',
    category: 'spring-boot',
    categoryLabel: 'Spring Boot',
    badge: 'Dependency Injection',
    description: 'Spring cannot find a qualifying bean to inject into your Service or Controller.',
    snippet: `***************************
APPLICATION FAILED TO START
***************************

Description:

Field userRepository in com.example.shop.service.UserService required a bean of type 'com.example.shop.repository.UserRepository' that could not be found.

The injection point has the following annotations:
\t- @org.springframework.beans.factory.annotation.Autowired(required=true)

Action:

Consider defining a bean of type 'com.example.shop.repository.UserRepository' in your configuration.

2026-10-09 11:04:15.820 ERROR 8421 --- [           main] o.s.b.d.LoggingFailureAnalysisReporter   : 
org.springframework.beans.factory.NoSuchBeanDefinitionException: No qualifying bean of type 'com.example.shop.repository.UserRepository' available`,
    previewNote: 'Usually caused by a missing @Repository annotation or being outside Spring’s @ComponentScan package tree.'
  },

  // --- Docker ---
  {
    id: 'docker-daemon-offline',
    name: 'Cannot Connect to Docker Daemon',
    category: 'docker',
    categoryLabel: 'Docker',
    badge: 'Socket / Engine',
    description: 'Docker CLI cannot reach the background dockerd service.',
    snippet: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Error: failed to create container: exit status 1
FATA[0000] exit status 1

[docker-compose] Error response from daemon: Bad response from Docker engine: 500
dial unix /var/run/docker.sock: connect: no such file or directory`,
    previewNote: 'Happens when Docker Desktop isn’t started yet or your user account lacks permissions to docker.sock.'
  },
  {
    id: 'docker-exec-format-error',
    name: 'exec user process: exec format error',
    category: 'docker',
    categoryLabel: 'Docker',
    badge: 'Architecture Mismatch',
    description: 'Container binary compiled for ARM64 trying to run on AMD64 (or vice versa).',
    snippet: `standard_init_linux.go:228: exec user process caused: exec format error
[2026-10-09 18:02:11] Container app-backend-1 exited with code 139
docker: Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: runc create failed: expected cgroups path: unknown
OCI runtime exec failed: exec failed: unable to start container process: exec: "./entrypoint.sh": exec format error`,
    previewNote: 'Super common when building an image on an Apple Silicon (M1/M2/M3) Mac and deploying to standard Linux x86 cloud hosts.'
  },

  // --- Kubernetes ---
  {
    id: 'k8s-oomkilled',
    name: 'CrashLoopBackOff: OOMKilled (Exit 137)',
    category: 'kubernetes',
    categoryLabel: 'Kubernetes',
    badge: 'Resource Limit',
    description: 'Linux kernel terminated the pod container for exceeding memory limits.',
    snippet: `NAME                                READY   STATUS             RESTARTS      AGE
payment-service-789cf9447d-xk92p    0/1     CrashLoopBackOff   5 (2m ago)    11m

Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Pulled     2m45s (x5 over 11m) kubelet            Container image "registry.internal/payment:v1.4" already present
  Normal   Created    2m44s (x5 over 11m) kubelet            Created container payment
  Normal   Started    2m44s (x5 over 11m) kubelet            Started container payment
  Warning  BackOff    100s (x8 over 10m) kubelet            Back-off restarting failed container
  Last State:          Terminated
      Reason:          OOMKilled
      Exit Code:       137
      Started:         Fri, 09 Oct 2026 14:10:02 -0700
      Finished:        Fri, 09 Oct 2026 14:10:29 -0700`,
    previewNote: 'Exit Code 137 is 128 + 9 (SIGKILL). The Linux OOM killer terminated the app because it asked for more memory than resources.limits.memory allowed.'
  },
  {
    id: 'k8s-imagepullbackoff',
    name: 'ImagePullBackOff / ErrImagePull',
    category: 'kubernetes',
    categoryLabel: 'Kubernetes',
    badge: 'Registry / Image',
    description: 'Kubelet cannot download the container image due to typo or missing imagePullSecrets.',
    snippet: `NAME                              READY   STATUS             RESTARTS   AGE
analytics-worker-5c74776fd-q8bvx   0/1     ImagePullBackOff   0          4m12s

Events:
  Type     Reason   Age                    From               Message
  ----     ------   ----                   ----               -------
  Normal   Scheduled 4m12s                  default-scheduler  Successfully assigned default/analytics-worker to node-pool-2
  Normal   Pulling   2m30s (x4 over 4m11s)  kubelet            Pulling image "ghcr.io/acme-corp/analytics-worker:v2.4.9"
  Warning  Failed    2m28s (x4 over 4m9s)   kubelet            Failed to pull image "ghcr.io/acme-corp/analytics-worker:v2.4.9": rpc error: code = NotFound desc = failed to pull and unpack image: not found
  Warning  Failed    2m28s (x4 over 4m9s)   kubelet            Error: ErrImagePull
  Normal   BackOff   2m14s (x6 over 4m8s)   kubelet            Back-off pulling image "ghcr.io/acme-corp/analytics-worker:v2.4.9"
  Warning  Failed    2m14s (x6 over 4m8s)   kubelet            Error: ImagePullBackOff`,
    previewNote: 'Usually a typo in the image tag (v2.4.9 instead of 2.4.9) or a private registry lacking Kubernetes imagePullSecrets.'
  },

  // --- GitHub Actions ---
  {
    id: 'gha-npm-ci-lockfile',
    name: 'npm ci lockfile desync (Exit Code 1)',
    category: 'github-actions',
    categoryLabel: 'GitHub Actions',
    badge: 'CI Build Failure',
    description: 'npm ci fails because package.json and package-lock.json are out of sync.',
    snippet: `Run npm ci
npm error code EUSAGE
npm error 
npm error \`npm ci\` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Please update your lock file with \`npm install\` before running \`npm ci\`.
npm error 
npm error Missing: @types/node@^22.14.0 from lock file
npm error 
npm error A complete log of this run can be found in:
npm error     /home/runner/.npm/_logs/2026-10-09T18_20_11_290Z-eresolve.log
Error: Process completed with exit code 1.`,
    previewNote: 'Happens when a developer edits package.json directly or installs a package locally with a different npm version without committing package-lock.json.'
  },
  {
    id: 'gha-permission-denied',
    name: 'Resource not accessible by integration (403)',
    category: 'github-actions',
    categoryLabel: 'GitHub Actions',
    badge: 'GitHub Token Permissions',
    description: 'The automated GITHUB_TOKEN has default read-only permissions and was denied write access.',
    snippet: `Run softprops/action-gh-release@v1
  with:
    files: dist/*.tar.gz
    tag_name: v1.0.4
  env:
    GITHUB_TOKEN: ***
GraphQL error: Resource not accessible by integration
HttpError: Resource not accessible by integration
    at /home/runner/work/_actions/softprops/action-gh-release/v1/dist/index.js:8471:17
    at processTicksAndRejections (node:internal/process/task_queues:95:5) {
  status: 403,
  response: {
    data: {
      message: 'Resource not accessible by integration',
      documentation_url: 'https://docs.github.com/rest/overview/permissions-required-for-github-apps'
    }
  }
}
Error: Process completed with exit code 1.`,
    previewNote: 'GitHub recently made default repository GITHUB_TOKEN permissions read-only. Workflows creating releases or tags need explicit permissions in YAML.'
  }
];
