# SokoTally

SokoTally is an AI-powered bookkeeping and business-management application for
informal vegetable vendors and small businesses. It helps users record and
understand day-to-day business activity without requiring accounting expertise.
Users can capture sales, expenses, debts, loans, stock movements, and other
transactions using natural-language input in English or Kiswahili.

The application extracts structured transaction information from conversational
input, stores it securely, and turns it into useful dashboards, reports, and
business insights. It also includes inventory management, debt tracking,
financial analytics, AI assistance, downloadable reports, authentication, and
an administrative monitoring area.

## Features

- Record sales, expenses, loans, and debts using natural language.
- Support English and Kiswahili transaction descriptions.
- Automatically extract transaction details with configurable AI providers.
- View dashboards with sales, expenses, profit, and transaction summaries.
- Manage stock, inventory levels, stock movements, and low-stock alerts.
- Track customers and outstanding debts.
- Generate financial, PDF, and spreadsheet reports.
- Use the Soko Assistant for business questions and financial queries.
- Receive real-time updates through Socket.IO.
- Manage user accounts, feature toggles, usage analytics, fraud flags, and
  system health as an administrator.
- Switch between light and dark themes.

## Technology stack

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Chart.js
- Axios
- Socket.IO Client

### Backend

- Node.js and Express
- MongoDB with Mongoose
- JSON Web Token authentication
- Socket.IO
- Cloudinary for media uploads
- Optional AI, speech-to-text, and text-to-speech providers

## Run SokoTally locally

### Prerequisites

Install the following before starting:

- [Node.js](https://nodejs.org/) 18 or newer
- npm
- [MongoDB](https://www.mongodb.com/docs/manual/installation/) running
  locally, or a MongoDB Atlas connection string
- An optional API key for the AI provider you want to use

### 1. Download the project

Clone the repository and enter its directory:

```bash
git clone https://github.com/Mark-Muuo/Sokotally.git
cd Sokotally
```

You can also download the source from the repository page by selecting
**Code > Download ZIP**, then extracting the downloaded archive.

### 2. Install dependencies

Install the backend and frontend dependencies separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure the backend

Create `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/sokotally
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret

# Optional media uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional AI configuration
LLM_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant

# Optional alternatives
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

At minimum, provide a reachable MongoDB instance and a strong `JWT_SECRET`.
AI-related keys are only required for the corresponding AI features.

### 4. Configure the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

The frontend defaults to `http://localhost:4000` if these values are omitted.

### 5. Start the application

Open two terminal windows.

In the first terminal, start the API:

```bash
cd backend
npm run dev
```

In the second terminal, start the frontend:

```bash
cd frontend
npm run dev
```

Open the URL printed by Vite, normally
[http://localhost:5173](http://localhost:5173). The backend health endpoint is
available at [http://localhost:4000/health](http://localhost:4000/health).

For a production-style frontend build:

```bash
cd frontend
npm run build
npm run preview
```

## Deploying the frontend

The `frontend` directory includes a `vercel.json` rewrite configuration for
client-side routing. To deploy with Vercel:

1. Import the repository into [Vercel](https://vercel.com/).
2. Set the project root to `frontend`.
3. Use `npm run build` as the build command.
4. Use `dist` as the output directory.
5. Set `VITE_API_URL` and `VITE_SOCKET_URL` to the public backend URL.

The backend must be deployed separately to a Node.js-compatible hosting
provider, with MongoDB and the required environment variables configured.
Set the backend's `FRONTEND_URL` to the deployed frontend URL.

## Project structure

```text
Sokotally/
├── frontend/       # React/Vite user interface
├── backend/        # Express API, authentication, AI, and database logic
├── frontend/.env   # Local frontend configuration (not committed)
└── backend/.env    # Local backend configuration (not committed)
```

## Useful commands

| Location | Command | Purpose |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run build` | Create a production frontend build |
| `frontend` | `npm run lint` | Run frontend linting |
| `frontend` | `npm run preview` | Preview the production build |
| `backend` | `npm run dev` | Start the API with Nodemon |
| `backend` | `npm start` | Start the API normally |

## Security notes

- Never commit `.env` files, API keys, JWT secrets, or database credentials.
- Use a unique, long random value for `JWT_SECRET` in production.
- Restrict CORS and configure secure HTTPS URLs before production deployment.
- Use separate development and production databases.

## Contributing

Create a feature branch, make focused changes, run the relevant frontend
lint/build checks, and open a pull request describing the change.

## License

No project license has been specified yet.
