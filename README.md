# DeployBuddy AI 🚀

**Turn confusing developer errors into clear, actionable fixes.**

DeployBuddy AI is an AI-powered troubleshooting assistant that helps students and early-career developers understand technical errors, identify possible causes, and find practical solutions.

## ✨ Features

- **AI-powered diagnosis:** Analyze technical errors and receive explanations in beginner-friendly language.
- **Actionable fixes:** Get troubleshooting steps and suggested terminal commands.
- **Follow-up chat:** Ask additional questions to understand a diagnosis.
- **Example errors:** Explore sample developer errors to learn troubleshooting techniques.
- **Diagnostic history:** Review previous troubleshooting sessions.
- **AWS adapter testing:** Test AWS-style API integration behavior using a local mock API.

## 🛠️ Tech Stack

- React
- TypeScript
- Vite
- Node.js and Express
- Google Gemini API
- Vitest

## ⚙️ Run Locally

### Prerequisites

- Node.js and npm
- A Google Gemini API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Abhinav7Turlapati/deploybuddy-ai.git
   cd deploybuddy-ai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file using `.env.example` as a reference, and configure your `GEMINI_API_KEY`.

4. Start the application using the development command configured in `package.json`:

   ```bash
   npm run dev
   ```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run the TypeScript checks:

```bash
npm run lint
```

Build the application:

```bash
npm run build
```

## ☁️ AWS Integration Status

The project includes an AWS-style API adapter and a local mock server for testing integration behavior. The mock setup helps validate successful responses, HTTP errors, malformed responses, and CORS behavior.

**Important:** The current version uses Google Gemini for actual AI diagnosis. The AWS adapter has been tested locally with a mock API; a real AWS Bedrock or Lambda deployment is not yet configured.

## 🎯 Who Is It For?

- Students learning software development
- Beginner developers debugging errors
- Developers exploring Docker, Kubernetes, Spring Boot, and CI/CD
- Anyone who wants technical errors explained more clearly

## 👨‍💻 Author

**Abhinav Turlapati**

[GitHub Profile](https://github.com/Abhinav7Turlapati)

---

*Built to make debugging less intimidating and learning more practical.*
