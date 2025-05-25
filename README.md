<!--
===AI PROMPT ==============================================================
FILE: README.md
VERSION: 2025-05-25 13:22:11
============================================================================

AI GENERATION PROMPT:
Write comprehensive documentation for a Swagger-to-NextJS generator tool. Include installation, usage examples, configuration options, CLI commands, and troubleshooting guide.

---

===PROMPT END ==============================================================
-->
<!--
<!--
<!--
<!--
# Scripts Directory Organization

## Recommended Directory Structure

```

├── scripts/                       # Build tools and automation scripts
│   ├── swagger-to-nextjs/         # Main Swagger-to-NextJS toolkit
│   │   ├── package.json           # Script dependencies (separate from app)
│   │   ├── README.md              # Usage documentation
│   │   ├── bin/
│   │   │   └── swagger-to-nextjs  # CLI executable
│   │   ├── src/
│   │   │   ├── index.js           # Main entry point
│   │   │   ├── core/
│   │   │   │   ├── SwaggerLoader.js
│   │   │   │   ├── SwaggerValidator.js
│   │   │   │   └── DirectoryManager.js
│   │   │   ├── generators/
│   │   │   │   ├── ApiRouteGenerator.js
│   │   │   │   ├── PageComponentGenerator.js
│   │   │   │   ├── ConfigFileGenerator.js
│   │   │   │   └── BaseGenerator.js
│   │   │   ├── templates/
│   │   │   │   ├── TemplateEngine.js
│   │   │   │   ├── TemplateLoader.js
│   │   │   │   └── files/
│   │   │   │       ├── api/
│   │   │   │       │   ├── route.ts.template
│   │   │   │       │   └── validation.ts.template
│   │   │   │       ├── pages/
│   │   │   │       │   ├── page.tsx.template
│   │   │   │       │   └── components.tsx.template
│   │   │   │       └── config/
│   │   │   │           ├── layout.tsx.template
│   │   │   │           ├── globals.css.template
│   │   │   │           ├── tsconfig.json.template
│   │   │   │           └── dependencies.md.template
│   │   │   └── utils/
│   │   │       ├── PathUtils.js
│   │   │       ├── SchemaUtils.js
│   │   │       ├── ValidationUtils.js
│   │   │       └── StringUtils.js
```

## Setup Instructions

### 1. Create Scripts Package (`scripts/swagger-to-nextjs/package.json`)

```json
{
  "name": "@yourapp/swagger-to-nextjs",
  "version": "1.0.0",
  "description": "Generate Next.js applications from Swagger/OpenAPI specifications",
  "private": true,
  "main": "src/index.js",
  "bin": {
    "swagger-to-nextjs": "./bin/swagger-to-nextjs"
  },
  "scripts": {
    "test": "jest",
    "dev": "node src/index.js",
    "lint": "eslint src/",
    "build": "echo 'No build needed for Node.js script'"
  },
  "dependencies": {
    "js-yaml": "^4.1.0",
    "commander": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  },
  "keywords": [
    "swagger",
    "openapi",
    "nextjs",
    "code-generation"
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

### 2. CLI Executable (`scripts/swagger-to-nextjs/bin/swagger-to-nextjs`)

```bash
#!/usr/bin/env node

const path = require('path');
const SwaggerToNextJSGenerator = require('../src/index.js');

// Change working directory context to the script directory
process.chdir(path.dirname(__dirname));

// Import and run the main generator
require('../src/cli.js');
```

### 3. Main Entry Point (`scripts/swagger-to-nextjs/src/index.js`)

```javascript
const SwaggerLoader = require('./core/SwaggerLoader');
const ApiRouteGenerator = require('./generators/ApiRouteGenerator');
const PageComponentGenerator = require('./generators/PageComponentGenerator');
const ConfigFileGenerator = require('./generators/ConfigFileGenerator');
const DirectoryManager = require('./core/DirectoryManager');

class SwaggerToNextJSGenerator {
    constructor(swaggerSource, outputDir = '../../generated', apiClientPath = null) {
        // Resolve paths relative to the app root, not script directory
        this.outputDir = path.resolve(__dirname, '../../../', outputDir);
        this.apiClientPath = apiClientPath || path.join(this.outputDir, 'src/lib/api-client');

        this.loader = new SwaggerLoader(swaggerSource);
        this.dirManager = new DirectoryManager(this.outputDir, this.apiClientPath);
        this.apiGenerator = new ApiRouteGenerator();
        this.pageGenerator = new PageComponentGenerator();
        this.configGenerator = new ConfigFileGenerator();
    }

    async run() {
        console.log('🚀 Starting Swagger to Next.js generation...');

        const swaggerDoc = await this.loader.load();
        this.dirManager.createDirectories();

        await this.apiGenerator.generateRoutes(swaggerDoc, this.dirManager);
        await this.pageGenerator.generatePages(swaggerDoc, this.dirManager);
        await this.configGenerator.generateConfigs(swaggerDoc, this.dirManager);

        console.log(`✅ Generation completed! Output: ${this.outputDir}`);
    }
}

module.exports = SwaggerToNextJSGenerator;
```

### 4. CLI Interface (`scripts/swagger-to-nextjs/src/cli.js`)

```javascript
#!/usr/bin/env node

const {Command} = require('commander');
const path = require('path');
const SwaggerToNextJSGenerator = require('./index');

const program = new Command();

program
    .name('swagger-to-nextjs')
    .description('Generate Next.js applications from Swagger/OpenAPI specifications')
    .version('1.0.0');

program
    .argument('<input>', 'Swagger/OpenAPI spec file or URL')
    .option('-o, --output <dir>', 'Output directory', '../../generated')
    .option('-c, --client <path>', 'API client path')
    .option('--config <file>', 'OpenAPI generator config file')
    .action(async (input, options) => {
        try {
            const outputDir = path.resolve(process.cwd(), options.output);
            const generator = new SwaggerToNextJSGenerator(input, outputDir, options.client);
            await generator.run();
        } catch (error) {
            console.error('❌ Generation failed:', error.message);
            process.exit(1);
        }
    });

program
    .command('init')
    .description('Initialize a new project with example configuration')
    .option('-n, --name <name>', 'Project name', 'my-api-app')
    .action((options) => {
        console.log(`🚀 Initializing ${options.name}...`);
        // Create example openapi-config.yaml, etc.
    });

program.parse();
```

## Usage from App Root

### From Command Line

```bash
# Run from your app root directory
./scripts/swagger-to-nextjs/bin/swagger-to-nextjs http://localhost:8090/v3/api-docs

# Or add to PATH and run globally
export PATH="$PATH:$(pwd)/scripts/swagger-to-nextjs/bin"
swagger-to-nextjs ./api-spec.yaml --output ./src/generated

# Using npm scripts (recommended)
npm run generate:api
```

### Add to App Package.json Scripts

```json
{
  "scripts": {
    "generate:api": "scripts/swagger-to-nextjs/bin/swagger-to-nextjs",
    "generate:api:dev": "scripts/swagger-to-nextjs/bin/swagger-to-nextjs http://localhost:8090/v3/api-docs --output ./src/generated",
    "generate:api:prod": "scripts/swagger-to-nextjs/bin/swagger-to-nextjs https://api.prod.com/v3/api-docs --output ./src/generated"
  }
}
```

### Programmatic Usage

```javascript
// From your app code (if needed)
const SwaggerToNextJSGenerator = require('./scripts/swagger-to-nextjs/src/index');

const generator = new SwaggerToNextJSGenerator(
    'http://localhost:8090/v3/api-docs',
    './src/generated'
);

await generator.run();
```

## Development Workflow

### 1. Install Script Dependencies

```bash
cd scripts/swagger-to-nextjs
npm install
```

### 2. Develop and Test Scripts

```bash
cd scripts/swagger-to-nextjs
npm test
npm run lint

# Test the CLI
./bin/swagger-to-nextjs --help
```

### 3. Use from App Root

```bash
cd ../../  # Back to app root
npm run generate:api:dev
```

## Configuration Management

### Global Config (`scripts/swagger-to-nextjs/config/defaults.js`)

```javascript
module.exports = {
    defaultOutputDir: '../../generated',
    defaultTemplatesDir: './templates/files',
    defaultApiClientPath: 'src/lib/api-client',
    supportedFormats: ['json', 'yaml', 'yml'],

    // Template engine settings
    templateEngine: {
        variableSyntax: '{{}}',
        conditionalSyntax: '{{#if}}...{{/if}}',
        loopSyntax: '{{#each}}...{{/each}}'
    }
};
```

### Project-Specific Config (`openapi-config.yaml` in app root)

```yaml
# This file stays in your app root
inputSpec: http://localhost:8090/v3/api-docs
outputDir: ./src/generated
generatorName: typescript-axios

# Custom script settings
scriptSettings:
  templateOverrides: ./custom-templates
  generatePages: true
  generateTests: false
```

## Benefits of This Structure

### **Separation of Concerns**

- ✅ Scripts have their own dependencies (separate from app)
- ✅ Scripts can be versioned independently
- ✅ Clear boundary between tooling and application code
- ✅ Scripts can be shared across multiple projects

### **Maintainability**

- ✅ Script development doesn't affect app hot-reload
- ✅ Script tests run independently
- ✅ Easy to update script dependencies without affecting app
- ✅ Scripts can have different linting/formatting rules

### **Reusability**

- ✅ Can package scripts as separate npm modules later
- ✅ Easy to add more generators (Angular, Vue, etc.)
- ✅ Scripts can be used by CI/CD pipelines
- ✅ Other projects can copy/use the scripts directory

### **Developer Experience**

- ✅ Simple `npm run generate:api` command
- ✅ Scripts work from any directory
- ✅ Clear documentation and examples
- ✅ Easy to debug script issues separately from app issues

This structure gives you a professional, maintainable build toolchain that's completely separate from your main
application while being easy to use and develop.