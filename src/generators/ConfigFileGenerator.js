/**
 * ===AI PROMPT ==============================================================
 * FILE: src/generators/ConfigFileGenerator.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Build a generator for NextJS configuration files: tsconfig.json,
 * next.config.js, layout components, and global styles based on the API
 * specification.
 *
 * ---
 *
 * ===PROMPT END ==============================================================
 */
/**
/**
/**
/**
/**
/**
/**
/**
/**
/**
/**
 * FILE: src/generators/ConfigFileGenerator.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing the configuration file generator that creates essential Next.js 13+
 * configuration and setup files. This generator produces TypeScript configs, CSS files,
 * layout components, and comprehensive documentation for the generated application.
 *
 * RESPONSIBILITIES:
 * - Generate Next.js App Router layout components (layout.tsx)
 * - Create global CSS files with Tailwind CSS integration
 * - Generate TypeScript configuration with proper path mapping
 * - Create comprehensive dependency documentation (DEPENDENCIES.md)
 * - Generate package.json information and setup instructions
 * - Handle existing file detection and conditional generation
 *
 * CONFIGURATION FILES MANAGED:
 * - layout.tsx (Root layout with navigation and metadata)
 * - globals.css (Tailwind CSS imports and base styles)
 * - tsconfig.json (TypeScript configuration with path aliases)
 * - DEPENDENCIES.md (Setup instructions and dependency information)
 * - package.json guidelines and npm scripts
 *
 * REVIEW FOCUS:
 * - Configuration accuracy and Next.js compatibility
 * - TypeScript path mapping and module resolution
 * - CSS organization and Tailwind integration
 * - Documentation completeness and clarity
 * - Conditional file generation and overwrite protection
 */

const BaseGenerator = require('./BaseGenerator');
const TemplateEngine = require('../templates/TemplateEngine');

class ConfigFileGenerator extends BaseGenerator {
    constructor() {
        super();
        this.templateEngine = new TemplateEngine();
    }

    /**
     * Generate all configuration files
     */
    async generateConfigs(swaggerDoc, directoryManager) {
        this.resetStats();

        console.log('📝 Generating configuration files...');

        const configFiles = [
            {name: 'layout.tsx', generator: 'generateLayout'},
            {name: 'globals.css', generator: 'generateGlobalCSS'},
            {name: 'tsconfig.json', generator: 'generateTSConfig'},
            {name: 'DEPENDENCIES.md', generator: 'generateDependencies'}
        ];

        for (const config of configFiles) {
            try {
                await this[config.generator](swaggerDoc, directoryManager);
                this.recordSuccess();
            } catch (error) {
                this.logError(`Failed to generate ${config.name}`, error);
                this.recordFailure(`${config.name}: ${error.message}`);
            }
        }

        console.log(`✅ Configuration file generation completed: ${this.stats.generated} generated, ${this.stats.failed} failed\n`);
        return this.getStats();
    }

    /**
     * Generate root layout component
     */
    async generateLayout(swaggerDoc, directoryManager) {
        const filePath = directoryManager.getConfigFilePath('layout.tsx');

        // Don't overwrite existing layout
        if (directoryManager.fileExists(filePath)) {
            console.log('📝 Layout.tsx already exists, skipping...');
            return;
        }

        const templateData = {
            appTitle: swaggerDoc.info?.title || 'API Application',
            appDescription: swaggerDoc.info?.description || 'Generated from Swagger/OpenAPI specification',
            version: swaggerDoc.info?.version || '1.0.0'
        };

        try {
            const content = await this.templateEngine.render('config/layout.tsx.template', templateData);
            directoryManager.writeFile(filePath, content, 'Root layout');
        } catch (error) {
            // Fallback generation
            const content = this.generateLayoutFallback(templateData);
            directoryManager.writeFile(filePath, content, 'Root layout');
        }
    }

    /**
     * Generate global CSS file
     */
    async generateGlobalCSS(swaggerDoc, directoryManager) {
        const filePath = directoryManager.getConfigFilePath('globals.css');

        // Don't overwrite existing CSS
        if (directoryManager.fileExists(filePath)) {
            console.log('📝 globals.css already exists, skipping...');
            return;
        }

        const templateData = {
            generatedBy: 'Swagger to Next.js Generator',
            timestamp: new Date().toISOString()
        };

        try {
            const content = await this.templateEngine.render('config/globals.css.template', templateData);
            directoryManager.writeFile(filePath, content, 'Global CSS');
        } catch (error) {
            // Fallback generation
            const content = this.generateGlobalCSSFallback();
            directoryManager.writeFile(filePath, content, 'Global CSS');
        }
    }

    /**
     * Generate TypeScript configuration
     */
    async generateTSConfig(swaggerDoc, directoryManager) {
        const filePath = directoryManager.getDirectory('root') + '/tsconfig.json';

        // Don't overwrite existing tsconfig
        if (directoryManager.fileExists(filePath)) {
            console.log('📝 tsconfig.json already exists, skipping...');
            return;
        }

        const templateData = {
            apiClientPath: directoryManager.apiClientPath,
            baseUrl: './src'
        };

        try {
            const content = await this.templateEngine.render('config/tsconfig.json.template', templateData);
            directoryManager.writeFile(filePath, content, 'TypeScript config');
        } catch (error) {
            // Fallback generation
            const content = this.generateTSConfigFallback();
            directoryManager.writeFile(filePath, content, 'TypeScript config');
        }
    }

    /**
     * Generate dependencies documentation
     */
    async generateDependencies(swaggerDoc, directoryManager) {
        const filePath = directoryManager.getDirectory('root') + '/DEPENDENCIES.md';

        const templateData = {
            appTitle: swaggerDoc.info?.title || 'API Application',
            appDescription: swaggerDoc.info?.description || 'Generated from Swagger/OpenAPI specification',
            apiClientPath: directoryManager.apiClientPath,
            timestamp: new Date().toLocaleDateString(),
            swaggerSource: swaggerDoc.info?.title ? `${swaggerDoc.info.title} API` : 'OpenAPI Specification'
        };

        try {
            const content = await this.templateEngine.render('config/dependencies.md.template', templateData);
            directoryManager.writeFile(filePath, content, 'Dependencies documentation');
        } catch (error) {
            // Fallback generation
            const content = this.generateDependenciesFallback(templateData);
            directoryManager.writeFile(filePath, content, 'Dependencies documentation');
        }
    }

    /**
     * Fallback layout generation
     */
    generateLayoutFallback(templateData) {
        return `// Root Layout Component
// Generated by Swagger to Next.js Generator

import React from 'react';
import './globals.css';

export const metadata = {
  title: '${templateData.appTitle}',
  description: '${templateData.appDescription}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-bold">
            ${templateData.appTitle}
          </h1>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
`;
    }

    /**
     * Fallback global CSS generation
     */
    generateGlobalCSSFallback() {
        return `/* Global Styles */
/* Generated by Swagger to Next.js Generator */

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  max-width: 1200px;
}
`;
    }

    /**
     * Fallback TypeScript config generation
     */
    generateTSConfigFallback() {
        return `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;
    }

    /**
     * Fallback dependencies documentation generation
     */
    generateDependenciesFallback(templateData) {
        return `# ${templateData.appTitle} - Dependencies

Generated on ${templateData.timestamp} from ${templateData.swaggerSource}

## Required Dependencies

Install these dependencies for the generated Next.js app:

\`\`\`bash
npm install next react react-dom typescript @types/react @types/node
npm install zod
npm install tailwindcss postcss autoprefixer
npm install -D @types/react-dom
\`\`\`

## OpenAPI Generator Integration

### 1. Generate API Client (do this first):

\`\`\`bash
npx @openapitools/openapi-generator-cli generate -c openapi-config.yaml
\`\`\`

### 2. Then generate Next.js routes:

\`\`\`bash
node swagger-to-nextjs.js <swagger-source> <output-directory> ${templateData.apiClientPath}
\`\`\`

### 3. Example openapi-config.yaml for your project:

\`\`\`yaml
inputSpec: http://localhost:8090/v3/api-docs
outputDir: ${templateData.apiClientPath}
generatorName: typescript-axios
skipValidateSpec: true
additionalProperties:
  supportsES6: true
  withInterfaces: true
  useSingleRequestParameter: true
  modelPropertyNaming: camelCase
  withSeparateModelsAndApi: true
  apiPackage: api
  modelPackage: model
  stringEnums: true
\`\`\`

## Initialize Tailwind CSS:

\`\`\`bash
npx tailwindcss init -p
\`\`\`

## Update your tailwind.config.js:

\`\`\`javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
\`\`\`

## Environment Variables

Create a \`.env.local\` file:

\`\`\`
API_BASE_URL=http://localhost:8090
\`\`\`

## Generated Structure

- **API Routes**: Use OpenAPI generated models and client
- **Models**: Imported from \`${templateData.apiClientPath}/model\`
- **API Client**: Imported from \`${templateData.apiClientPath}/api\`
- **Type Safety**: Full TypeScript integration with your OpenAPI spec

## Development Commands

\`\`\`bash
# Install dependencies
npm install

# Generate API client
npx @openapitools/openapi-generator-cli generate -c openapi-config.yaml

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Next Steps

1. Review and customize the generated route files
2. Update the API client method calls in the route handlers
3. Configure environment variables (API_BASE_URL, etc.)
4. Test your API routes
5. Customize the UI components as needed

## Tips

- The generated routes are ready to use your OpenAPI-generated types and client
- All files include comprehensive AI prompts for further customization
- Use the TypeScript compiler to catch integration issues early
- Test each endpoint thoroughly before deploying to production
`;
    }

    /**
     * Generate package.json recommendations
     */
    generatePackageJsonRecommendations(swaggerDoc) {
        return {
            name: this.slugify(swaggerDoc.info?.title || 'api-app'),
            version: '1.0.0',
            description: swaggerDoc.info?.description || 'Generated Next.js app from OpenAPI specification',
            scripts: {
                'dev': 'next dev',
                'build': 'next build',
                'start': 'next start',
                'lint': 'next lint',
                'generate:api': 'npx @openapitools/openapi-generator-cli generate -c openapi-config.yaml',
                'generate:routes': 'swagger-to-nextjs openapi-config.yaml'
            },
            dependencies: {
                'next': '^13.0.0',
                'react': '^18.0.0',
                'react-dom': '^18.0.0',
                'typescript': '^5.0.0',
                'zod': '^3.0.0'
            },
            devDependencies: {
                '@types/node': '^20.0.0',
                '@types/react': '^18.0.0',
                '@types/react-dom': '^18.0.0',
                'tailwindcss': '^3.0.0',
                'postcss': '^8.0.0',
                'autoprefixer': '^10.0.0'
            }
        };
    }

    /**
     * Convert title to slug format
     */
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
}

module.exports = ConfigFileGenerator;