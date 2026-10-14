# 🚀 DeployBuddy AI — AI-Powered Developer Troubleshooter

<img width="960" height="436" alt="Screenshot 2026-10-11 141624" src="https://github.com/user-attachments/assets/4032d13c-501e-4833-8de6-8654ebc93aac" />

DeployBuddy AI is an AI-powered developer troubleshooting application that transforms confusing deployment and runtime errors into understandable explanations, actionable troubleshooting steps, and useful terminal commands.

Designed for students, beginner developers, and early-career engineers, DeployBuddy AI combines generative AI with a beginner-friendly interface to make debugging a more approachable learning experience.

🔗 **Live Demo:** https://deploybuddy-ai.onrender.com

📖 **AWS Builder Center Article:** https://builder.aws.com/content/3KXYG8sJyFVIV0yMJnYtuNpGGmr/deploybuddy-ai-turning-complex-developer-errors-into-clear-actionable-fixes

💻 **GitHub Repository:** https://github.com/Abhinav7Turlapati/deploybuddy-ai

---


## 📌 Table of Contents

- Overview
- Problem Statement
- Key Features
- Technology Stack
- System Architecture
- How It Works
- Supported Error Categories
- AI Integration
- AWS Reference Architecture
- Security Considerations
- Testing and Validation
- Installation and Setup
- Environment Configuration
- Running the Application
- API Overview
- Deployment
- Limitations and Future Enhancements
- Learning Outcomes
- Author

---

## 🎯 Problem Statement

Software developers frequently encounter confusing errors during application development, containerization, orchestration, and CI/CD execution.

Examples include:

- Spring Boot applications failing because a port is already in use.
- Docker failing to connect to its daemon.
- Kubernetes workloads entering `CrashLoopBackOff`.
- Container images failing to pull.
- GitHub Actions workflows failing because of dependency or permission issues.

For beginners, interpreting these errors can require searching multiple documentation pages and piecing together solutions from different sources.

DeployBuddy AI aims to simplify this process by converting technical error output into structured, beginner-friendly explanations and practical troubleshooting guidance.

## ✨ Key Features

### 🤖 AI-Powered Error Diagnosis

Uses Google Gemini to analyze submitted error logs and generate troubleshooting guidance.

The diagnosis experience is designed to provide:

- An executive summary of the problem.
- Facts identified in the supplied error output.
- Possible root causes.
- Step-by-step troubleshooting instructions.
- Suggested terminal commands.
- Explanations of unfamiliar technical terminology.

### 🧑‍🏫 Follow-Up Mentoring

Users can ask follow-up questions about a diagnosis to explore possible causes and understand recommended fixes without restarting the entire troubleshooting process.

### 🧪 Real-World Error Examples

The interface includes example scenarios covering common development and deployment problems, including:

- Spring Boot port conflicts.
- Dependency injection errors.
- Docker daemon connection failures.
- Container architecture mismatches.
- Kubernetes resource and image-pull errors.
- GitHub Actions build and permission failures.

### 🧭 Beginner-Friendly Interface

The application organizes information into readable sections rather than presenting troubleshooting guidance as one large block of text.

Additional interface features include example categories, jargon explanations, a history interface, and an AWS reference-architecture view.

### 🛡️ Safety-Conscious Troubleshooting

Suggested commands are presented for the user to review. The application does not automatically execute generated terminal commands on the user's machine.

### ☁️ AWS Adapter Exploration

The project includes a configurable adapter for a proposed AWS-backed API integration. Its request and response handling has been tested using a local mock HTTP server.

**Important:** The adapter is not a live Amazon Bedrock or AWS Lambda integration. The current working AI diagnosis flow uses Google Gemini.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Programming language | TypeScript |
| Frontend tooling | Vite |
| Backend | Node.js, Express |
| Generative AI | Google Gemini |
| AWS exploration | Lambda and Amazon Bedrock reference architecture |
| Testing | Vitest and Supertest |
| Mock integration testing | Local mock HTTP API |
| Version control | Git and GitHub |
| Deployment | Render |

---

## 🏗️ System Architecture

DeployBuddy AI separates the user interface, server-side AI workflow, and optional external API integration.

```text
┌─────────────────────────────────────┐
│             User Interface          │
│           React + TypeScript        │
│                                     │
│  Error Input | Example Cards        │
│  Diagnosis   | Follow-up Chat       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Express Backend            │
│              Node.js                │
│                                     │
│  API Requests | Request Handling    │
│  Server-side AI Integration         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Google Gemini AI           │
│                                     │
│  Diagnosis and Follow-up Responses  │
└─────────────────────────────────────┘

Optional integration path:

┌─────────────────────────────────────┐
│       AWS Adapter / API Client      │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│      Configurable API Endpoint      │
│                                     │
│  Local Mock API used for testing    │
│  AWS architecture is a reference    │
└─────────────────────────────────────┘
```

The diagram describes the logical application flow. It does not represent a deployed AWS infrastructure diagram.

## ⚙️ How It Works

**Step 1 — Submit an error**

The user enters an error log or selects a predefined example from the interface.

**Step 2 — Process the request**

The frontend communicates with the Express backend, which handles the server-side request workflow.

**Step 3 — Generate a diagnosis**

The working Gemini integration analyzes the submitted information and generates troubleshooting guidance.

**Step 4 — Present actionable results**

The interface displays a structured diagnosis intended to help the user understand the problem and identify possible next steps.

**Step 5 — Continue learning**

The user can ask follow-up questions to clarify the diagnosis or explore the suggested solution.

---

## 🔍 Supported Error Categories

The application includes representative examples from the following technologies.

| Category | Example scenarios |
|---|---|
| Spring Boot | Port conflicts and dependency injection |
| Docker | Daemon connectivity and architecture mismatches |
| Kubernetes | Resource limits, crash loops, and image-pull failures |
| GitHub Actions | Dependency synchronization and permission errors |

These are example categories, not a guarantee that every error from these technologies can be diagnosed correctly.

## 🧠 AI Integration

Google Gemini is the working generative AI provider for diagnosis and follow-up conversations.

The backend reads the Gemini API key from an environment variable. This keeps the secret out of frontend source code and client-side bundles.

The application also includes a configurable adapter for an alternative backend endpoint. During development, a local mock server was used to exercise integration behavior and simulate successful and unsuccessful responses.

This separation helps explore alternative providers without claiming that a cloud integration is already deployed.

## ☁️ AWS Reference Architecture

DeployBuddy AI includes an AWS reference-architecture view to explore how an AWS-backed implementation could be organized.

The project explores a possible integration involving services such as:

- **AWS Lambda** — a potential serverless backend execution layer.
- **Amazon Bedrock** — a potential managed foundation-model integration layer.
- **API endpoint integration** — a configurable interface between the frontend adapter and a backend service.

These are architectural concepts explored by the project, not deployed components of the current live application.

The current working diagnosis path uses Google Gemini, and the AWS adapter was tested against a local mock API. A production AWS integration remains future work.

## 🔐 Security Considerations

Security was considered in the application's configuration and integration design.

- **Environment-based configuration:** API credentials are supplied through environment variables rather than hardcoded in frontend source.
- **Server-side AI calls:** The Gemini integration runs through the backend.
- **Secret handling:** The local `.env` file should remain excluded from version control.
- **Integration testing:** A mock endpoint allows the AWS adapter to be tested without requiring deployed cloud resources.
- **Command review:** Troubleshooting commands are displayed for user review instead of being executed automatically.

These measures reduce specific risks but do not constitute a complete security audit or guarantee production security.

## 🧪 Testing and Validation

During the recorded development verification, the project achieved the following results:

| Check | Recorded result |
|---|---|
| Automated tests | 32 passing tests across four test files |
| TypeScript / lint validation | Passed |
| Production frontend build | Passed |
| Gemini diagnosis request | Successful |
| Follow-up chat request | Successful |
| AWS adapter mock testing | Tested using a local mock API |

The recorded test results demonstrate the application's behavior during development. They are not a guarantee of the current deployment's availability or correctness after subsequent code changes.

To reproduce the checks, use the project's configured npm scripts and follow the instructions in the repository.

## 💻 Installation and Setup

### Prerequisites

Install the following tools:

- Node.js and npm compatible with the project dependencies.
- Git.
- A Google Gemini API key for live AI diagnosis.

### 1. Clone the Repository

```bash
git clone https://github.com/Abhinav7Turlapati/deploybuddy-ai.git

cd deploybuddy-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local `.env` file in the project root and configure the environment variables required by the application.

```env
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder with your own API key. Never commit the `.env` file or publish API credentials.

For optional adapter testing, configure the endpoint variable supported by the project:

```env
VITE_AWS_API_URL=http://localhost:YOUR_MOCK_PORT
```

Use the actual mock-server port and the variable expected by your local configuration. The adapter also supports `VITE_LAMBDA_API_URL` as described in the project implementation.

**Note:** Vite exposes variables prefixed with `VITE_` to client-side code. Never put secret credentials in those variables.

## ▶️ Running the Application

Use the scripts defined in `package.json`.

For the development workflow, the project has been configured to run the Express server with Vite middleware.

```bash
npm run dev
```

Open the local URL reported in the terminal.

To run automated tests:

```bash
npm test
```

To run lint validation:

```bash
npm run lint
```

To create a production frontend build:

```bash
npm run build
```

For the most accurate setup instructions, check the current repository scripts and configuration files.

## 🌐 API Overview

The backend exposes application endpoints for diagnosis, follow-up conversations, and provider status.

| Endpoint | Purpose |
|---|---|
| `GET /api/status` | Reports the configured AI provider status |
| `POST /api/diagnose` | Requests an AI-powered diagnosis |
| `POST /api/chat` | Sends a follow-up mentoring request |

These endpoints describe the application interface used during development. Request fields and response schemas should be taken from the current server implementation.

## 🚀 Live Deployment

The application is hosted on Render.

**Try DeployBuddy AI:** https://deploybuddy-ai.onrender.com

The free hosting plan may spin down after periods of inactivity, so the first request after a period of inactivity may take longer to respond.

For source code, issues, and implementation details, visit the public repository:

https://github.com/Abhinav7Turlapati/deploybuddy-ai

## 🛣️ Limitations and Future Enhancements

Potential future improvements include:

- Implementing and validating a real AWS Lambda and Amazon Bedrock integration.
- Expanding the number and variety of supported error scenarios.
- Improving diagnosis quality through broader testing and evaluation.
- Adding additional provider integrations through a consistent backend interface.
- Improving automated evaluation of diagnosis accuracy and troubleshooting usefulness.
- Expanding API and integration test coverage.
- Improving accessibility and the user experience for beginners.

These are potential enhancements, not claims about functionality already implemented.

## 📚 Learning Outcomes

Developing DeployBuddy AI provided hands-on experience with:

- Building a full-stack application using React, TypeScript, Node.js, and Express.
- Integrating a generative AI service into a practical developer tool.
- Designing a structured troubleshooting experience.
- Testing backend endpoints and adapter behavior.
- Using mock APIs to validate integration boundaries.
- Managing environment-based configuration and API credentials.
- Building, testing, and deploying a web application.
- Exploring AWS serverless and managed AI architecture concepts.
  
 ![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Used-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?logo=googlegemini&logoColor=white)
![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?logo=render&logoColor=black)

## 👨‍💻 Author

**Abhinav Turlapati**

Computer Science Engineering student interested in AI, cloud computing, full-stack development, and DevOps.

- **GitHub:** https://github.com/Abhinav7Turlapati
- **LinkedIn:** https://www.linkedin.com/in/abhinav-turlapati5995/

## 📖 Featured Article

Read the project story on AWS Builder Center:

**DeployBuddy AI: Turning Complex Developer Errors into Clear, Actionable Fixes**

https://builder.aws.com/content/3KXYG8sJyFVIV0yMJnYtuNpGGmr/deploybuddy-ai-turning-complex-developer-errors-into-clear-actionable-fixes

---

*DeployBuddy AI is a learning and developer-tool project. AI-generated troubleshooting suggestions may be incorrect and should be reviewed before use.*
