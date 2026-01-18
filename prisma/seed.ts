import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@cloudcode.dev' },
    update: {},
    create: {
      email: 'demo@cloudcode.dev',
      name: 'Demo User',
      passwordHash,
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('Created demo user:', demoUser.email);

  // Create demo project
  const demoProject = await prisma.project.upsert({
    where: {
      userId_slug: {
        userId: demoUser.id,
        slug: 'hello-world',
      },
    },
    update: {},
    create: {
      name: 'Hello World',
      slug: 'hello-world',
      description: 'A simple starter project',
      userId: demoUser.id,
      language: 'javascript',
    },
  });

  console.log('Created demo project:', demoProject.name);

  // Create root folder
  const srcFolder = await prisma.file.upsert({
    where: {
      projectId_path: {
        projectId: demoProject.id,
        path: '/src',
      },
    },
    update: {},
    create: {
      name: 'src',
      path: '/src',
      type: 'FOLDER',
      projectId: demoProject.id,
    },
  });

  // Create demo files
  const indexHtml = await prisma.file.upsert({
    where: {
      projectId_path: {
        projectId: demoProject.id,
        path: '/index.html',
      },
    },
    update: {},
    create: {
      name: 'index.html',
      path: '/index.html',
      type: 'FILE',
      extension: '.html',
      mimeType: 'text/html',
      projectId: demoProject.id,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Hello, Cloud Code!</h1>
    <p>Start editing to see the magic happen.</p>
    <button id="clickMe">Click Me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
    },
  });

  const stylesCss = await prisma.file.upsert({
    where: {
      projectId_path: {
        projectId: demoProject.id,
        path: '/styles.css',
      },
    },
    update: {},
    create: {
      name: 'styles.css',
      path: '/styles.css',
      type: 'FILE',
      extension: '.css',
      mimeType: 'text/css',
      projectId: demoProject.id,
      content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.container {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #00d4ff, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

button {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #7b2cbf, #00d4ff);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
}

button:active {
  transform: translateY(0);
}`,
    },
  });

  const scriptJs = await prisma.file.upsert({
    where: {
      projectId_path: {
        projectId: demoProject.id,
        path: '/script.js',
      },
    },
    update: {},
    create: {
      name: 'script.js',
      path: '/script.js',
      type: 'FILE',
      extension: '.js',
      mimeType: 'application/javascript',
      projectId: demoProject.id,
      content: `// Welcome to Cloud Code Editor!
// This is a simple demo project.

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('clickMe');
  let clickCount = 0;

  button.addEventListener('click', () => {
    clickCount++;
    
    if (clickCount === 1) {
      button.textContent = 'Clicked 1 time!';
    } else {
      button.textContent = \`Clicked \${clickCount} times!\`;
    }
    
    // Add a fun animation
    button.style.transform = 'scale(1.1)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 100);
  });

  console.log('Cloud Code Editor - Ready!');
});`,
    },
  });

  // Create a file inside src folder
  const appJs = await prisma.file.upsert({
    where: {
      projectId_path: {
        projectId: demoProject.id,
        path: '/src/app.js',
      },
    },
    update: {},
    create: {
      name: 'app.js',
      path: '/src/app.js',
      type: 'FILE',
      extension: '.js',
      mimeType: 'application/javascript',
      projectId: demoProject.id,
      parentId: srcFolder.id,
      content: `/**
 * Main Application Module
 * This demonstrates modular code organization
 */

export class App {
  constructor(config = {}) {
    this.name = config.name || 'Cloud Code App';
    this.version = config.version || '1.0.0';
    this.debug = config.debug || false;
  }

  init() {
    if (this.debug) {
      console.log(\`Initializing \${this.name} v\${this.version}\`);
    }
    return this;
  }

  log(message) {
    if (this.debug) {
      console.log(\`[\${this.name}] \${message}\`);
    }
  }
}

export default new App({ debug: true });`,
    },
  });

  console.log('Created demo files:', [indexHtml.name, stylesCss.name, scriptJs.name, appJs.name]);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
