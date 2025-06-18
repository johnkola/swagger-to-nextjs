# 🚀 Swagger-to-Next.js Generator

Transform your OpenAPI/Swagger specifications into fully functional Next.js 14+ applications with beautiful DaisyUI components in seconds!

[![npm version](https://img.shields.io/npm/v/@yourapp/swagger-to-nextjs.svg)](https://www.npmjs.com/package/@yourapp/swagger-to-nextjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org)
[![ES Modules](https://img.shields.io/badge/ES%20Modules-Native-blue)](https://nodejs.org/api/esm.html)

## 🎯 What is this?

This CLI tool takes your OpenAPI specification (YAML or JSON) and generates a complete, production-ready Next.js 14+ application with:

- 📘 **TypeScript types** derived from your API schemas
- 🛣️ **API routes** with full type safety
- 📦 **API client library** with typed fetch functions
- 🎨 **UI components** styled with DaisyUI's beautiful themes
- 🌙 **Dark mode** support out of the box
- 📱 **Responsive design** that works on all devices

## 📋 Requirements

- Node.js 18+ (for native test runner support)
- npm, yarn, or pnpm

## 🚀 Quick Start

### Installation

Install globally via npm:

```bash
npm install -g @yourapp/swagger-to-nextjs
```

Or use directly with npx:

```bash
npx @yourapp/swagger-to-nextjs generate petstore.yaml my-app
```

### Basic Usage

Generate a Next.js app from your OpenAPI spec:

```bash
swagger-to-nextjs generate petstore.yaml my-app
```

This command will:
1. Parse your `petstore.yaml` OpenAPI specification
2. Generate a complete Next.js application in the `my-app` directory
3. Include all TypeScript types, API routes, and DaisyUI-styled UI components

### What Gets Generated?

```
my-app/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # Generated API routes
│   ├── pets/                 # UI pages for pets resource
│   │   ├── page.tsx         # List page with DaisyUI table
│   │   └── [id]/            
│   │       └── page.tsx     # Detail page with DaisyUI card
│   └── layout.tsx           # Root layout with theme provider
├── components/              # Reusable components
│   ├── ThemeSwitcher.tsx   # DaisyUI theme switcher
│   ├── LoadingSpinner.tsx  # Loading states
│   └── ErrorAlert.tsx      # Error display
├── lib/                    # Utilities
│   ├── api-client.ts      # Typed API client
│   └── toast.ts           # Toast notifications
├── types/                  # TypeScript definitions
│   └── api.ts             # Generated from OpenAPI schemas
├── package.json           # Dependencies including DaisyUI
├── tailwind.config.js     # Tailwind + DaisyUI configuration
└── ...                    # Other config files
```

## ✨ Key Features

### 🎯 TypeScript Support
- Automatically generates TypeScript interfaces from OpenAPI schemas
- Full type safety across your entire application
- Strict mode enabled by default

### 🤖 Automatic API Client Generation
- Typed fetch functions for every API endpoint
- Automatic error handling
- Request/response interceptors
- Built-in loading states

### 🎨 CRUD UI Components with DaisyUI
- Beautiful, accessible components out of the box
- List views with tables and pagination
- Detail views with cards and badges
- Forms with validation
- All styled with DaisyUI's semantic color system

### 📱 Responsive Design
- Mobile-first approach
- Responsive tables and cards
- Touch-friendly interactions
- Optimized for all screen sizes

### 🌙 Dark Mode Support
- Multiple themes included by default
- Theme switcher component
- System preference detection
- Persistent theme selection

### 🛠️ Customizable Templates
- Override any template with your own
- Extend generated code easily
- Maintain full control

## 📚 Usage Documentation

### Command Structure

```bash
swagger-to-nextjs generate <spec> [output] [options]
```

### Common Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Overwrite existing files without prompting | `false` |
| `--dry-run` | Preview what would be generated without writing files | `false` |
| `--no-pages` | Skip UI component generation (API only) | `false` |
| `--theme <theme>` | Default DaisyUI theme | `"light"` |
| `--themes <themes...>` | List of DaisyUI themes to include | `["light", "dark", "cupcake", "corporate"]` |

### Examples

Generate with a specific theme:
```bash
swagger-to-nextjs generate api.yaml my-app --theme dark
```

Include additional themes:
```bash
swagger-to-nextjs generate api.yaml my-app --themes light dark synthwave cyberpunk
```

Preview without generating files:
```bash
swagger-to-nextjs generate api.yaml my-app --dry-run
```

API-only mode (no UI components):
```bash
swagger-to-nextjs generate api.yaml my-app --no-pages
```

## 🎨 Theming with DaisyUI

### Available Themes

The generator includes support for all DaisyUI themes:

`light`, `dark`, `cupcake`, `bumblebee`, `emerald`, `corporate`, `synthwave`, `retro`, `cyberpunk`, `valentine`, `halloween`, `garden`, `forest`, `aqua`, `lofi`, `pastel`, `fantasy`, `wireframe`, `black`, `luxury`, `dracula`, `cmyk`, `autumn`, `business`, `acid`, `lemonade`, `night`, `coffee`, `winter`, `dim`, `nord`, `sunset`

### Customizing Themes

1. **Use the built-in theme switcher**: A theme switcher component is automatically generated in your app's navbar

2. **Set default theme**:
   ```bash
   swagger-to-nextjs generate api.yaml my-app --theme synthwave
   ```

3. **Environment variable**: Set `NEXT_PUBLIC_DEFAULT_THEME` in your `.env.local`

4. **Custom theme file**:
   ```bash
   swagger-to-nextjs generate api.yaml my-app --custom-theme ./my-theme.json
   ```

### Custom Theme Format

```json
{
  "primary": "#570df8",
  "secondary": "#f000b8",
  "accent": "#37cdbe",
  "neutral": "#3d4451",
  "base-100": "#ffffff",
  "info": "#3abff8",
  "success": "#36d399",
  "warning": "#fbbd23",
  "error": "#f87272"
}
```

## 🧪 Testing

The generated application includes a comprehensive test setup using Node.js's built-in test runner (Node.js 18+).

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- test/api.test.js
```

### Test Structure

```
my-app/
├── test/
│   ├── api/          # API route tests
│   ├── components/   # Component tests
│   ├── lib/          # Client library tests
│   └── types/        # Type validation tests
```

### Example Test

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { api } from '../lib/api-client.js';

test('API client fetches pets successfully', async () => {
  const pets = await api.pets.list();
  assert(Array.isArray(pets));
});
```

## 🔧 Configuration

### Project Configuration

The generator creates a complete project setup:

- **TypeScript**: Strict mode with path aliases
- **ESLint**: Configured for Next.js and TypeScript
- **Prettier**: Code formatting with Tailwind CSS plugin
- **Tailwind CSS**: Configured with DaisyUI plugin
- **Environment Variables**: Type-safe with validation

### Advanced Options

```bash
# Use custom templates
swagger-to-nextjs generate api.yaml my-app --template-dir ./my-templates

# Generate without TypeScript
swagger-to-nextjs generate api.yaml my-app --no-typescript

# Skip API client generation
swagger-to-nextjs generate api.yaml my-app --no-client

# Add Docker configuration
swagger-to-nextjs generate api.yaml my-app --docker

# Add CI/CD workflows
swagger-to-nextjs generate api.yaml my-app --cicd
```

## 📖 OpenAPI Support

### Supported Versions
- OpenAPI 3.0.x
- OpenAPI 3.1.x
- Swagger 2.0 (automatically converted to OpenAPI 3.0)

### Supported Features
- All standard OpenAPI data types
- Complex schemas (allOf, oneOf, anyOf)
- Path parameters and query strings
- Request bodies and responses
- Authentication schemes
- Enums and constants
- Circular references

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) - The React Framework
- Styled with [DaisyUI](https://daisyui.com/) - The most popular Tailwind CSS component library
- Powered by [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework

## 🚦 Getting Started After Generation

After generating your Next.js application:

1. **Navigate to your project**:
   ```bash
   cd my-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URL and configuration
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Visit [http://localhost:3000](http://localhost:3000)

## 🎯 Next Steps

- 🎨 **Customize the theme**: Use the theme switcher in the navbar
- 📝 **Modify generated code**: All generated code is yours to customize
- 🧪 **Add tests**: Extend the test suite for your specific needs
- 🚀 **Deploy**: The generated app is ready for deployment to Vercel, Netlify, or any Node.js host

## 💬 Need Help?

- 📖 [Documentation](https://github.com/yourusername/swagger-to-nextjs/wiki)
- 💬 [Discussions](https://github.com/yourusername/swagger-to-nextjs/discussions)
- 🐛 [Issue Tracker](https://github.com/yourusername/swagger-to-nextjs/issues)
- 📧 Email: support@swagger-to-nextjs.dev

---

Made with ❤️ by the Swagger-to-Next.js team