/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - CONFIG FILE GENERATOR
 * ============================================================================
 * FILE: src/generators/ConfigFileGenerator.js
 * VERSION: 2025-05-29
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 📄 Template System
 * ============================================================================
 *
 * Generates comprehensive configuration files for Next.js projects including:
 * - Next.js configuration with optimization
 * - TypeScript configuration with strict settings
 * - ESLint rules for API conventions
 * - Prettier configuration
 * - Docker configurations
 * - CI/CD pipeline files
 * - Environment variable schemas
 * - Security headers configuration
 * - Build optimization settings
 * - Deployment configurations
 *
 * ============================================================================
 */

import path from 'path';
import { BaseGenerator } from './BaseGenerator.js';
import { GeneratorError } from '../errors/GeneratorError.js';
import { DependencyAnalyzer } from '../utils/DependencyAnalyzer.js';
import { StringUtils } from '../utils/StringUtils.js';

/**
 * Generates configuration files for Next.js projects
 */
export class ConfigFileGenerator extends BaseGenerator {
    constructor(options = {}) {
        super({
            ...options,
            templateDir: 'config',
            outputSubdir: ''
        });

        this.stringUtils = new StringUtils();
        this.dependencyAnalyzer = new DependencyAnalyzer();

        // Configuration options
        this.configOptions = {
            typescript: true,
            eslint: true,
            prettier: true,
            docker: true,
            ci: true,
            nextConfig: true,
            envSchema: true,
            securityHeaders: true,
            buildOptimization: true,
            deployment: 'vercel', // 'vercel' | 'aws' | 'docker' | 'custom'
            packageManager: 'npm', // 'npm' | 'yarn' | 'pnpm'
            testingFramework: 'jest', // 'jest' | 'vitest'
            styling: 'tailwind', // 'tailwind' | 'css-modules' | 'styled-components' | 'emotion'
            authentication: 'next-auth', // 'next-auth' | 'auth0' | 'clerk' | 'custom'
            database: 'prisma', // 'prisma' | 'drizzle' | 'mongodb' | 'none'
            ...options.configOptions
        };

        // Templates
        this.templates = {
            nextConfig: null,
            tsconfig: null,
            eslint: null,
            prettier: null,
            dockerfile: null,
            dockerCompose: null,
            dockerignore: null,
            githubActions: null,
            gitignore: null,
            env: null,
            envLocal: null,
            envSchema: null,
            packageJson: null,
            readme: null,
            vscode: null,
            editorconfig: null,
            jest: null,
            vitest: null,
            tailwind: null,
            postcss: null,
            nvmrc: null,
            vercel: null
        };
    }

    /**
     * Load configuration templates
     */
    async loadTemplates() {
        this.logger.debug('Loading configuration templates');

        for (const templateName of Object.keys(this.templates)) {
            try {
                const templateFile = this._getTemplateFileName(templateName);
                this.templates[templateName] = await this.templateEngine.load(
                    `config/${templateFile}.template`
                );
            } catch (error) {
                this.logger.warn(`Template ${templateName} not found, will use defaults`);
            }
        }

        // Register custom helpers
        this._registerTemplateHelpers();
    }

    /**
     * Validate configuration generation context
     */
    async doValidate(context) {
        if (!context.swagger) {
            throw new GeneratorError('Swagger specification is required');
        }

        // Validate deployment target
        const validDeployments = ['vercel', 'aws', 'docker', 'custom'];
        if (!validDeployments.includes(this.configOptions.deployment)) {
            throw new GeneratorError(`Invalid deployment target: ${this.configOptions.deployment}`);
        }

        // Validate package manager
        const validPackageManagers = ['npm', 'yarn', 'pnpm'];
        if (!validPackageManagers.includes(this.configOptions.packageManager)) {
            throw new GeneratorError(`Invalid package manager: ${this.configOptions.packageManager}`);
        }

        // Validate testing framework
        const validTestFrameworks = ['jest', 'vitest'];
        if (!validTestFrameworks.includes(this.configOptions.testingFramework)) {
            throw new GeneratorError(`Invalid testing framework: ${this.configOptions.testingFramework}`);
        }
    }

    /**
     * Prepare configuration generation context
     */
    async doPrepare(context) {
        // Analyze dependencies
        const dependencies = await this.dependencyAnalyzer.analyze(context);

        // Prepare environment variables
        const envVariables = this._extractEnvVariables(context);

        // Prepare build configuration
        const buildConfig = this._prepareBuildConfig(context);

        // Prepare security configuration
        const securityConfig = this._prepareSecurityConfig(context);

        return {
            ...context,
            projectName: this._extractProjectName(context),
            projectDescription: context.swagger.info?.description || 'Generated Next.js application',
            version: context.swagger.info?.version || '1.0.0',
            dependencies,
            envVariables,
            buildConfig,
            securityConfig,
            features: this._analyzeFeatures(context),
            apiInfo: this._extractApiInfo(context)
        };
    }

    /**
     * Generate configuration files
     */
    async doGenerate(context) {
        const files = [];

        try {
            // Core configuration files
            if (this.configOptions.nextConfig) {
                files.push(await this._generateNextConfig(context));
            }

            if (this.configOptions.typescript) {
                files.push(await this._generateTsConfig(context));
            }

            // Linting and formatting
            if (this.configOptions.eslint) {
                files.push(await this._generateEslintConfig(context));
            }

            if (this.configOptions.prettier) {
                files.push(await this._generatePrettierConfig(context));
            }

            // Styling configuration
            if (this.configOptions.styling === 'tailwind') {
                files.push(...await this._generateTailwindConfig(context));
            }

            // Testing configuration
            if (this.configOptions.testingFramework) {
                files.push(...await this._generateTestingConfig(context));
            }

            // Docker configuration
            if (this.configOptions.docker) {
                files.push(...await this._generateDockerConfig(context));
            }

            // CI/CD configuration
            if (this.configOptions.ci) {
                files.push(...await this._generateCIConfig(context));
            }

            // Environment configuration
            files.push(...await this._generateEnvConfig(context));

            // Package configuration
            files.push(await this._generatePackageJson(context));

            // Documentation
            files.push(await this._generateReadme(context));

            // Editor configuration
            files.push(...await this._generateEditorConfig(context));

            // Git configuration
            files.push(await this._generateGitignore(context));

            // Deployment configuration
            if (this.configOptions.deployment) {
                files.push(...await this._generateDeploymentConfig(context));
            }

            // Version management
            files.push(await this._generateNvmrc(context));

        } catch (error) {
            throw new GeneratorError(`Configuration generation failed: ${error.message}`, { cause: error });
        }

        return files.filter(Boolean); // Remove any null/undefined entries
    }

    /**
     * Generate Next.js configuration
     */
    async _generateNextConfig(context) {
        const config = {
            projectName: context.projectName,
            typescript: this.configOptions.typescript,
            features: context.features,
            buildConfig: context.buildConfig,
            securityHeaders: this.configOptions.securityHeaders ? context.securityConfig.headers : null,
            images: {
                domains: this._extractImageDomains(context),
                formats: ['image/avif', 'image/webp'],
                deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
                imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
                minimumCacheTTL: 60
            },
            i18n: context.features.i18n ? {
                locales: ['en', 'es', 'fr', 'de', 'ja'],
                defaultLocale: 'en',
                localeDetection: true
            } : null,
            experimental: {
                appDir: true,
                serverActions: true,
                serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
                optimizeFonts: true,
                optimizeImages: true
            },
            env: this._extractPublicEnv(context.envVariables),
            webpack: this.configOptions.buildOptimization,
            deployment: this.configOptions.deployment,
            poweredByHeader: false,
            compress: true,
            productionBrowserSourceMaps: false,
            reactStrictMode: true,
            swcMinify: true,
            output: this.configOptions.deployment === 'docker' ? 'standalone' : undefined,
            redirects: await this._generateRedirects(context),
            rewrites: await this._generateRewrites(context),
            headers: await this._generateHeaders(context)
        };

        return {
            path: path.join(context.outputDir, 'next.config.js'),
            content: await this.templates.nextConfig.render(config)
        };
    }

    /**
     * Generate TypeScript configuration
     */
    async _generateTsConfig(context) {
        const config = {
            compilerOptions: {
                target: 'es2020',
                lib: ['dom', 'dom.iterable', 'esnext'],
                allowJs: true,
                skipLibCheck: true,
                strict: true,
                forceConsistentCasingInFileNames: true,
                noEmit: true,
                esModuleInterop: true,
                module: 'esnext',
                moduleResolution: 'bundler',
                resolveJsonModule: true,
                isolatedModules: true,
                jsx: 'preserve',
                incremental: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                noImplicitReturns: true,
                noFallthroughCasesInSwitch: true,
                noUncheckedIndexedAccess: true,
                allowUnreachableCode: false,
                allowUnusedLabels: false,
                exactOptionalPropertyTypes: true,
                noImplicitOverride: true,
                noPropertyAccessFromIndexSignature: true,
                plugins: [
                    {name: 'next'}
                ],
                paths: {
                    '@/*': ['./src/*'],
                    '@/components/*': ['./src/components/*'],
                    '@/lib/*': ['./src/lib/*'],
                    '@/hooks/*': ['./src/hooks/*'],
                    '@/types/*': ['./src/types/*'],
                    '@/utils/*': ['./src/utils/*'],
                    '@/styles/*': ['./src/styles/*'],
                    '@/api/*': ['./src/app/api/*'],
                    '@/services/*': ['./src/services/*'],
                    '@/constants/*': ['./src/constants/*'],
                    '@/contexts/*': ['./src/contexts/*']
                }
            }
    };
    }

    /**
     * Generate build job for CI
     */
    _generateBuildJob(context) {
        return {
            'runs-on': 'ubuntu-latest',
            needs: ['lint', 'test'],
            steps: [
                {
                    name: 'Checkout code',
                    uses: 'actions/checkout@v4'
                },
                {
                    name: 'Setup Node.js',
                    uses: 'actions/setup-node@v4',
                    with: {
                        'node-version': '${{ env.NODE_VERSION }}',
                        'cache': this.configOptions.packageManager
                    }
                },
                {
                    name: 'Install dependencies',
                    run: this._getPackageManagerInstallCommand(this.configOptions.packageManager, 'ci')
                },
                {
                    name: 'Build application',
                    run: `${this._getPackageManagerRunCommand(this.configOptions.packageManager, 'build')}`,
                    env: {
                        NODE_ENV: 'production'
                    }
                },
                {
                    name: 'Upload build artifacts',
                    uses: 'actions/upload-artifact@v3',
                    with: {
                        name: 'nextjs-build',
                        path: '.next',
                        'retention-days': 7
                    }
                }
            ]
        };
    }

    /**
     * Generate security job for CI
     */
    _generateSecurityJob(context) {
        return {
            'runs-on': 'ubuntu-latest',
            steps: [
                {
                    name: 'Checkout code',
                    uses: 'actions/checkout@v4'
                },
                {
                    name: 'Run Snyk to check for vulnerabilities',
                    uses: 'snyk/actions/node@master',
                    env: {
                        SNYK_TOKEN: '${{ secrets.SNYK_TOKEN }}'
                    }
                },
                {
                    name: 'Run npm audit',
                    run: 'npm audit --production --audit-level=moderate'
                },
                {
                    name: 'Run CodeQL Analysis',
                    uses: 'github/codeql-action/analyze@v2'
                }
            ]
        };
    }

    /**
     * Generate deploy job for CI
     */
    _generateDeployJob(context) {
        const deploymentJobs = {
            vercel: {
                'runs-on': 'ubuntu-latest',
                needs: ['build'],
                if: "github.ref == 'refs/heads/main'",
                steps: [
                    {
                        name: 'Checkout code',
                        uses: 'actions/checkout@v4'
                    },
                    {
                        name: 'Deploy to Vercel',
                        uses: 'amondnet/vercel-action@v25',
                        with: {
                            'vercel-token': '${{ secrets.VERCEL_TOKEN }}',
                            'vercel-org-id': '${{ secrets.VERCEL_ORG_ID }}',
                            'vercel-project-id': '${{ secrets.VERCEL_PROJECT_ID }}',
                            'vercel-args': '--prod'
                        }
                    }
                ]
            },
            aws: {
                'runs-on': 'ubuntu-latest',
                needs: ['build'],
                if: "github.ref == 'refs/heads/main'",
                steps: [
                    {
                        name: 'Checkout code',
                        uses: 'actions/checkout@v4'
                    },
                    {
                        name: 'Configure AWS credentials',
                        uses: 'aws-actions/configure-aws-credentials@v4',
                        with: {
                            'aws-access-key-id': '${{ secrets.AWS_ACCESS_KEY_ID }}',
                            'aws-secret-access-key': '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
                            'aws-region': 'us-east-1'
                        }
                    },
                    {
                        name: 'Deploy to AWS',
                        run: 'npm run deploy:aws'
                    }
                ]
            },
            docker: {
                'runs-on': 'ubuntu-latest',
                needs: ['build'],
                if: "github.ref == 'refs/heads/main'",
                steps: [
                    {
                        name: 'Checkout code',
                        uses: 'actions/checkout@v4'
                    },
                    {
                        name: 'Set up Docker Buildx',
                        uses: 'docker/setup-buildx-action@v3'
                    },
                    {
                        name: 'Login to Docker Hub',
                        uses: 'docker/login-action@v3',
                        with: {
                            username: '${{ secrets.DOCKER_USERNAME }}',
                            password: '${{ secrets.DOCKER_PASSWORD }}'
                        }
                    },
                    {
                        name: 'Build and push Docker image',
                        uses: 'docker/build-push-action@v5',
                        with: {
                            context: '.',
                            push: true,
                            tags: `${context.projectName}:latest,${context.projectName}:${{ github.sha }}`,
                            'cache-from': 'type=gha',
                            'cache-to': 'type=gha,mode=max'
                        }
                    }
                ]
            }
        };

        return deploymentJobs[this.configOptions.deployment] || deploymentJobs.vercel;
    }

    /**
     * Generate pull request template
     */
    _generatePRTemplate(context) {
        return `## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Style update (formatting, renaming)
- [ ] ♻️ Code refactor (no functional changes)
- [ ] ⚡ Performance improvements
- [ ] ✅ Test update
- [ ] 🔧 Configuration change
- [ ] 🤖 CI/CD update

## Related Issues
<!-- Link any related issues here -->
Fixes #(issue number)

## Checklist
<!-- Mark completed items with an "x" -->

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots
<!-- If applicable, add screenshots to help explain your changes -->

## Additional Notes
<!-- Add any additional notes or context about the PR here -->
`;
    }

    /**
     * Generate issue template
     */
    _generateIssueTemplate(type) {
        if (type === 'bug') {
            return `---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Describe the bug
<!-- A clear and concise description of what the bug is -->

## To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected behavior
<!-- A clear and concise description of what you expected to happen -->

## Screenshots
<!-- If applicable, add screenshots to help explain your problem -->

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Safari, Firefox]
- Node version: [e.g. 18.17.0]
- Package manager: [e.g. npm 9.0.0]

## Additional context
<!-- Add any other context about the problem here -->
`;
        }

        if (type === 'feature') {
            return `---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Is your feature request related to a problem?
<!-- A clear and concise description of what the problem is. Ex. I'm always frustrated when [...] -->

## Describe the solution you'd like
<!-- A clear and concise description of what you want to happen -->

## Describe alternatives you've considered
<!-- A clear and concise description of any alternative solutions or features you've considered -->

## Additional context
<!-- Add any other context or screenshots about the feature request here -->
`;
        }

        return '';
    }

    /**
     * Generate environment example
     */
    _generateEnvExample(envVariables) {
        let content = '# Environment Variables\n';
        content += '# Copy this file to .env.local and fill in the values\n\n';

        Object.entries(envVariables).forEach(([key, config]) => {
            content += `# ${config.description}\n`;
            if (config.example) {
                content += `# Example: ${config.example}\n`;
            }
            content += `${key}=${config.default || ''}\n\n`;
        });

        return content;
    }

    /**
     * Generate local environment file
     */
    _generateEnvLocal(envVariables) {
        let content = '# Local Environment Variables\n';
        content += '# This file is ignored by git\n\n';

        Object.entries(envVariables).forEach(([key, config]) => {
            if (config.generate) {
                // Generate random value for secrets
                const value = this._generateSecret();
                content += `${key}=${value}\n`;
            } else {
                content += `${key}=${config.default || ''}\n`;
            }
        });

        return content;
    }

    /**
     * Generate environment schema
     */
    _generateEnvSchema(envVariables) {
        const serverSchema = {};
        const clientSchema = {};

        Object.entries(envVariables).forEach(([key, config]) => {
            const schema = {
                type: 'string',
                ...(config.required && { required: true }),
                ...(config.default && { default: config.default })
            };

            if (config.public || key.startsWith('NEXT_PUBLIC_')) {
                clientSchema[key] = schema;
            } else {
                serverSchema[key] = schema;
            }
        });

        return `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
${Object.entries(serverSchema).map(([key, schema]) =>
            `    ${key}: z.string()${schema.required ? '' : '.optional()'}${schema.default ? `.default("${schema.default}")` : ''},`
        ).join('\n')}
  },
  client: {
${Object.entries(clientSchema).map(([key, schema]) =>
            `    ${key}: z.string()${schema.required ? '' : '.optional()'}${schema.default ? `.default("${schema.default}")` : ''},`
        ).join('\n')}
  },
  runtimeEnv: {
${Object.keys({ ...serverSchema, ...clientSchema }).map(key =>
            `    ${key}: process.env.${key},`
        ).join('\n')}
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
`;
    }

    /**
     * Generate environment type definitions
     */
    _generateEnvTypes(envVariables) {
        return `declare global {
  namespace NodeJS {
    interface ProcessEnv {
${Object.keys(envVariables).map(key =>
            `      ${key}: string;`
        ).join('\n')}
    }
  }
}

export {};
`;
    }

    /**
     * Analyze dependencies
     */
    async _analyzeDependencies(context) {
        const dependencies = {
            production: {
                'next': '^14.0.0',
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'zod': '^3.22.0',
            },
            development: {
                '@types/node': '^20.0.0',
                '@types/react': '^18.2.0',
                '@types/react-dom': '^18.2.0',
                'typescript': '^5.3.0',
                'eslint': '^8.50.0',
                'eslint-config-next': '^14.0.0',
            }
        };

        // Add TypeScript dependencies
        if (this.configOptions.typescript) {
            dependencies.development['@typescript-eslint/parser'] = '^6.0.0';
            dependencies.development['@typescript-eslint/eslint-plugin'] = '^6.0.0';
        }

        // Add styling dependencies
        if (this.configOptions.styling === 'tailwind') {
            dependencies.development['tailwindcss'] = '^3.4.0';
            dependencies.development['postcss'] = '^8.4.0';
            dependencies.development['autoprefixer'] = '^10.4.0';
            dependencies.development['@tailwindcss/forms'] = '^0.5.0';
            dependencies.development['@tailwindcss/typography'] = '^0.5.0';
            dependencies.development['prettier-plugin-tailwindcss'] = '^0.5.0';
        }

        // Add testing dependencies
        if (this.configOptions.testingFramework === 'jest') {
            dependencies.development['jest'] = '^29.7.0';
            dependencies.development['@testing-library/react'] = '^14.0.0';
            dependencies.development['@testing-library/jest-dom'] = '^6.0.0';
            dependencies.development['jest-environment-jsdom'] = '^29.7.0';
        } else if (this.configOptions.testingFramework === 'vitest') {
            dependencies.development['vitest'] = '^1.0.0';
            dependencies.development['@vitejs/plugin-react'] = '^4.2.0';
            dependencies.development['@testing-library/react'] = '^14.0.0';
            dependencies.development['@testing-library/jest-dom'] = '^6.0.0';
        }

        // Add authentication dependencies
        if (this.configOptions.authentication === 'next-auth') {
            dependencies.production['next-auth'] = '^4.24.0';
        }

        // Add database dependencies
        if (this.configOptions.database === 'prisma') {
            dependencies.production['@prisma/client'] = '^5.7.0';
            dependencies.development['prisma'] = '^5.7.0';
        }

        // Add API-related dependencies based on OpenAPI spec
        if (context.features?.authentication) {
            dependencies.production['jsonwebtoken'] = '^9.0.0';
            dependencies.production['bcryptjs'] = '^2.4.0';
            dependencies.development['@types/jsonwebtoken'] = '^9.0.0';
            dependencies.development['@types/bcryptjs'] = '^2.4.0';
        }

        if (context.features?.fileUpload) {
            dependencies.production['formidable'] = '^3.5.0';
            dependencies.development['@types/formidable'] = '^3.4.0';
        }

        if (context.features?.validation) {
            dependencies.production['zod'] = '^3.22.0';
        }

        // Add additional helpful packages
        dependencies.production['clsx'] = '^2.0.0';
        dependencies.production['date-fns'] = '^3.0.0';
        dependencies.development['prettier'] = '^3.1.0';

        return dependencies;
    }

    /**
     * Generate scripts for package.json
     */
    _generateScripts(context) {
        const scripts = {
            'dev': 'next dev',
            'build': 'next build',
            'start': 'next start',
            'lint': 'next lint',
            'lint:fix': 'next lint --fix',
            'type-check': 'tsc --noEmit',
            'format': 'prettier --write .',
            'format:check': 'prettier --check .',
        };

        // Add testing scripts
        if (this.configOptions.testingFramework === 'jest') {
            scripts['test'] = 'jest';
            scripts['test:watch'] = 'jest --watch';
            scripts['test:ci'] = 'jest --ci --coverage';
        } else if (this.configOptions.testingFramework === 'vitest') {
            scripts['test'] = 'vitest';
            scripts['test:watch'] = 'vitest --watch';
            scripts['test:ci'] = 'vitest run --coverage';
        }

        // Add database scripts
        if (this.configOptions.database === 'prisma') {
            scripts['db:generate'] = 'prisma generate';
            scripts['db:migrate'] = 'prisma migrate dev';
            scripts['db:push'] = 'prisma db push';
            scripts['db:studio'] = 'prisma studio';
            scripts['db:seed'] = 'prisma db seed';
        }

        // Add deployment scripts
        if (this.configOptions.deployment === 'docker') {
            scripts['docker:build'] = 'docker build -t ' + context.projectName + ' .';
            scripts['docker:run'] = 'docker run -p 3000:3000 ' + context.projectName;
            scripts['docker:compose'] = 'docker-compose up';
        }

        // Add pre-commit hooks
        scripts['prepare'] = 'husky install';
        scripts['pre-commit'] = 'lint-staged';

        return scripts;
    }

    /**
     * Get package manager version
     */
    _getPackageManagerVersion() {
        const versions = {
            npm: 'npm@9.0.0',
            yarn: 'yarn@1.22.19',
            pnpm: 'pnpm@8.10.0'
        };
        return versions[this.configOptions.packageManager] || versions.npm;
    }

    /**
     * Get package manager install command
     */
    _getPackageManagerInstallCommand(pm, type = 'install') {
        const commands = {
            npm: {
                install: 'npm install',
                ci: 'npm ci'
            },
            yarn: {
                install: 'yarn install',
                ci: 'yarn install --frozen-lockfile'
            },
            pnpm: {
                install: 'pnpm install',
                ci: 'pnpm install --frozen-lockfile'
            }
        };
        return commands[pm]?.[type] || commands.npm[type];
    }

    /**
     * Get package manager run command
     */
    _getPackageManagerRunCommand(pm, script) {
        const commands = {
            npm: `npm run ${script}`,
            yarn: `yarn ${script}`,
            pnpm: `pnpm ${script}`
        };
        return commands[pm] || commands.npm;
    }

    /**
     * Generate quick start instructions
     */
    _generateQuickStart(context) {
        const pm = this.configOptions.packageManager;
        return {
            install: this._getPackageManagerInstallCommand(pm),
            dev: this._getPackageManagerRunCommand(pm, 'dev'),
            build: this._getPackageManagerRunCommand(pm, 'build'),
            start: this._getPackageManagerRunCommand(pm, 'start')
        };
    }

    /**
     * Get documented environment variables
     */
    _getDocumentedEnvVars(envVariables) {
        return Object.entries(envVariables).map(([key, config]) => ({
            name: key,
            description: config.description,
            required: config.required,
            default: config.default,
            example: config.example
        }));
    }

    /**
     * Extract API endpoints
     */
    _extractApiEndpoints(context) {
        const endpoints = [];
        Object.entries(context.swagger.paths || {}).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, operation]) => {
                if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                    endpoints.push({
                        method: method.toUpperCase(),
                        path,
                        summary: operation.summary || '',
                        description: operation.description || '',
                        operationId: operation.operationId || ''
                    });
                }
            });
        });
        return endpoints;
    }

    /**
     * Get tech stack
     */
    _getTechStack(context) {
        return {
            framework: 'Next.js 14',
            language: this.configOptions.typescript ? 'TypeScript' : 'JavaScript',
            styling: this.configOptions.styling,
            authentication: this.configOptions.authentication,
            database: this.configOptions.database,
            testing: this.configOptions.testingFramework,
            deployment: this.configOptions.deployment,
            features: context.features
        };
    }

    /**
     * Generate project structure
     */
    _generateProjectStructure(context) {
        return `
\`\`\`
${context.projectName}/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── [...generated API routes]
│   │   ├── [...pages]
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── [...components]
│   ├── lib/
│   │   ├── api/
│   │   └── utils/
│   ├── hooks/
│   ├── types/
│   └── styles/
├── public/
├── tests/
├── .github/
│   └── workflows/
├── docker/
├── scripts/
├── docs/
└── [...config files]
\`\`\`
`;
    }

    /**
     * Generate contributing guidelines
     */
    _generateContributingGuidelines(context) {
        return `
## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run \`${this._getPackageManagerRunCommand(this.configOptions.packageManager, 'lint')}\` before committing
- Write meaningful commit messages
- Add tests for new features
`;
    }

    /**
     * Generate Vercel configuration
     */
    async _generateVercelConfig(context) {
        const config = {
            $schema: 'https://openapi.vercel.sh/vercel.json',
            framework: 'nextjs',
            buildCommand: this._getPackageManagerRunCommand(this.configOptions.packageManager, 'build'),
            devCommand: this._getPackageManagerRunCommand(this.configOptions.packageManager, 'dev'),
            installCommand: this._getPackageManagerInstallCommand(this.configOptions.packageManager, 'install'),
            regions: ['iad1'],
            env: {},
            build: {
                env: {}
            }
        };

        // Add environment variables
        Object.entries(context.envVariables).forEach(([key, value]) => {
            if (value.required && !value.generate) {
                config.env[key] = '@' + key.toLowerCase();
            }
        });

        return {
            path: path.join(context.outputDir, 'vercel.json'),
            content: JSON.stringify(config, null, 2)
        };
    }

    /**
     * Generate AWS configuration
     */
    async _generateAWSConfig(context) {
        // This would generate AWS-specific config like serverless.yml
        // Placeholder for now
        return {
            path: path.join(context.outputDir, 'serverless.yml'),
            content: '# AWS Serverless configuration\n# TODO: Implement AWS deployment config'
        };
    }

    /**
     * Generate custom deployment configuration
     */
    async _generateCustomDeployConfig(context) {
        return {
            path: path.join(context.outputDir, 'deploy.config.js'),
            content: '// Custom deployment configuration\n// TODO: Implement custom deployment'
        };
    }

    /**
     * Generate a secret
     */
    _generateSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }
}

export default ConfigFileGenerator;