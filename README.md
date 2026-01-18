# Cloud Code Editor

A production-ready, cloud-based code editor built with Next.js, Monaco Editor, and AI assistance. Code anywhere, on any device.

## Features

- **Cloud-Based**: Access your projects from anywhere, synced across devices
- **Monaco Editor**: The same powerful editor that powers VS Code
- **AI Assistant**: Intelligent code explanations, bug fixes, and generation
- **Live Preview**: Real-time preview for HTML/CSS/JS projects
- **Multi-Tab Editing**: Work on multiple files simultaneously
- **Secure Authentication**: Email/password + Google OAuth support
- **Dark/Light Themes**: Comfortable coding in any environment

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT + Google OAuth
- **AI**: OpenAI API (configurable for Groq or local models)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- (Optional) OpenAI API key for AI features
- (Optional) Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cloud-code-editor.git
   cd cloud-code-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/cloud_code_editor"
   JWT_SECRET="your-super-secret-key-min-32-chars"
   JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
   
   # Optional: AI
   OPENAI_API_KEY="sk-your-api-key"
   
   # Optional: Google OAuth
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # (Optional) Seed with demo data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the editor**
   
   Navigate to [http://localhost:3000](http://localhost:3000)
   
   Demo credentials (if seeded):
   - Email: `demo@cloudcode.dev`
   - Password: `demo123456`

## Project Structure

```
cloud-code-editor/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/         # Auth pages (login, register)
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── projects/   # Project CRUD
│   │   │   ├── files/      # File CRUD
│   │   │   ├── ai/         # AI assistant
│   │   │   └── preview/    # Live preview
│   │   ├── editor/         # Main editor page
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── ai/             # AI panel component
│   │   ├── editor/         # Editor components
│   │   ├── sidebar/        # File explorer
│   │   └── ui/             # Base UI components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/
│   │   ├── ai/             # AI provider integration
│   │   ├── auth/           # Authentication utilities
│   │   ├── db/             # Database client
│   │   ├── security/       # Rate limiting, sanitization
│   │   └── utils.ts        # Helper functions
│   └── types/              # TypeScript types
├── .env.example            # Environment template
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project with files
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Files
- `GET /api/files?projectId=xxx` - List files
- `POST /api/files` - Create file/folder
- `GET /api/files/[id]` - Get file content
- `PATCH /api/files/[id]` - Update file
- `DELETE /api/files/[id]` - Delete file

### AI
- `POST /api/ai` - Process AI request (explain, fix, generate, refactor)

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
# Dockerfile included in project
docker build -t cloud-code-editor .
docker run -p 3000:3000 --env-file .env cloud-code-editor
```

### Manual Deployment

```bash
npm run build
npm start
```

## Security Features

- **JWT Authentication**: Secure, stateless authentication
- **Rate Limiting**: Prevents abuse of API endpoints
- **Input Sanitization**: XSS protection with DOMPurify
- **Sandboxed Preview**: Code runs in isolated iframe
- **Workspace Isolation**: Users can only access their own projects
- **Secure Headers**: CSP, X-Frame-Options, etc.

## Configuration

### AI Providers

The editor supports multiple AI providers:

```env
# OpenAI (default)
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# Groq
AI_PROVIDER="groq"
GROQ_API_KEY="..."
GROQ_MODEL="mixtral-8x7b-32768"

# Local (Ollama)
AI_PROVIDER="local"
LOCAL_AI_URL="http://localhost:11434/v1"
LOCAL_AI_MODEL="codellama"
```

### File Restrictions

```env
ALLOWED_EXTENSIONS=".html,.css,.js,.json,.md,.ts,.tsx,.py,.jsx"
MAX_FILE_SIZE="5242880"  # 5MB
MAX_FILES_PER_PROJECT="100"
MAX_PROJECTS_PER_USER="20"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/cloud-code-editor/issues)
- Documentation: [Docs](https://docs.cloudcode.dev)
