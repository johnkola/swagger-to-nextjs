# Swagger-to-Next.js Generator - File Generation Prompts with DaisyUI (ES Modules)

This document contains all file generation prompts organized by file path. Each prompt has been updated to ensure ES Module format for all JavaScript files, Node.js built-in test framework for testing, and DaisyUI component integration for all UI elements.

## Project Structure Overview

```
swagger-to-nextjs/
├── package.json
├── README.md
├── bin/
│   └── swagger-to-nextjs.js
├── src/
│   ├── index.js
│   ├── cli.js
│   ├── core/
│   │   ├── SwaggerLoader.js
│   │   ├── SwaggerValidator.js
│   │   └── FileWriter.js
│   ├── generators/
│   │   ├── BaseGenerator.js
│   │   ├── TypeGenerator.js
│   │   ├── ApiRouteGenerator.js
│   │   ├── PageGenerator.js
│   │   ├── ClientGenerator.js
│   │   ├── ProjectGenerator.js
│   │   └── config/
│   │       ├── ConfigHelpers.js
│   │       ├── TypeScriptConfigGenerator.js
│   │       ├── NextConfigGenerator.js
│   │       ├── PackageConfigGenerator.js
│   │       ├── TailwindConfigGenerator.js
│   │       ├── LintingConfigGenerator.js
│   │       ├── EnvironmentConfigGenerator.js
│   │       ├── DockerConfigGenerator.js
│   │       ├── CICDConfigGenerator.js
│   │       ├── DeploymentConfigGenerator.js
│   │       ├── DocumentationGenerator.js
│   │       └── EditorConfigGenerator.js
│   ├── templates/
│   │   ├── TemplateEngine.js
│   │   └── helpers.js
│   └── utils/
│       ├── PathUtils.js
│       ├── SchemaUtils.js
│       └── StringUtils.js
├── templates/
│   ├── types/
│   │   └── api.ts.hbs
│   ├── api/
│   │   └── [...route].ts.hbs
│   ├── pages/
│   │   ├── list.tsx.hbs
│   │   ├── detail.tsx.hbs
│   │   └── form.tsx.hbs
│   ├── components/
│   │   ├── ThemeSwitcher.tsx.hbs
│   │   ├── LoadingSpinner.tsx.hbs
│   │   └── ErrorAlert.tsx.hbs
│   ├── lib/
│   │   ├── api-client.ts.hbs
│   │   └── toast.ts.hbs
│   └── project/
│       ├── package.json.hbs
│       ├── tsconfig.json.hbs
│       ├── next.config.js.hbs
│       ├── tailwind.config.js.hbs
│       ├── postcss.config.js.hbs
│       ├── globals.css.hbs
│       ├── layout.tsx.hbs
│       ├── .env.example.hbs
│       ├── .gitignore.hbs
│       └── README.md.hbs
├── test/
│   ├── core/
│   │   ├── SwaggerLoader.test.js
│   │   ├── SwaggerValidator.test.js
│   │   └── FileWriter.test.js
│   ├── generators/
│   │   ├── TypeGenerator.test.js
│   │   ├── ApiRouteGenerator.test.js
│   │   └── PageGenerator.test.js
│   └── utils/
│       ├── PathUtils.test.js
│       ├── SchemaUtils.test.js
│       └── StringUtils.test.js
└── examples/
    ├── petstore.yaml
    └── simple-api.yaml
```

---

## Phase 1: Foundation & Core Infrastructure

### /package.json
Create a package.json file for a CLI tool called "swagger-to-nextjs" that generates Next.js applications from OpenAPI specifications with DaisyUI component integration. Set "type": "module" to enable ES Modules throughout the project. This tool should use Commander.js for CLI parsing, Handlebars for templating, js-yaml for YAML parsing, chalk for colored output, ora for progress spinners, and fs-extra for file operations. Include appropriate npm scripts for testing using Node.js built-in test runner with "test": "node --test test/**/*.test.js", and coverage with "test:coverage": "node --test --experimental-test-coverage test/**/*.test.js". Add scripts for linting with ESLint and formatting with Prettier. Set up the bin field to point to "./bin/swagger-to-nextjs.js" for global CLI installation. Require Node.js 18 or higher (for native test runner support). Include relevant keywords for npm discoverability related to OpenAPI, Swagger, Next.js, code generation, TypeScript, DaisyUI, and Tailwind CSS.

### /README.md
Write a comprehensive README for a CLI tool that generates Next.js applications from OpenAPI/Swagger specifications with beautiful DaisyUI components. Explain that this tool takes an OpenAPI spec (YAML or JSON) and generates a complete Next.js 14+ application with TypeScript types, API routes, client library, and UI components styled with DaisyUI. Mention that the project uses ES Modules and requires Node.js 18+. Include installation instructions for global npm installation, a quick start example showing the basic command "swagger-to-nextjs generate petstore.yaml my-app", and explain what gets generated including DaisyUI-styled components. List key features like TypeScript support, automatic API client generation, CRUD UI components with DaisyUI theming, responsive design out of the box, dark mode support, and customizable templates. Provide basic usage documentation with common options like --force, --dry-run, --no-pages, --theme (for DaisyUI theme selection), --themes (list of themes to include). Include a section on theming explaining how to customize DaisyUI themes. Include a testing section explaining how to run tests using the native Node.js test runner. Include requirements (Node.js 18+) and MIT license information.

### /bin/swagger-to-nextjs.js
Create a Node.js executable file using ES Module syntax that serves as the entry point for a CLI tool. This file should have a shebang for Node.js, import and execute the main CLI module using ES Module import from '../src/cli.js', handle any uncaught errors gracefully with user-friendly messages, and exit with appropriate status codes. It should also handle SIGINT signals for clean interruption when users press Ctrl+C. The file should be minimal, focusing only on launching the CLI and basic error handling. Use top-level await if needed and ensure all imports use ES Module syntax.

### /src/cli.js
Build a Commander.js CLI interface using ES Module syntax for a Next.js code generator from OpenAPI specs with DaisyUI styling options. Import Commander using ES Module syntax. The main command should be "generate <spec> [output]" where spec is a path to an OpenAPI file and output is the target directory. Include options for --typescript (default true), --client (generate API client, default true), --pages (generate UI components, default true), --force (overwrite without asking), --dry-run (preview without writing), --theme <theme> (DaisyUI theme selection, default "light"), --themes <themes...> (list of DaisyUI themes to include, default ["light", "dark", "cupcake", "corporate"]), --no-daisyui (generate without DaisyUI, use plain CSS), and --custom-theme <path> (path to custom DaisyUI theme file). Import and use ora for progress spinner and chalk for colored messages using ES Module imports. Display colored success/error messages and provide helpful next steps after generation including how to switch themes. Include proper version handling by reading package.json using fs.readFileSync and JSON.parse, and comprehensive help text. Export the CLI setup as the default export.

### /src/index.js
Create the main orchestrator class using ES Module syntax for a code generator that coordinates the entire generation process from OpenAPI spec to Next.js application with DaisyUI components. Use ES Module imports for all dependencies. This class should accept configuration options in its constructor including theme preferences, have a main generate() method that sequentially runs all generation steps, coordinate loading the spec, validating it, and running various generators (types, API routes, client, pages with DaisyUI components, project files including Tailwind config). It should emit events for progress tracking using EventEmitter, handle errors gracefully with helpful messages, track DaisyUI theme configuration throughout the process, and return a summary of generated files. Export the class as the default export. The class should support both CLI usage and programmatic usage as a library.

---

## Phase 2: Core System Components

### /src/core/SwaggerLoader.js
Create a class using ES Module syntax that loads and parses OpenAPI/Swagger specifications from various sources. Import dependencies like js-yaml, fs-extra, and node-fetch using ES Module imports. The class should support loading from local file paths and HTTP/HTTPS URLs, automatically detect JSON vs YAML format, parse YAML using js-yaml library, resolve internal $ref references within the document, support both OpenAPI 3.x and Swagger 2.0 formats (converting Swagger 2.0 to OpenAPI 3.0 structure internally), handle file reading and network errors gracefully, implement basic timeout for URL fetching, extract any branding colors or theme information from the spec for potential DaisyUI theme customization, and return a normalized specification object ready for processing. Export the class as the default export.

### /src/core/SwaggerValidator.js
Build a validator class using ES Module syntax for OpenAPI specifications that ensures the spec is valid and ready for code generation. Import necessary utilities using ES Module imports. It should check for required fields (openapi/swagger version, info, paths), verify each path has at least one operation, generate missing operationIds from path and method, validate that all referenced schemas exist, check for common issues like empty paths or missing response schemas, extract any UI hints or display preferences from spec extensions that could influence DaisyUI component selection, separate validation results into errors (blocking) and warnings (non-blocking), provide detailed error messages with the path to the problem (e.g., "paths./pets.get.responses.200.content is missing"), and return a validation result object with valid boolean, errors array, and warnings array. Export as default.

### /src/core/FileWriter.js
Create a file writer class using ES Module syntax that handles all file system operations for the code generator. Import fs-extra and other dependencies using ES Module imports. It should create nested directories recursively, check for existing files and handle conflicts based on options (force overwrites, interactive prompts, or skip), support dry-run mode that logs what would be written without actually writing, format code files appropriately (TypeScript/JavaScript files with Prettier, CSS files with Prettier CSS parser), track all written files for final summary reporting including count of DaisyUI components used, handle file system errors gracefully (permissions, disk space), provide progress callbacks for each file written, ensure atomic writes to prevent partial file generation, and create proper directory structure for Next.js App Router with Tailwind CSS. Export as default.

---

## Phase 3: Utility Modules

### /src/utils/PathUtils.js
Create a utility module using ES Module syntax for path and route manipulation between OpenAPI and Next.js conventions. Export individual named functions (not an object) to convert OpenAPI paths like /users/{userId}/posts/{postId} to Next.js routes like /users/[userId]/posts/[postId], extract parameter names from paths, convert paths to file system safe directory structures, group related paths by resource (all /users paths together), determine if a path represents a collection (typically GET without ID) or single resource, generate appropriate file names from paths, handle special characters and edge cases in path conversion, create component-friendly names for DaisyUI page components, and ensure all generated paths are valid for both Next.js routing and file systems. Use export keyword for each function.

### /src/utils/StringUtils.js
Create a comprehensive string manipulation utility module using ES Module syntax for various naming convention conversions needed in code generation. Export individual named functions to convert strings between different cases: toPascalCase (for class names like UserProfile and React components), toCamelCase (for variables like userId), toKebabCase (for file names like user-profile and CSS classes), toSnakeCase (for some APIs like user_id), and toUpperCase (for constants like USER_ID). Add functions for pluralization and singularization of resource names, capitalizing first letters, sanitizing strings to valid JavaScript identifiers, generating DaisyUI-friendly class names, handling special characters and numbers in conversions, preserving acronyms appropriately (API stays API, not Api), creating human-readable labels from field names for form labels, and ensuring all conversions handle edge cases like empty strings, single characters, and mixed input formats. Use export keyword for each function.

### /src/utils/SchemaUtils.js
Build a utility module using ES Module syntax for converting OpenAPI schemas to TypeScript types and extracting UI hints for DaisyUI components. Export named functions to convert OpenAPI schema objects to TypeScript type strings, map OpenAPI types (string, integer, number, boolean) to TypeScript types, handle array types with proper TypeScript array syntax, process nested object schemas recursively, resolve $ref references to get actual schema definitions, generate valid TypeScript interface names from schema names, handle nullable types using TypeScript union types, process enum schemas to TypeScript enums or union types (and determine if they should be rendered as select, radio, or badges in DaisyUI), manage schema composition (allOf, oneOf, anyOf), detect and handle circular references, extract descriptions for JSDoc comments and form field help text, determine appropriate DaisyUI input components based on schema properties (text input, textarea, select, checkbox, etc.), and identify fields that should use specific DaisyUI components (dates with date picker, colors with color picker, etc.). Use export keyword for each function.

---

## Phase 4: Template System

### /src/templates/TemplateEngine.js
Create a template engine wrapper class using ES Module syntax around Handlebars that manages template loading and rendering for the code generator with DaisyUI-specific helpers. Import Handlebars and other dependencies using ES Module imports. This class should load templates from the templates directory using ES Module URL resolution and fs.readFileSync, compile and cache templates for performance, register custom Handlebars helpers for code generation tasks by importing from helpers.js, register DaisyUI-specific helpers for component class generation, support template overrides from user-specified directories, render templates with provided data contexts including theme configuration, handle missing templates with clear error messages, support partials for reusable template fragments (especially for common DaisyUI patterns), provide debugging information when template rendering fails, and maintain a registry of available DaisyUI components and their usage patterns. Export as default.

### /src/templates/helpers.js
Create a module using ES Module syntax that exports custom Handlebars helper functions specifically designed for code generation tasks with DaisyUI components. Import string utilities using ES Module imports. Export individual named helper functions for case conversion: pascalCase (convert any string to PascalCase for class names), camelCase (for variable names), kebabCase (for file names), and upperCase (for constants). Add helpers for type generation: typeString (convert OpenAPI schema to TypeScript type string), isRequired (check if a property is in the required array), and isNullable (determine if a type should be nullable). Include path helpers: pathToRoute (convert OpenAPI path to Next.js route), extractPathParams (get parameter names from path), and routeToFilePath (convert route to file system path). Add DaisyUI-specific helpers: daisyInputType (determine DaisyUI input class based on schema), daisyButtonVariant (select button variant based on operation type), daisyAlertType (map error types to alert variants), daisyTableClass (generate table classes with modifiers), formControlClass (generate form control classes based on validation state), and badgeColor (map status values to badge colors). Add utility helpers: hasBody (check if operation has request body), getSuccessStatus (determine success response code), jsonStringify (safely stringify objects for templates), and isLargeTextField (determine if textarea should be used). Export each helper as a named export.

---

## Phase 5: Base Generator

### /src/generators/BaseGenerator.js
Create an abstract base class using ES Module syntax that all specific generators (types, API routes, pages, etc.) will extend. Import EventEmitter and other dependencies using ES Module imports. This class should accept the OpenAPI specification and generator options in its constructor including DaisyUI theme configuration, define an abstract generate() method that subclasses must implement, provide common utility methods like getOperations() to extract all operations from paths, getSchemas() to get all schema definitions, getThemeConfig() to access DaisyUI theme settings, and renderTemplate() to render Handlebars templates with theme context. Include event emission for progress reporting, error handling with context about what was being generated, support for dry-run mode, helper methods for common tasks like creating operation IDs or extracting path parameters, methods to track DaisyUI component usage for reporting, and utilities for determining appropriate DaisyUI components based on operation types. Export as default.

---

## Phase 6: Main Code Generators

### /src/generators/TypeGenerator.js
Build a generator class using ES Module syntax extending BaseGenerator that creates TypeScript type definitions from OpenAPI schemas. Import BaseGenerator and utilities using ES Module imports. This generator should create a single types/api.ts file containing all type definitions, convert each OpenAPI schema to a TypeScript interface, handle all OpenAPI data types (string, number, boolean, array, object), support nullable properties using union types, handle optional properties with TypeScript's optional operator, generate enums from string enumeration schemas with comments indicating DaisyUI rendering hints, handle schema composition (allOf, oneOf, anyOf), add JSDoc comments from schema descriptions including UI hints for form rendering, resolve $ref references to other schemas, handle circular references gracefully, create utility types for form state management, generate types for API responses including pagination metadata, and export all generated interfaces and types for use in other generated files. Export as default.

### /src/generators/ApiRouteGenerator.js
Create a generator class using ES Module syntax that produces Next.js 14 App Router API route handlers from OpenAPI path definitions. Import BaseGenerator and utilities using ES Module imports. For each path in the OpenAPI spec, generate a route.ts file in the appropriate app/api directory structure, convert OpenAPI paths like /pets/{id} to Next.js dynamic routes like /pets/[id], create named export functions for each HTTP method (GET, POST, PUT, DELETE, PATCH), import generated TypeScript types for request/response typing, add request body parsing and basic validation with error responses formatted for DaisyUI alerts, include proper error handling with appropriate HTTP status codes and structured error objects, use NextRequest and NextResponse from Next.js, add TODO comments where business logic should be implemented, implement pagination support for list endpoints, add CORS headers if specified in OpenAPI spec, and organize routes following RESTful conventions. Export as default.

### /src/generators/ClientGenerator.js
Build a generator using ES Module syntax that creates a typed API client library for the frontend to communicate with the API, integrated with DaisyUI toast notifications. Import BaseGenerator and utilities using ES Module imports. Generate a lib/api-client.ts file that groups API operations by tags (if present) or by resource paths, creates a function for each operation with full TypeScript typing, uses the native fetch API with proper error handling, constructs URLs with path parameters, handles different HTTP methods and request bodies, includes authentication headers from environment variables, throws custom ApiError for non-2xx responses with DaisyUI-friendly error messages, parses JSON responses with proper typing, includes JSDoc comments from operation descriptions, supports request interceptors for loading states, includes optional toast notifications for success/error using DaisyUI toasts, implements retry logic with exponential backoff, and exports a well-organized API object (like api.pets.list(), api.pets.create()). Also generate a lib/toast.ts utility for DaisyUI toast management. Export as default.

### /src/generators/PageGenerator.js
Create a generator using ES Module syntax that produces React components for user interfaces based on API operations using DaisyUI components throughout. Import BaseGenerator and utilities using ES Module imports. For GET operations returning arrays, generate list pages showing all items in a DaisyUI table (table table-zebra table-pin-rows) with sorting, filtering, and pagination using DaisyUI components, skeleton loaders while fetching, and action buttons with proper variants. For GET operations with ID parameters, generate detail pages showing single item data in DaisyUI cards with proper sections, badges for status fields, button groups for actions, and breadcrumb navigation. For POST/PUT operations, generate form pages with DaisyUI form controls including proper input types (input-bordered, select-bordered, textarea-bordered), validation states (input-error, input-success), helpful tooltips, file upload components if needed, and form actions in a sticky footer. All generated components should use Next.js 14 App Router conventions, include 'use client' directive for client components, import and use the generated API client, implement loading states with DaisyUI skeletons and spinners, handle errors with DaisyUI alerts including retry actions, use TypeScript throughout with proper typing, implement responsive layouts using DaisyUI's responsive utilities, include keyboard navigation support, use DaisyUI modals for confirmations and complex actions, implement toast notifications for user feedback, and follow React best practices with hooks. Export as default.

### /src/generators/ProjectGenerator.js
Build a generator using ES Module syntax that creates all the necessary project configuration and setup files for a Next.js application with DaisyUI. Import BaseGenerator and all config generators using ES Module imports. Generate package.json with Next.js, React, TypeScript, Tailwind CSS, DaisyUI dependencies and appropriate scripts, create tsconfig.json with strict TypeScript settings and path aliases, generate next.config.js with basic configuration and environment variable setup, create tailwind.config.js with DaisyUI plugin and theme configuration, generate postcss.config.js for Tailwind processing, create app/globals.css with Tailwind directives and custom styles, generate app/layout.tsx with DaisyUI theme setup and common layout components, create .env.example with API_URL and other necessary variables, generate .gitignore suitable for Next.js projects, create a README.md with project setup instructions including theme customization, and ensure all configuration files work together cohesively for a production-ready setup with DaisyUI components. Export as default.

---

## Phase 7: Configuration Generators

### /src/generators/config/ConfigHelpers.js
Create a utility module using ES Module syntax with shared helper functions for configuration generation including DaisyUI-specific utilities. Export named functions for template helper registration for Handlebars helpers, project name extraction and sanitization from OpenAPI spec, API feature analysis to determine required dependencies, DaisyUI theme configuration from spec metadata or branding, extracting color schemes for custom DaisyUI themes, environment variable extraction from security schemes, build configuration preparation with Tailwind CSS optimization, security configuration setup, image domain extraction from server URLs, component library usage statistics, package manager command helpers for different managers (npm, yarn, pnpm), secret generation utilities for secure tokens, theme preference detection and setup, and YAML/JSON stringification helpers with proper formatting. Use export keyword for each function.

### /src/generators/config/TypeScriptConfigGenerator.js
Build a TypeScript configuration generator using ES Module syntax that creates tsconfig.json with strict type checking enabled for maximum type safety. Import BaseGenerator and helpers using ES Module imports. Configure path aliases for clean imports (@/components, @/lib, @/utils, @/types, etc.), set up appropriate compiler options for Next.js 14+ including module resolution, enable all strict checks and additional safety options like noUncheckedIndexedAccess, configure module resolution for the bundler with proper settings, set up incremental compilation for faster builds, include proper lib references for DOM and ESNext features, add paths for DaisyUI component type definitions if using custom components, generate type declaration files for global types and API types, create next-env.d.ts for Next.js type definitions, and ensure compatibility with Tailwind CSS and DaisyUI class name typing. Export as default.

### /src/generators/config/NextConfigGenerator.js
Create a specialized generator using ES Module syntax for Next.js configuration that generates next.config.js with optimization settings for production builds including Tailwind CSS optimization. Import BaseGenerator and helpers using ES Module imports. Configure image optimization with proper domains and formats extracted from API spec, set up internationalization if locale patterns are detected in the API, implement security headers and CSP policies for protection including styles for DaisyUI, configure experimental features and build optimizations for CSS, handle environment variables for client-side usage with NEXT_PUBLIC_ prefix including theme preferences, set up redirects, rewrites, and custom headers based on API patterns, support different deployment targets including standalone for Docker and static export, and optimize Tailwind CSS with proper purge configuration. Export as default.

### /src/generators/config/PackageConfigGenerator.js
Create a package configuration generator using ES Module syntax that generates package.json with analyzed dependencies from OpenAPI spec and DaisyUI requirements. Import BaseGenerator and helpers using ES Module imports. Add core dependencies including next@14, react@18, react-dom@18, typescript@5, tailwindcss@3, autoprefixer, postcss, and daisyui@4. Add appropriate scripts for development, testing (using Node.js built-in test runner), building, linting, and deployment. Configure "type": "module" in generated package.json for ES Module support. Set up engine requirements for Node.js 18+, configure pre-commit hooks with Husky and lint-staged including CSS file linting, add theme customization scripts if custom themes are detected, include proper metadata, keywords (including daisyui, tailwindcss), and licensing information, and generate additional config files like .npmrc, .nvmrc, and .gitignore. Export as default.

### /src/generators/config/TailwindConfigGenerator.js
Create a Tailwind CSS configuration generator using ES Module syntax that sets up tailwind.config.js with DaisyUI plugin and theme customization. Import BaseGenerator and helpers using ES Module imports. Configure content paths for all TypeScript, JavaScript, and component files, add DaisyUI plugin with theme configuration based on CLI options, set up custom themes if branding colors are extracted from OpenAPI spec, configure dark mode with class or media strategy, set up theme extend section for custom colors and spacing if needed, configure font families if specified in spec, optimize for production with proper purge settings, add any custom utilities or components needed for the API, configure animation settings for smooth transitions, and ensure all DaisyUI themes specified in options are included. Export as default.

### /src/generators/config/LintingConfigGenerator.js
Create a comprehensive linting configuration generator using ES Module syntax that handles ESLint, Prettier, and Stylelint for Tailwind CSS. Import BaseGenerator and helpers using ES Module imports. Generate ESLint configuration with ES Module support and TypeScript rules, configure import/export linting for ES Modules, implement API-specific linting rules for consistent endpoint patterns, add React and React Hooks rules with Next.js specific settings, configure Tailwind CSS class sorting with prettier-plugin-tailwindcss, set up security-focused linting rules to catch vulnerabilities, create Prettier configuration with team-friendly defaults and Tailwind class sorting, add Stylelint configuration for CSS files with Tailwind rules, ensure ESLint and Prettier work together without conflicts, add accessibility rules for React components, configure class name ordering for DaisyUI utilities, and generate lint-staged configuration for pre-commit hooks. Export as default.

### /src/generators/config/EnvironmentConfigGenerator.js
Build an environment configuration generator using ES Module syntax that creates type-safe environment validation with theme preferences. Import BaseGenerator and helpers using ES Module imports. Generate schemas for environment validation, create .env.example with documented variables extracted from OpenAPI spec, add NEXT_PUBLIC_DEFAULT_THEME and NEXT_PUBLIC_AVAILABLE_THEMES for DaisyUI configuration, create .env.local with secure random secrets for development, generate TypeScript definitions for process.env with proper typing including theme variables, extract environment variables from OpenAPI security schemes and server configurations, separate public and private environment variables following Next.js conventions, handle database URLs and authentication secrets, add variables for feature flags and API versioning, provide environment-specific configurations for development, staging, and production, and generate comprehensive documentation for all environment variables. Export as default.

### /src/generators/config/DockerConfigGenerator.js
Build a Docker configuration generator using ES Module syntax that creates multi-stage Dockerfile with security best practices and optimized for Next.js with Tailwind CSS. Import BaseGenerator and helpers using ES Module imports. Create optimized Node.js Alpine-based images with proper layer caching, include build stage that properly compiles Tailwind CSS with DaisyUI, Docker Compose configuration for service orchestration including development and production variants, health check implementations for container monitoring, non-root user setup for security compliance, efficient layer caching strategies to speed up builds including node_modules and .next caching, volume management for development and production environments, network configuration for microservices architecture, proper handling of public assets and static files, and .dockerignore file with appropriate exclusions. Include helper scripts for building, running, and managing Docker containers. Export as default.

### /src/generators/config/CICDConfigGenerator.js
Create a CI/CD configuration generator using ES Module syntax that produces GitHub Actions workflows for testing, building, and deployment with Tailwind CSS compilation checks. Import BaseGenerator and helpers using ES Module imports. Generate multi-job pipelines with Node.js 18+ for test runner support, CSS compilation verification, Lighthouse CI for performance testing with DaisyUI components, security scanning integration (Snyk, CodeQL), automated testing using Node.js built-in test runner, visual regression testing for UI components, build artifact management including CSS optimization reports, and deployment jobs for different platforms (Vercel, AWS, Docker). Include Dependabot configuration for dependency updates including DaisyUI, PR and issue templates for better collaboration with UI component checklists, and branch protection rules. The generator should create workflows for main CI/CD pipeline, PR-specific checks with preview deployments, security scanning, and release automation. Export as default.

### /src/generators/config/DeploymentConfigGenerator.js
Build a deployment configuration generator using ES Module syntax that creates platform-specific configs for Vercel, AWS, Netlify, and Docker deployments optimized for Next.js with DaisyUI. Import BaseGenerator and helpers using ES Module imports. Generate Vercel configuration with build settings, environment variables, and optimized Edge Runtime settings, AWS deployment configuration including serverless.yml and SAM templates with CloudFront distribution, custom deployment scripts for various platforms with CSS optimization, platform-specific optimizations for performance including CSS delivery, CDN and caching configurations for static assets and compiled CSS, domain and SSL settings, PostCSS and Tailwind JIT compilation settings, and scaling and performance configurations. Include Kubernetes manifests with proper resource allocation, Docker Compose variations for different environments, and deployment automation scripts with theme compilation. Export as default.

### /src/generators/config/DocumentationGenerator.js
Build a documentation generator using ES Module syntax that creates comprehensive documentation from OpenAPI specifications with DaisyUI component usage guide. Import BaseGenerator and helpers using ES Module imports. Generate README.md with project overview extracted from API info, complete API endpoint documentation with request/response examples, DaisyUI component usage guide showing which components are used where, theme customization documentation with examples, environment variable documentation with descriptions and examples, project structure visualization showing all generated files, component library reference with DaisyUI components used, contributing guidelines for team collaboration including ES Module conventions and UI consistency, development workflow documentation, deployment instructions for multiple platforms, accessibility guidelines for DaisyUI components, and troubleshooting guides for common issues. Include quick start guides, API reference documentation, UI component gallery, and tech stack information mentioning ES Module usage and DaisyUI. Export as default.

### /src/generators/config/EditorConfigGenerator.js
Create an editor configuration generator using ES Module syntax that produces editor configs optimized for Next.js, TypeScript, and Tailwind CSS development. Import BaseGenerator and helpers using ES Module imports. Generate .editorconfig for consistent coding styles across different editors, VS Code settings.json with recommended extensions including Tailwind CSS IntelliSense, PostCSS Language Support, and DaisyUI snippets, VS Code launch.json configurations for debugging Next.js applications with Node.js 18+, Git configuration files including comprehensive .gitignore patterns for Next.js and CSS builds, team-specific editor preferences and code formatting rules, file associations and language-specific settings for .js files as ES Modules, Tailwind CSS class name completion configuration, workspace recommendations for development efficiency including theme preview, and Git hooks configuration using Husky for pre-commit and pre-push checks including CSS linting. Export as default.

---

## Phase 8: Template Files

### /templates/types/api.ts.hbs
Create a Handlebars template that generates a TypeScript type definition file from OpenAPI schemas with UI metadata for DaisyUI components. The template should produce a file header comment indicating it's auto-generated, iterate through all schemas and generate TypeScript interfaces, handle primitive types, arrays, and nested objects, use TypeScript's optional operator (?) for optional properties, generate union types for nullable properties, create enum types from string enumerations with comments for UI rendering hints, add JSDoc comments from schema descriptions including @uiComponent hints for DaisyUI components, generate form state types for each schema (loading, errors, touched fields), create pagination types for list responses, ensure proper TypeScript syntax with semicolons, export all interfaces and types, and organize related types with section comments. The output should be clean, readable TypeScript that passes strict type checking.

### /templates/api/[...route].ts.hbs
Create a Handlebars template for Next.js 14 App Router API route handlers with error responses formatted for DaisyUI alerts. The template should generate imports for NextRequest and NextResponse from 'next/server', import necessary types from the generated types file, create named export functions for each HTTP method present in the OpenAPI path, include TypeScript typing for request parameters and bodies, add try-catch blocks for error handling that return structured error objects, parse request bodies for POST/PUT/PATCH requests with validation, implement pagination for GET list endpoints with limit/offset or cursor support, include basic validation with detailed error messages for DaisyUI alert display, return appropriate NextResponse.json() with consistent response structure, add TODO comments where developers should implement business logic, handle path parameters for dynamic routes with proper typing, implement CORS if specified in the OpenAPI spec, and follow Next.js App Router conventions for API routes.

### /templates/pages/list.tsx.hbs
Create a Handlebars template for React list page components that display collections of resources using DaisyUI components. The template should generate a client component with 'use client' directive, import necessary types and the API client, import DaisyUI component helpers, use React hooks (useState, useEffect) for state management, implement data fetching with loading states using DaisyUI skeleton components (skeleton h-4 w-full for each row), display data in a DaisyUI table with classes "table table-zebra table-pin-rows table-pin-cols", implement sorting with clickable headers showing sort indicators, add filtering with DaisyUI form controls (input input-bordered input-sm), implement pagination using DaisyUI pagination component (join), handle empty states with friendly message in a DaisyUI card, show errors using DaisyUI alert components (alert alert-error) with retry button, include action buttons using btn classes (btn-primary, btn-ghost, btn-sm), add a floating action button for creating new items if POST operation exists, implement row selection with checkboxes for bulk actions, use DaisyUI drawer or modal for quick preview, ensure responsive design with overflow-x-auto for tables, and include keyboard navigation support.

### /templates/pages/detail.tsx.hbs
Create a Handlebars template for React detail page components that display single resource data using DaisyUI card and layout components. Generate a client component that accepts ID from route parameters, implement data fetching with DaisyUI skeleton loader for the entire card, display content in a DaisyUI card (card bg-base-100 shadow-xl), use card-body with proper spacing and sections, show title in card-title with badges for status (badge badge-primary, badge-success, etc.), organize data in description lists using DaisyUI's prose class for readability, display timestamps with relative time and tooltips, handle 404 errors with a centered DaisyUI alert and back button, include action buttons in card-actions (btn btn-primary for edit, btn btn-error for delete), implement delete confirmation using DaisyUI modal with warning styling, add breadcrumbs using DaisyUI breadcrumbs component for navigation, show related data in tabs using DaisyUI tabs component if applicable, implement loading states for individual sections when updating, use DaisyUI divider component to separate sections, include a timeline component for audit history if available, and ensure proper responsive layout with stack on mobile.

### /templates/pages/form.tsx.hbs
Create a Handlebars template for React form components using DaisyUI form styling for creating and editing resources. The template should generate a component that handles both create and edit modes with appropriate titles, create form using DaisyUI form-control wrapper for each field, implement different input types based on schema: text inputs (input input-bordered), textareas (textarea textarea-bordered), selects (select select-bordered), checkboxes (checkbox), radio buttons (radio), file uploads (file-input file-input-bordered), date pickers, and color pickers. Add labels using label component with label-text, show required fields with text-error asterisk, implement client-side validation with error states (input-error) and messages (label-text-alt text-error), show field descriptions using label-text-alt, group related fields using DaisyUI card or divider components, handle form submission with loading state (loading loading-spinner in button), show success using DaisyUI toast or alert-success, display API errors using alert-error with field-specific messages, implement dirty checking with unsaved changes warning, add a sticky footer with form actions (btn btn-primary for submit, btn btn-ghost for cancel), use DaisyUI steps component for multi-step forms if needed, implement field dependencies and conditional rendering, add keyboard shortcuts for save (Ctrl+S) and cancel (Esc), and ensure accessible form with proper ARIA labels.

### /templates/components/ThemeSwitcher.tsx.hbs
Create a Handlebars template for a theme switcher component using DaisyUI's theme capabilities. Generate a client component that reads current theme from localStorage or system preference, renders a DaisyUI dropdown (dropdown dropdown-end) with theme options, use swap component with sun/moon icons for light/dark toggle, list all available themes from configuration with preview colors, implement theme switching by updating data-theme attribute on html element, persist theme choice to localStorage, sync across tabs using storage event listener, show current theme with check mark or active state, include system preference option that follows OS settings, use smooth transitions when switching themes, make component keyboard accessible, position in navbar or as floating button based on layout, and export as reusable component.

### /templates/components/LoadingSpinner.tsx.hbs
Create a Handlebars template for a reusable loading spinner component using DaisyUI loading utilities. Generate a component that accepts size prop (loading-xs, loading-sm, loading-md, loading-lg), type prop (loading-spinner, loading-dots, loading-ring, loading-ball, loading-bars), color prop using DaisyUI color classes, optional overlay prop for full-screen loading with backdrop, optional text prop for loading messages, center content using flex utilities, implement as both inline and overlay variants, add fade-in animation for smooth appearance, make it accessible with proper ARIA attributes, and export with TypeScript props interface.

### /templates/components/ErrorAlert.tsx.hbs
Create a Handlebars template for a reusable error alert component using DaisyUI alert. Generate a component that accepts error object with message and optional details, render using DaisyUI alert with appropriate variant (alert-error, alert-warning), include icon using DaisyUI's alert icon pattern, show error message with optional details in collapsible section, add retry button if retry callback is provided, implement dismiss functionality with fade-out animation, support different layouts (horizontal, vertical), make it stackable for multiple errors, include copy error details button for debugging, auto-dismiss option with timeout, and export with proper TypeScript types.

### /templates/lib/api-client.ts.hbs
Create a Handlebars template that generates a typed API client library with DaisyUI toast integration. The template should import all types from the generated types file, create a base configuration with API URL from environment variables, implement a base fetch wrapper with common functionality, generate classes or objects grouped by API tags or resources, create methods for each API operation with full TypeScript typing, construct proper URLs with path parameter substitution, handle all HTTP methods with appropriate body serialization, include authentication headers from environment variables or auth context, implement request/response interceptors for loading states and error handling, throw custom ApiError with structured error info for DaisyUI alerts, parse responses with proper typing and handle different content types, add JSDoc comments from operation descriptions, support abort controllers for cancellable requests, implement retry logic with exponential backoff for failed requests, include optional toast notifications using a toast manager, track request metrics for performance monitoring, support file uploads with progress tracking, handle pagination headers and return metadata, and export a well-structured API object for easy imports.

### /templates/lib/toast.ts.hbs
Create a Handlebars template for a toast notification manager that integrates with DaisyUI toast component. Generate a ToastManager class that manages a queue of toast notifications, renders toasts in a portal at the edge of the screen, supports different toast types (success, error, warning, info) with DaisyUI alert styling, implements auto-dismiss with configurable duration, supports manual dismiss with close button, handles multiple toasts with stacking and animation, provides promise-based API for confirmation toasts, supports custom content and actions in toasts, implements position configuration (top-right, bottom-center, etc.), adds progress bar for auto-dismiss countdown, ensures accessibility with ARIA live regions, manages z-index for proper layering, and exports singleton instance and hook for React components.

### /templates/project/package.json.hbs
Create a Handlebars template for package.json that includes all necessary dependencies for a Next.js app with DaisyUI. Include "type": "module" for ES Module support, project name derived from OpenAPI info title (converted to kebab-case), version from OpenAPI spec, description from OpenAPI info, comprehensive scripts including dev, build, start, test (using "node --test"), test:coverage, lint, lint:fix, type-check, and theme:check commands. Add dependencies including next@14, react@18, react-dom@18, typescript@5, tailwindcss@3, autoprefixer, postcss, daisyui@4, clsx for conditional classes, and any additional deps based on features used. Include devDependencies for types, prettier, eslint, prettier-plugin-tailwindcss for class sorting, and development tools. Set engines specifying Node.js 18 or higher, configure packageManager if specified, and include proper metadata for a Next.js application with DaisyUI styling.

### /templates/project/tsconfig.json.hbs
Create a Handlebars template for TypeScript configuration suitable for Next.js 14 applications with path aliases. Include compiler options with strict mode enabled, target ES2022 and module ESNext for modern JavaScript, moduleResolution set to bundler, jsx preserve for Next.js, lib including dom, dom.iterable, and ES2022, paths configuration for @ alias pointing to root and specific aliases for @/components, @/lib, @/utils, @/types, etc. Enable skipLibCheck for faster builds, allowJs for gradual migration, forceConsistentCasingInFileNames, all strict type checking flags enabled, and resolveJsonModule. Include proper include patterns for all TypeScript files, exclude node_modules and build directories, and reference Next.js types for proper type support.

### /templates/project/next.config.js.hbs
Create a Handlebars template for Next.js configuration that enables TypeScript, ESLint, and optimizes for DaisyUI. Set reactStrictMode to true, configure compiler options for removing console logs in production, enable SWC minification, set up environment variables including API_URL and theme preferences, configure image domains if the API includes image URLs, add basic security headers with CSP that allows DaisyUI styles, optimize CSS with proper PostCSS configuration, enable experimental features if needed, configure webpack for any custom requirements, and export configuration as an ES module compatible with Next.js 14. Include comments explaining each configuration option.

### /templates/project/tailwind.config.js.hbs
Create a Handlebars template for Tailwind CSS configuration with DaisyUI plugin. Configure content paths including all app, components, and lib directories with TypeScript extensions, theme extend section for any custom colors or spacing from API branding, add DaisyUI plugin with configuration for themes array based on generator options, set darkTheme option for dark mode support, configure logs to false in production, enable styled option for component styling, set base option for base styles, configure utils for utility classes, set prefix if specified in options, add any custom color schemes extracted from OpenAPI spec as custom DaisyUI themes, ensure proper font family configuration, add custom animations if needed, and export as ES module format.

### /templates/project/postcss.config.js.hbs
Create a Handlebars template for PostCSS configuration required for Tailwind CSS. Include tailwindcss plugin, autoprefixer plugin with appropriate browser targets, add cssnano for production optimization with preset 'default', configure any additional PostCSS plugins needed for the project, ensure proper plugin ordering for optimal processing, and export configuration as ES module format. Include comments about the purpose of each plugin.

### /templates/project/globals.css.hbs
Create a Handlebars template for global CSS file with Tailwind directives and custom properties. Include @tailwind base, @tailwind components, and @tailwind utilities directives, add @layer base for custom base styles like font smoothing, create custom CSS properties for dynamic theming if needed, add @layer components for any custom component classes that complement DaisyUI, include @layer utilities for custom utility classes, add any custom animations or transitions, configure selection colors to match theme, set up custom scrollbar styling for webkit browsers, ensure print styles for better printing, and add any responsive typography adjustments.

### /templates/project/layout.tsx.hbs
Create a Handlebars template for the root layout component that sets up the application shell with DaisyUI components. Import required dependencies and global styles, create metadata object from OpenAPI spec info, implement RootLayout component with proper TypeScript types, set up html element with lang attribute and data-theme for DaisyUI, include theme detection script for SSR theme flash prevention, add body with base font and background classes, implement a navbar using DaisyUI navbar component with logo and navigation items derived from API structure, include theme switcher component in navbar, add drawer component for mobile navigation if needed, implement footer with DaisyUI footer component if appropriate, set up any required providers (theme provider, toast provider), include skip navigation link for accessibility, ensure proper meta tags for SEO and social sharing, and implement error boundary for global error handling.

### /templates/project/.env.example.hbs
Create a Handlebars template for environment variables example file that includes all necessary configuration. Add NEXT_PUBLIC_API_URL with a default local development URL, NEXT_PUBLIC_DEFAULT_THEME set to "light" or from generator options, NEXT_PUBLIC_AVAILABLE_THEMES as comma-separated list of DaisyUI themes, API_KEY placeholder if authentication is detected in the OpenAPI spec, any OAuth credentials if OAuth is detected, database URLs if database operations are implied, NEXT_PUBLIC_SITE_NAME from API title, NEXT_PUBLIC_SITE_DESCRIPTION from API description, feature flags for optional functionality, analytics IDs placeholders, and any other environment variables extracted from the spec's server variables or security schemes. Include detailed comments explaining each variable's purpose, format, and where to obtain values.

### /templates/project/.gitignore.hbs
Create a Handlebars template for Git ignore file suitable for Next.js projects with Tailwind CSS. Include node_modules, .next build directory, out directory for static export, .env.local and other environment files (except .env.example), build outputs like dist directories, dependency directories like .pnp and .yarn, IDE files for VS Code (.vscode), WebStorm (.idea), and others, OS files like .DS_Store, Thumbs.db, and desktop.ini, npm and yarn debug logs and error logs, test coverage reports from Node.js test runner, TypeScript build info files (.tsbuildinfo), Tailwind CSS IntelliSense cache, PostCSS cache files, bundle analyzer reports, and any temporary files or directories.

### /templates/project/README.md.hbs
Create a Handlebars template for project README that provides comprehensive documentation. Extract the title from OpenAPI info and format as main heading, include description from OpenAPI spec with proper formatting, add badges for Next.js, TypeScript, and DaisyUI, list prerequisites (Node.js 18+, npm/yarn/pnpm), provide detailed installation instructions with git clone and dependency installation, explain environment setup with reference to .env.example, include all available scripts with descriptions (dev, build, start, test, lint, etc.), document available DaisyUI themes and how to switch them, explain project structure with key directories, provide API documentation summary with links to full docs, include UI component guide showing which DaisyUI components are used, add customization section for theming and styling, mention ES Module usage and Node.js 18+ requirement, provide deployment guides for common platforms, include troubleshooting section for common issues, credit the swagger-to-nextjs generator with version, and add contributing guidelines and license information.
# Additional Template Prompts for CODEGEN-PROMPTS.md

## Missing Templates to Add to Phase 8

### /templates/project/.eslintrc.json.hbs
Create a Handlebars template for ESLint configuration optimized for Next.js with TypeScript and DaisyUI. Configure parser as @typescript-eslint/parser with ecmaVersion latest and sourceType module. Extend from eslint:recommended, plugin:@typescript-eslint/recommended, plugin:react/recommended, plugin:react-hooks/recommended, next/core-web-vitals, and prettier. Set up plugins for @typescript-eslint, react, react-hooks, and import. Configure rules to enforce consistent imports with groups ordered as builtin, external, internal, parent, sibling, index, and type. Disable react/react-in-jsx-scope for Next.js, configure @typescript-eslint/no-unused-vars to ignore underscore prefixed vars, set up naming conventions for interfaces (PascalCase with I prefix optional), and add rules for consistent type imports. Include overrides for test files to allow test globals. Configure settings for React version detection and import resolution for TypeScript.

### /templates/project/.prettierrc.json.hbs
Create a Handlebars template for Prettier configuration with Tailwind CSS plugin support. Set printWidth to 100, tabWidth to 2, use single quotes, add trailing commas in ES5 style, use semicolons, set bracketSpacing to true, use arrow function parentheses only when needed, configure endOfLine as lf for consistency, enable bracketSameLine for JSX, and add plugins array with prettier-plugin-tailwindcss for automatic class sorting. Include overrides for markdown files with different printWidth if needed.

### /templates/project/.stylelintrc.json.hbs
Create a Handlebars template for Stylelint configuration for CSS files with Tailwind CSS. Extend from stylelint-config-standard and stylelint-config-tailwindcss. Configure rules to allow unknown at-rules for Tailwind directives like @tailwind and @layer, disable rules that conflict with Tailwind utilities, allow important declarations for utility overrides, configure selector class pattern to allow Tailwind and DaisyUI classes, and set up proper ordering for CSS properties. Include ignoreFiles for build directories and node_modules.

### /templates/project/.lintstagedrc.json.hbs
Create a Handlebars template for lint-staged configuration. Configure patterns for different file types: "*.{js,jsx,ts,tsx}" to run eslint --fix and prettier --write, "*.{css,scss}" to run stylelint --fix and prettier --write, "*.{json,md,mdx}" to run prettier --write, and "*.{yaml,yml}" to run prettier --write. Ensure commands work with the project structure and installed dependencies.

### /templates/project/env.d.ts.hbs
Create a Handlebars template for TypeScript environment variable declarations. Declare global namespace NodeJS with ProcessEnv interface extending environment variables. Include all NEXT_PUBLIC_ prefixed variables like NEXT_PUBLIC_API_URL (string), NEXT_PUBLIC_DEFAULT_THEME (string), NEXT_PUBLIC_AVAILABLE_THEMES (string), NEXT_PUBLIC_SITE_NAME (string | undefined), and NEXT_PUBLIC_SITE_DESCRIPTION (string | undefined). Add private variables like API_KEY (string | undefined), DATABASE_URL (string | undefined), and any other environment variables defined in .env.example. Include JSDoc comments explaining each variable's purpose. Ensure module declaration for proper TypeScript recognition.

### /templates/project/Dockerfile.hbs
Create a Handlebars template for multi-stage Docker build optimized for Next.js with DaisyUI. Start with node:18-alpine as base stage, set working directory to /app. Create dependencies stage that copies package files, runs npm ci --only=production, and copies node_modules. Create builder stage that copies all package files, runs npm ci, copies source code, generates Prisma client if needed, and runs npm run build. Create runner stage from base, set NODE_ENV to production, create nodejs group and nextjs user for security, copy built application and public files with proper ownership, expose port 3000, set user to nextjs, and use CMD ["node", "server.js"] for standalone build. Include comments explaining each stage and optimization technique.

### /templates/project/docker-compose.yml.hbs
Create a Handlebars template for Docker Compose configuration for development. Define version as "3.8". Create services for the app using build context ".", set container_name from project name, map ports 3000:3000, set environment variables including NODE_ENV as development and API_URL, mount volumes for hot reload including .:/app and /app/node_modules, add depends_on for any required services. If database is needed based on API spec, add postgres or mysql service with proper configuration, volumes for data persistence, and health checks. Include optional services like redis for caching if performance features are detected. Add networks configuration for service communication.

### /templates/project/docker-compose.prod.yml.hbs
Create a Handlebars template for production Docker Compose configuration. Define version as "3.8". Configure app service with image from registry or build, set restart policy to unless-stopped, use environment variables from .env file, remove volume mounts except for necessary data, add health check for the application, configure resource limits for memory and CPU. Include production-optimized database configuration if needed with backup volumes, production environment variables, and security settings. Add nginx service for reverse proxy if needed, with SSL configuration and static file serving. Include monitoring services like Prometheus and Grafana if observability is required.

### /templates/project/.dockerignore.hbs
Create a Handlebars template for Docker ignore file. Include node_modules, npm-debug.log*, yarn-debug.log*, yarn-error.log*, .next, out, .git, .gitignore, README.md, .env*.local, .DS_Store, coverage, .nyc_output, .vscode, .idea, *.swp, *.swo, .vercel, .netlify, docker-compose*.yml, Dockerfile*, and any test directories. Add comments explaining why certain files are excluded to reduce image size and avoid secrets in images.

### /templates/project/.github/workflows/ci.yml.hbs
Create a Handlebars template for GitHub Actions CI workflow. Name it "CI" triggered on push to main/master and pull requests. Set up jobs for lint, test, and build running on ubuntu-latest with Node.js 18. In lint job, checkout code, setup Node.js with cache for npm, install dependencies, run lint script, and run type-check. In test job, run tests with coverage using Node.js test runner, upload coverage reports to Codecov if token is available. In build job, build the application, run Lighthouse CI for performance testing on sample pages, and upload build artifacts. Use matrix strategy if multiple Node versions need testing. Include caching for dependencies and build outputs.

### /templates/project/.github/workflows/deploy.yml.hbs
Create a Handlebars template for deployment workflow. Name it "Deploy" triggered on push to main branch after CI passes. Set up deployment jobs for different environments (staging, production) with environment protection rules. For Vercel deployment, use vercel action with proper tokens, set up preview deployments for PRs. For AWS deployment, configure AWS credentials, build Docker image, push to ECR, update ECS service or Lambda function. For Netlify, use netlify CLI with build command and publish directory. Include smoke tests after deployment, notification steps for Slack or Discord, and rollback strategies. Use secrets for all sensitive tokens and credentials.

### /templates/project/.github/dependabot.yml.hbs
Create a Handlebars template for Dependabot configuration. Set version to 2. Configure package-ecosystem for npm with directory "/" and daily schedule, set open-pull-requests-limit to 10. Group updates by pattern: separate groups for dependencies and devDependencies, special group for DaisyUI and Tailwind updates, group for Next.js and React updates. Add labels for dependencies, javascript, and automated. Configure auto-merge for minor and patch updates of devDependencies. Include reviewers from CODEOWNERS if available.

### /templates/project/.github/PULL_REQUEST_TEMPLATE.md.hbs
Create a Handlebars template for PR template. Include sections for Description (what changes and why), Type of Change (bug fix, new feature, breaking change, documentation), Testing (how has this been tested), Checklist with items: code follows style guidelines, self-review completed, comments added for complex code, documentation updated, no new warnings, tests added and passing, dependent changes merged. Add sections for Screenshots if UI changes, Performance Impact if relevant, and Migration Guide if breaking changes.

### /templates/project/.github/ISSUE_TEMPLATE/bug_report.md.hbs
Create a Handlebars template for bug report issues. Set name as "Bug report", about as "Create a report to help us improve", title prefix as "[BUG]", labels as "bug", assignees as empty. Include sections for Bug Description, To Reproduce with numbered steps, Expected Behavior, Screenshots if applicable, Environment details (OS, Node version, Browser), API Endpoint if relevant, Additional Context, and Possible Solution. Use clear headings and placeholder text to guide users.

### /templates/project/.github/ISSUE_TEMPLATE/feature_request.md.hbs
Create a Handlebars template for feature request issues. Set name as "Feature request", about as "Suggest an idea for this project", title prefix as "[FEATURE]", labels as "enhancement", assignees as empty. Include sections for Is your feature request related to a problem?, Describe the solution, Describe alternatives considered, API Changes Required, UI/UX Considerations for DaisyUI components, Additional Context, and Would you like to implement this feature?. Make it clear and encouraging for contributions.

### /templates/project/vercel.json.hbs
Create a Handlebars template for Vercel configuration. Configure build settings with buildCommand if different from default, set framework to "nextjs", add environment variables for preview and production. Configure headers for security including X-Frame-Options, X-Content-Type-Options, and custom cache headers for static assets. Set up redirects for common patterns like www to non-www. Configure regions if specific geographic deployment is needed. Add functions configuration for API routes with maxDuration based on API complexity. Include crons configuration if scheduled tasks are detected in API spec.

### /templates/project/netlify.toml.hbs
Create a Handlebars template for Netlify configuration. Set build command to "npm run build", publish directory to "out" for static export or ".next" for SSR, add environment variables for build. Configure headers for security and caching, set up redirects including SPA fallback if needed. Add plugins for Next.js if using SSR, configure forms if contact forms are detected, set up edge functions for geographic routing. Include context-specific settings for production, deploy-preview, and branch-deploy with different environment variables.

### /templates/project/serverless.yml.hbs
Create a Handlebars template for Serverless Framework configuration for AWS Lambda deployment. Set service name from API title, provider as AWS with runtime nodejs18.x, region from environment or default to us-east-1. Configure functions for Next.js pages and API routes, set up API Gateway with binary media types for images. Add CloudFront distribution for CDN, S3 bucket for static assets, configure custom domain if provided. Include IAM roles with minimum required permissions, environment variables from SSM parameters, and cost optimization settings like Lambda memory and timeout based on API complexity.

### /templates/project/kubernetes/deployment.yaml.hbs
Create a Handlebars template for Kubernetes deployment. Set apiVersion to apps/v1, kind as Deployment, metadata with name from project and labels. Configure spec with replicas (default 2), selector matching labels, and template. In pod spec, set containers with name, image with tag placeholder, ports (containerPort 3000), environment variables from ConfigMap and Secrets, resources with requests and limits for memory and CPU, livenessProbe and readinessProbe with httpGet to /api/health, and securityContext for non-root user. Include imagePullPolicy as Always for latest tags.

### /templates/project/kubernetes/service.yaml.hbs
Create a Handlebars template for Kubernetes service. Set apiVersion to v1, kind as Service, metadata with name and labels. Configure spec with type LoadBalancer or ClusterIP based on deployment target, ports mapping 80 to 3000, selector matching deployment labels. Add annotations for cloud provider specific load balancer configuration if needed. Include sessionAffinity if stateful features are detected in API.

### /templates/project/docs/API.md.hbs
Create a Handlebars template for API documentation generated from OpenAPI spec. Include title from API info, description with markdown formatting, base URL from servers, authentication methods from security schemes. For each tag/resource, create a section with tag description, list all endpoints with method, path, summary, detailed description, parameter tables (path, query, header, body), request body schema with examples, response codes with descriptions and schemas, example requests using curl and JavaScript fetch, and example responses. Include common error codes section, rate limiting information if present, and webhook documentation if async patterns are detected.

### /templates/project/docs/CONTRIBUTING.md.hbs
Create a Handlebars template for contribution guidelines. Include welcome message, code of conduct reference, how to report bugs with link to issue template, how to suggest features, development setup instructions with prerequisites, clone command, install dependencies, environment setup, and run development server. Add coding standards section referencing ESLint and Prettier, Git commit message format, pull request process with branch naming, commit squashing, and review process. Include testing requirements with Node.js test runner, documentation updates needed, UI component guidelines for DaisyUI consistency, and recognition section for contributors.

### /templates/project/docs/DEPLOYMENT.md.hbs
Create a Handlebars template for deployment documentation. Include deployment overview, prerequisites for each platform, environment variables setup with production values. Create sections for each deployment target: Vercel with CLI and GitHub integration, AWS with Docker/ECS or Lambda/Serverless, Netlify with Git integration, Docker with build commands and registry push, Kubernetes with kubectl commands. Add post-deployment checklist with health checks, smoke tests, monitoring setup, and SSL verification. Include rollback procedures, scaling guidelines, performance optimization tips for DaisyUI and Tailwind, CDN configuration, and troubleshooting common deployment issues.

### /templates/project/.editorconfig.hbs
Create a Handlebars template for EditorConfig file. Set root = true. Configure [*] with charset = utf-8, end_of_line = lf, insert_final_newline = true, trim_trailing_whitespace = true, indent_style = space, indent_size = 2. Add specific overrides: [*.md] with trim_trailing_whitespace = false for markdown, [*.{yml,yaml}] with indent_size = 2 for YAML files, [{package.json,*.json}] with indent_size = 2 for JSON. Include [Makefile] with indent_style = tab if makefiles are used.

### /templates/project/.vscode/settings.json.hbs
Create a Handlebars template for VS Code workspace settings. Configure editor settings with formatOnSave true, defaultFormatter for different file types using prettier, codeActionsOnSave with source.fixAll.eslint true. Set up Tailwind CSS with tailwindCSS.experimental.classRegex for additional class detection patterns, files.associations for Next.js specific files. Configure TypeScript with typescript.tsdk pointing to node_modules, typescript.enablePromptUseWorkspaceTsdk true. Add search exclusions for build directories, Git settings for auto fetch, and terminal integrated env for proper Node version. Include DaisyUI specific settings for better IntelliSense support.

### /templates/project/.vscode/launch.json.hbs
Create a Handlebars template for VS Code debug configuration. Set version "0.2.0". Configure Node.js debugging for Next.js with "Next.js: debug server-side" configuration using node exec with NODE_OPTIONS='--inspect', "Next.js: debug client-side" using Chrome launch with proper URL, and "Next.js: debug full stack" as compound configuration. Add "Debug Tests" configuration for Node.js test runner with --test flag and test file pattern. Include proper source map support, skip files for node_modules, and environment variables loading from .env.local.

### /templates/project/.vscode/extensions.json.hbs
Create a Handlebars template for VS Code recommended extensions. Include recommendations array with: dbaeumer.vscode-eslint for linting, esbenp.prettier-vscode for formatting, bradlc.vscode-tailwindcss for Tailwind IntelliSense, prisma.prisma for database (if used), ms-vscode.vscode-typescript-next for latest TypeScript features, formulahendry.auto-rename-tag for HTML/JSX editing, naumovs.color-highlight for CSS colors, usernamehw.errorlens for inline errors, and PKief.material-icon-theme for better file icons. Add unwantedRecommendations for conflicting extensions.

### /templates/components/ThemeSwitcher.tsx.hbs
Create a Handlebars template for DaisyUI theme switcher component. Import React hooks (useState, useEffect) and any icons needed. Create ThemeSwitcher component that reads current theme from localStorage and data-theme attribute, provides dropdown using DaisyUI dropdown and dropdown-content classes, lists available themes from environment variable or props, shows theme preview colors using DaisyUI color swatches, handles theme change by updating data-theme on html element and localStorage, includes system preference option that follows OS dark/light mode, uses smooth transitions with theme changes, supports keyboard navigation, and exports with proper TypeScript interface for props.

### /templates/components/LoadingSpinner.tsx.hbs
Create a Handlebars template for reusable loading spinner. Import React and define interface for size (xs|sm|md|lg), type (spinner|dots|ring|ball|bars), color (primary|secondary|accent|neutral), overlay (boolean), and text (string) props. Create component that renders DaisyUI loading classes based on props, conditionally wraps in overlay div with backdrop blur if overlay is true, centers content using flex utilities, shows optional loading text below spinner, handles all DaisyUI loading variants, includes fade-in animation, sets proper ARIA labels for accessibility, and exports with TypeScript types and default props.

### /templates/components/ErrorAlert.tsx.hbs
Create a Handlebars template for error alert component. Import React and any needed icons. Define TypeScript interface for error (message, code, details), variant (error|warning|info), onRetry callback, onDismiss callback, and actions array props. Create component that uses DaisyUI alert with appropriate variant class, includes alert icon matching the variant, shows error message as heading, displays error code if present, has collapsible details section for stack traces, includes retry button if callback provided, shows dismiss button or auto-dismiss timer, supports custom action buttons, uses smooth height transitions for collapse, handles keyboard interactions, and exports with proper error boundary integration.


## Phase 9: Test Files

### /test/core/SwaggerLoader.test.js
Create a test file using Node.js built-in test framework for the SwaggerLoader class. Use ES Module imports to import test and assert from 'node:test' and 'node:assert'. Import SwaggerLoader from the source file. Write tests to verify loading from local YAML files, loading from local JSON files, loading from HTTP URLs, detecting and parsing YAML format correctly, detecting and parsing JSON format correctly, resolving $ref references within the document, converting Swagger 2.0 to OpenAPI 3.0 format, extracting branding colors from x-branding extensions, handling file not found errors, handling network errors for URL loading, timeout handling for slow URLs, and theme metadata extraction. Use describe and it blocks for test organization.

### /test/core/SwaggerValidator.test.js
Create a test file using Node.js built-in test framework for the SwaggerValidator class. Use ES Module imports for test, assert, and the SwaggerValidator class. Write tests to verify validation of complete valid specs, detection of missing required fields, generation of operationIds when missing, validation of path operations, detection of invalid $ref references, separation of errors and warnings, detailed error message formatting, handling of empty paths object, validation of response schemas, extraction of UI hints from x-ui extensions, and edge cases in OpenAPI specifications. Use describe and it blocks with async functions where needed.

### /test/core/FileWriter.test.js
Create a test file using Node.js built-in test framework for the FileWriter class. Use ES Module imports and mock file system operations. Write tests to verify directory creation, file writing with content, handling of existing files with force option, dry-run mode operation, error handling for permissions, progress callback execution, atomic write operations, file formatting with Prettier for different file types, CSS file formatting, tracking of written files with categories, and proper cleanup in tests. Use before/after hooks for test setup and cleanup.

### /test/generators/TypeGenerator.test.js
Create a test file using Node.js built-in test framework for the TypeGenerator class. Use ES Module imports for all dependencies. Write tests to verify TypeScript interface generation from schemas, handling of primitive types, array type generation, optional property handling, nullable type unions, enum generation with UI hints, schema composition (allOf, oneOf), JSDoc comment inclusion with UI metadata, circular reference handling, form state type generation, pagination type generation, and proper TypeScript syntax in output. Include sample OpenAPI specs as test fixtures.

### /test/generators/ApiRouteGenerator.test.js
Create a test file using Node.js built-in test framework for the ApiRouteGenerator class. Use ES Module imports throughout. Write tests to verify Next.js route file generation, path parameter conversion to dynamic routes, HTTP method handler creation, TypeScript type imports, request body parsing code, error handling implementation with structured responses, NextRequest/NextResponse usage, pagination implementation for lists, CORS header addition when specified, TODO comment placement, RESTful route organization, and proper file naming conventions. Test with various OpenAPI path configurations.

### /test/generators/PageGenerator.test.js
Create a test file using Node.js built-in test framework for the PageGenerator class testing DaisyUI component generation. Use ES Module imports for all dependencies. Write tests to verify list page generation with DaisyUI table components, proper skeleton loader implementation, pagination component usage, filter and sort controls with DaisyUI inputs, detail page with card layout and badges, form pages with proper DaisyUI form controls, error alert component usage, loading spinner integration, modal usage for confirmations, responsive utility classes, theme-aware component generation, accessibility attributes, and TypeScript typing throughout. Test with various schema types and configurations.

### /test/utils/PathUtils.test.js
Create a test file using Node.js built-in test framework for PathUtils functions. Use ES Module imports to import individual functions. Write tests for OpenAPI to Next.js path conversion, parameter extraction from paths, file system safe path generation, resource grouping logic, collection vs single resource detection, file name generation, component name generation for pages, special character handling, and edge cases in path conversion. Test each exported function individually with various input scenarios.

### /test/utils/SchemaUtils.test.js
Create a test file using Node.js built-in test framework for SchemaUtils functions. Use ES Module imports for all utilities. Write tests for OpenAPI to TypeScript type conversion, primitive type mapping, array type handling, nested object processing, $ref resolution, interface name generation, nullable type handling, enum processing, schema composition handling, circular reference detection, UI component hint extraction, form field type determination, and DaisyUI component selection logic. Include various schema examples as test cases.

### /test/utils/StringUtils.test.js
Create a test file using Node.js built-in test framework for StringUtils functions. Use ES Module imports to test each string manipulation function. Write tests for toPascalCase with various inputs, toCamelCase conversions, toKebabCase formatting, toSnakeCase handling, toUpperCase for constants, pluralization and singularization, acronym preservation, special character handling, human-readable label generation, DaisyUI class name generation, edge cases like empty strings, and mixed format inputs. Ensure comprehensive coverage of all string utilities.


## Phase 10: Example Files

### /examples/petstore.yaml
Create a simple but complete OpenAPI 3.0 specification for a pet store API with UI hints. Include basic info with title "Pet Store API" and version 1.0.0, add x-branding with primaryColor and accentColor for DaisyUI theming. Define three schemas: Pet (with id, name, status enum with x-ui-component: badge, category, photoUrls array with x-ui-component: image-gallery, and tags), Category (id and name), and Tag (id and name with x-ui-color for badge colors). Create CRUD operations for pets including GET /pets (list all with x-ui-pagination true), POST /pets (create with x-ui-form-layout: card), GET /pets/{petId} (get by ID), PUT /pets/{petId} (update), and DELETE /pets/{petId} (delete with x-ui-confirm true). Each operation should have an operationId, summary, tags for grouping, appropriate request/response schemas, and basic error responses (400, 404). Include x-ui extensions for component hints throughout.

### /examples/simple-api.yaml
Create a minimal OpenAPI 3.0 specification for a todo list API with DaisyUI component hints. Include basic info and set x-ui-theme to "cupcake" for a friendly appearance. Define one model: Todo with properties id (string), title (string with x-ui-component: input), description (string with x-ui-component: textarea), completed (boolean with x-ui-component: checkbox), priority (enum: low, medium, high with x-ui-component: select), and createdAt (date-time). Define three endpoints: GET /todos (list all with x-ui-sort: createdAt and x-ui-filter: completed,priority), POST /todos (create new with x-ui-success-message), and GET /todos/{id} (get single todo). Include proper operationIds, request/response schemas, and minimal error handling. This should demonstrate basic DaisyUI integration features.

---

## Build Sequence

When implementing these files, follow this order to avoid dependency issues:

1. **Phase 1**: Foundation (package.json with ES Module config, README, bin entry, CLI with DaisyUI options, orchestrator)
2. **Phase 2**: Core components (loader with theme extraction, validator, file writer) - all using ES Modules
3. **Phase 3**: Utilities (path, string with DaisyUI helpers, schema utils with UI hints) - all using ES Module exports
4. **Phase 4**: Template system (engine with DaisyUI helpers, helpers) - ES Module based
5. **Phase 5**: Base generator with theme support - ES Module class
6. **Phase 6**: Main generators including new TailwindConfigGenerator (can be parallel) - all extending ES Module base
7. **Phase 7**: Config generators including new Tailwind generator (can be parallel after Phase 5) - ES Modules
8. **Phase 8**: Templates including new DaisyUI components (can be parallel)
9. **Phase 9**: Test files using Node.js test runner
10. **Phase 10**: Examples with UI hints

## Key Changes for DaisyUI Integration

1. **All UI components** now use DaisyUI classes:
   - Tables: `table table-zebra table-pin-rows`
   - Forms: `input-bordered`, `select-bordered`, `textarea-bordered`
   - Buttons: `btn btn-primary`, `btn btn-error`, etc.
   - Cards: `card bg-base-100 shadow-xl`
   - Alerts: `alert alert-error`, `alert-success`
   - Loading: `loading loading-spinner`, `skeleton`

2. **New configuration files**:
   - `tailwind.config.js` with DaisyUI plugin
   - `postcss.config.js` for CSS processing
   - `globals.css` with Tailwind directives
   - Component templates for common patterns

3. **Theme support**:
   - CLI options for theme selection
   - Theme switcher component
   - Environment variables for theme configuration
   - Custom theme generation from API branding

4. **Enhanced templates**:
   - All page templates use DaisyUI components
   - Responsive design with DaisyUI utilities
   - Accessibility improvements
   - Better loading and error states

5. **Testing additions**:
   - Tests for DaisyUI component generation
   - Theme configuration testing
   - CSS compilation verification

## Usage Notes

- Each prompt is self-contained and can be used independently
- All generated JavaScript files use ES Module format
- Tests use Node.js built-in test runner (no Jest/Mocha needed)
- Requires Node.js 18+ for full feature support
- Generated apps use DaisyUI 4.x with Tailwind CSS 3.x
- Default themes: light, dark, cupcake, corporate
- When regenerating a file, use the exact prompt for that file
- Test each component after generation before moving to dependent files