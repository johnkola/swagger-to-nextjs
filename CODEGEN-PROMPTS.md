# Swagger-to-Next.js Generator - File Generation Prompts

This document contains all file generation prompts organized by file path. Each prompt can be used independently to generate or regenerate individual files.

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
│   ├── lib/
│   │   └── api-client.ts.hbs
│   └── project/
│       ├── package.json.hbs
│       ├── tsconfig.json.hbs
│       ├── next.config.js.hbs
│       ├── .env.example.hbs
│       ├── .gitignore.hbs
│       └── README.md.hbs
└── examples/
    ├── petstore.yaml
    └── simple-api.yaml
```

---

## Phase 1: Foundation & Core Infrastructure

### /package.json
Create a package.json file for a CLI tool called "swagger-to-nextjs" that generates Next.js applications from OpenAPI specifications. This tool should use Commander.js for CLI parsing, Handlebars for templating, js-yaml for YAML parsing, chalk for colored output, ora for progress spinners, and fs-extra for file operations. Include appropriate npm scripts for testing with Jest, linting with ESLint, and formatting with Prettier. Set up the bin field to point to "./bin/swagger-to-nextjs.js" for global CLI installation. Require Node.js 16 or higher. Include relevant keywords for npm discoverability related to OpenAPI, Swagger, Next.js, code generation, and TypeScript.

### /README.md
Write a comprehensive README for a CLI tool that generates Next.js applications from OpenAPI/Swagger specifications. Explain that this tool takes an OpenAPI spec (YAML or JSON) and generates a complete Next.js 14+ application with TypeScript types, API routes, client library, and UI components. Include installation instructions for global npm installation, a quick start example showing the basic command "swagger-to-nextjs generate petstore.yaml my-app", and explain what gets generated. List key features like TypeScript support, automatic API client generation, CRUD UI components, and customizable templates. Provide basic usage documentation with common options like --force, --dry-run, --no-pages. Include requirements (Node.js 16+) and MIT license information.

### /bin/swagger-to-nextjs.js
Create a Node.js executable file that serves as the entry point for a CLI tool. This file should have a shebang for Node.js, import and execute the main CLI module from '../src/cli.js', handle any uncaught errors gracefully with user-friendly messages, and exit with appropriate status codes. It should also handle SIGINT signals for clean interruption when users press Ctrl+C. The file should be minimal, focusing only on launching the CLI and basic error handling.

### /src/cli.js
Build a Commander.js CLI interface for a Next.js code generator from OpenAPI specs. The main command should be "generate <spec> [output]" where spec is a path to an OpenAPI file and output is the target directory. Include options for --typescript (default true), --client (generate API client, default true), --pages (generate UI components, default true), --force (overwrite without asking), and --dry-run (preview without writing). Show a progress spinner during generation using ora, display colored success/error messages with chalk, and provide helpful next steps after generation. Include proper version handling and comprehensive help text.

### /src/index.js
Create the main orchestrator class for a code generator that coordinates the entire generation process from OpenAPI spec to Next.js application. This class should accept configuration options in its constructor, have a main generate() method that sequentially runs all generation steps, coordinate loading the spec, validating it, and running various generators (types, API routes, client, pages, project files). It should emit events for progress tracking, handle errors gracefully with helpful messages, and return a summary of generated files. The class should support both CLI usage and programmatic usage as a library.

---

## Phase 2: Core System Components

### /src/core/SwaggerLoader.js
Create a class that loads and parses OpenAPI/Swagger specifications from various sources. It should support loading from local file paths and HTTP/HTTPS URLs, automatically detect JSON vs YAML format, parse YAML using js-yaml library, resolve internal $ref references within the document, support both OpenAPI 3.x and Swagger 2.0 formats (converting Swagger 2.0 to OpenAPI 3.0 structure internally), handle file reading and network errors gracefully, implement basic timeout for URL fetching, and return a normalized specification object ready for processing.

### /src/core/SwaggerValidator.js
Build a validator class for OpenAPI specifications that ensures the spec is valid and ready for code generation. It should check for required fields (openapi/swagger version, info, paths), verify each path has at least one operation, generate missing operationIds from path and method, validate that all referenced schemas exist, check for common issues like empty paths or missing response schemas, separate validation results into errors (blocking) and warnings (non-blocking), provide detailed error messages with the path to the problem (e.g., "paths./pets.get.responses.200.content is missing"), and return a validation result object with valid boolean, errors array, and warnings array.

### /src/core/FileWriter.js
Create a file writer class that handles all file system operations for the code generator. It should create nested directories recursively, check for existing files and handle conflicts based on options (force overwrites, interactive prompts, or skip), support dry-run mode that logs what would be written without actually writing, format code files appropriately (TypeScript/JavaScript files with Prettier), track all written files for final summary reporting, handle file system errors gracefully (permissions, disk space), provide progress callbacks for each file written, and ensure atomic writes to prevent partial file generation.

---

## Phase 3: Utility Modules

### /src/utils/PathUtils.js
Create a utility module for path and route manipulation between OpenAPI and Next.js conventions. Include functions to convert OpenAPI paths like /users/{userId}/posts/{postId} to Next.js routes like /users/[userId]/posts/[postId], extract parameter names from paths, convert paths to file system safe directory structures, group related paths by resource (all /users paths together), determine if a path represents a collection (typically GET without ID) or single resource, generate appropriate file names from paths, handle special characters and edge cases in path conversion, and ensure all generated paths are valid for both Next.js routing and file systems.

### /src/utils/StringUtils.js
Create a comprehensive string manipulation utility module for various naming convention conversions needed in code generation. Include functions to convert strings between different cases: toPascalCase (for class names like UserProfile), toCamelCase (for variables like userId), toKebabCase (for file names like user-profile), toSnakeCase (for some APIs like user_id), and toUpperCase (for constants like USER_ID). Add functions for pluralization and singularization of resource names, capitalizing first letters, sanitizing strings to valid JavaScript identifiers, handling special characters and numbers in conversions, preserving acronyms appropriately (API stays API, not Api), and ensuring all conversions handle edge cases like empty strings, single characters, and mixed input formats.

### /src/utils/SchemaUtils.js
Build a utility module for converting OpenAPI schemas to TypeScript types and handling schema-related operations. Create functions to convert OpenAPI schema objects to TypeScript type strings, map OpenAPI types (string, integer, number, boolean) to TypeScript types, handle array types with proper TypeScript array syntax, process nested object schemas recursively, resolve $ref references to get actual schema definitions, generate valid TypeScript interface names from schema names, handle nullable types using TypeScript union types, process enum schemas to TypeScript enums or union types, manage schema composition (allOf, oneOf, anyOf), detect and handle circular references, and extract descriptions for JSDoc comments.

---

## Phase 4: Template System

### /src/templates/TemplateEngine.js
Create a template engine wrapper class around Handlebars that manages template loading and rendering for the code generator. This class should load templates from the templates directory, compile and cache templates for performance, register custom Handlebars helpers for code generation tasks, support template overrides from user-specified directories, render templates with provided data contexts, handle missing templates with clear error messages, support partials for reusable template fragments, and provide debugging information when template rendering fails.

### /src/templates/helpers.js
Create a module that exports custom Handlebars helper functions specifically designed for code generation tasks. Include helpers for case conversion: pascalCase (convert any string to PascalCase for class names), camelCase (for variable names), kebabCase (for file names), and upperCase (for constants). Add helpers for type generation: typeString (convert OpenAPI schema to TypeScript type string), isRequired (check if a property is in the required array), and isNullable (determine if a type should be nullable). Include path helpers: pathToRoute (convert OpenAPI path to Next.js route), extractPathParams (get parameter names from path), and routeToFilePath (convert route to file system path). Add utility helpers: hasBody (check if operation has request body), getSuccessStatus (determine success response code), and jsonStringify (safely stringify objects for templates).

---

## Phase 5: Base Generator

### /src/generators/BaseGenerator.js
Create an abstract base class that all specific generators (types, API routes, pages, etc.) will extend. This class should accept the OpenAPI specification and generator options in its constructor, define an abstract generate() method that subclasses must implement, provide common utility methods like getOperations() to extract all operations from paths, getSchemas() to get all schema definitions, and renderTemplate() to render Handlebars templates. Include event emission for progress reporting, error handling with context about what was being generated, support for dry-run mode, and helper methods for common tasks like creating operation IDs or extracting path parameters.

---

## Phase 6: Main Code Generators

### /src/generators/TypeGenerator.js
Build a generator class extending BaseGenerator that creates TypeScript type definitions from OpenAPI schemas. This generator should create a single types/api.ts file containing all type definitions, convert each OpenAPI schema to a TypeScript interface, handle all OpenAPI data types (string, number, boolean, array, object), support nullable properties using union types, handle optional properties with TypeScript's optional operator, generate enums from string enumeration schemas, handle schema composition (allOf, oneOf, anyOf), add JSDoc comments from schema descriptions, resolve $ref references to other schemas, handle circular references gracefully, and export all generated interfaces and types for use in other generated files.

### /src/generators/ApiRouteGenerator.js
Create a generator class that produces Next.js 14 App Router API route handlers from OpenAPI path definitions. For each path in the OpenAPI spec, generate a route.ts file in the appropriate app/api directory structure, convert OpenAPI paths like /pets/{id} to Next.js dynamic routes like /pets/[id], create named export functions for each HTTP method (GET, POST, PUT, DELETE, PATCH), import generated TypeScript types for request/response typing, add request body parsing and basic validation, include proper error handling with appropriate HTTP status codes, use NextRequest and NextResponse from Next.js, add TODO comments where business logic should be implemented, and organize routes following RESTful conventions.

### /src/generators/ClientGenerator.js
Build a generator that creates a typed API client library for the frontend to communicate with the API. Generate a lib/api-client.ts file that groups API operations by tags (if present) or by resource paths, creates a function for each operation with full TypeScript typing, uses the native fetch API with proper error handling, constructs URLs with path parameters, handles different HTTP methods and request bodies, includes authentication headers from environment variables, throws custom ApiError for non-2xx responses, parses JSON responses with proper typing, includes JSDoc comments from operation descriptions, and exports a well-organized API object (like api.pets.list(), api.pets.create()).

### /src/generators/PageGenerator.js
Create a generator that produces React components for user interfaces based on API operations. For GET operations returning arrays, generate list pages showing all items in a table with links to details, for GET operations with ID parameters, generate detail pages showing single item data, for POST/PUT operations, generate form pages with inputs for each schema property. All generated components should use Next.js 14 App Router conventions, include 'use client' directive for client components, import and use the generated API client, implement loading states while fetching data, handle errors gracefully with retry options, use TypeScript throughout with proper typing, include basic CSS modules for styling, and follow React best practices with hooks.

### /src/generators/ProjectGenerator.js
Build a generator that creates all the necessary project configuration and setup files for a Next.js application. Generate package.json with Next.js, React, TypeScript dependencies and appropriate scripts, create tsconfig.json with strict TypeScript settings and path aliases, generate next.config.js with basic configuration and environment variable setup, create .env.example with API_URL and other necessary variables, generate .gitignore suitable for Next.js projects, create a README.md with project setup instructions extracted from the OpenAPI spec info, and ensure all configuration files work together cohesively for a production-ready setup.

---

## Phase 7: Configuration Generators

### /src/generators/config/ConfigHelpers.js
Create a utility module with shared helper methods for configuration generation. Include template helper registration for Handlebars helpers, project name extraction and sanitization from OpenAPI spec, API feature analysis to determine required dependencies, environment variable extraction from security schemes, build configuration preparation, security configuration setup, image domain extraction from server URLs, package manager command helpers for different managers (npm, yarn, pnpm), secret generation utilities for secure tokens, and YAML/JSON stringification helpers with proper formatting.

### /src/generators/config/TypeScriptConfigGenerator.js
Build a TypeScript configuration generator that creates tsconfig.json with strict type checking enabled for maximum type safety, configures path aliases for clean imports (@/components, @/lib, @/utils, etc.), sets up appropriate compiler options for Next.js 14+ including module resolution, enables all strict checks and additional safety options like noUncheckedIndexedAccess, configures module resolution for the bundler with proper settings, sets up incremental compilation for faster builds, includes proper lib references for DOM and ESNext features, generates type declaration files for global types and API types, and creates next-env.d.ts for Next.js type definitions.

### /src/generators/config/NextConfigGenerator.js
Create a specialized generator for Next.js configuration that generates next.config.js with optimization settings for production builds, configures image optimization with proper domains and formats extracted from API spec, sets up internationalization if locale patterns are detected in the API, implements security headers and CSP policies for protection, configures experimental features and build optimizations, handles environment variables for client-side usage with NEXT_PUBLIC_ prefix, sets up redirects, rewrites, and custom headers based on API patterns, and supports different deployment targets including standalone for Docker and static export.

### /src/generators/config/PackageConfigGenerator.js
Create a package configuration generator that generates package.json with analyzed dependencies from OpenAPI spec and project requirements. Add appropriate scripts for development, testing, building, and deployment, configure package manager specific settings (npm, yarn, pnpm), set up engine requirements and peer dependencies, configure pre-commit hooks with Husky and lint-staged, add database-specific scripts for Prisma migrations and seeding, configure test runners with Jest and coverage settings, include proper metadata, keywords, and licensing information, and generate additional config files like .npmrc, .nvmrc, and .gitignore.

### /src/generators/config/LintingConfigGenerator.js
Create a comprehensive linting configuration generator that handles both ESLint and Prettier. Generate ESLint configuration with TypeScript support and Next.js specific rules, implement API-specific linting rules for consistent endpoint patterns, configure import ordering and sorting with proper grouping, set up security-focused linting rules to catch vulnerabilities, create Prettier configuration with team-friendly defaults, ensure ESLint and Prettier work together without conflicts, add accessibility rules for React components, support different style guides (Airbnb, Standard, Google) based on project preferences, and generate lint-staged configuration for pre-commit hooks.

### /src/generators/config/EnvironmentConfigGenerator.js
Build an environment configuration generator that creates type-safe environment validation using Zod schemas, generates .env.example with documented variables extracted from OpenAPI spec, creates .env.local with secure random secrets for development, generates TypeScript definitions for process.env with proper typing, extracts environment variables from OpenAPI security schemes and server configurations, separates public and private environment variables following Next.js conventions, handles database URLs and authentication secrets, provides environment-specific configurations for development, staging, and production, and generates comprehensive documentation for all environment variables.

### /src/generators/config/DockerConfigGenerator.js
Build a Docker configuration generator that creates multi-stage Dockerfile with security best practices, optimized Node.js Alpine-based images with proper layer caching, Docker Compose configuration for service orchestration including development and production variants, health check implementations for container monitoring, non-root user setup for security compliance, efficient layer caching strategies to speed up builds, volume management for development and production environments, network configuration for microservices architecture, and .dockerignore file with appropriate exclusions. Include helper scripts for building, running, and managing Docker containers.

### /src/generators/config/CICDConfigGenerator.js
Create a CI/CD configuration generator that produces GitHub Actions workflows for testing, building, and deployment. Generate multi-job pipelines with proper dependencies, security scanning integration (Snyk, CodeQL), automated testing across multiple Node versions, build artifact management, and deployment jobs for different platforms (Vercel, AWS, Docker). Include Dependabot configuration for dependency updates, PR and issue templates for better collaboration, and branch protection rules. The generator should create workflows for main CI/CD pipeline, PR-specific checks, security scanning, and release automation. Also generate supporting files like contributing guidelines, code of conduct, and security policy.

### /src/generators/config/DeploymentConfigGenerator.js
Build a deployment configuration generator that creates platform-specific configs for Vercel, AWS, Netlify, and Docker deployments. Generate Vercel configuration with build settings and environment variables, AWS deployment configuration including serverless.yml and SAM templates, custom deployment scripts for various platforms, platform-specific optimizations for performance, CDN and caching configurations, domain and SSL settings, and scaling and performance configurations. Include Kubernetes manifests, Docker Compose variations for different environments, and deployment automation scripts.

### /src/generators/config/DocumentationGenerator.js
Build a documentation generator that creates comprehensive documentation from OpenAPI specifications. Generate README.md with project overview extracted from API info, complete API endpoint documentation with request/response examples, environment variable documentation with descriptions and examples, project structure visualization showing all generated files, contributing guidelines for team collaboration, development workflow documentation, deployment instructions for multiple platforms, and troubleshooting guides for common issues. Include quick start guides, API reference documentation, and tech stack information.

### /src/generators/config/EditorConfigGenerator.js
Create an editor configuration generator that produces .editorconfig for consistent coding styles across different editors, VS Code settings.json with recommended extensions and workspace configurations, VS Code launch.json configurations for debugging Next.js applications, Git configuration files including comprehensive .gitignore patterns, team-specific editor preferences and code formatting rules, file associations and language-specific settings, workspace recommendations for development efficiency, and Git hooks configuration using Husky for pre-commit and pre-push checks.

---

## Phase 8: Template Files

### /templates/types/api.ts.hbs
Create a Handlebars template that generates a TypeScript type definition file from OpenAPI schemas. The template should produce a file header comment indicating it's auto-generated, iterate through all schemas and generate TypeScript interfaces, handle primitive types, arrays, and nested objects, use TypeScript's optional operator (?) for optional properties, generate union types for nullable properties, create enum types from string enumerations, add JSDoc comments from schema descriptions, ensure proper TypeScript syntax with semicolons, export all interfaces and types, and organize related types with section comments. The output should be clean, readable TypeScript that passes strict type checking.

### /templates/api/[...route].ts.hbs
Create a Handlebars template for Next.js 14 App Router API route handlers. The template should generate imports for NextRequest and NextResponse from 'next/server', import necessary types from the generated types file, create named export functions for each HTTP method present in the OpenAPI path, include TypeScript typing for request parameters and bodies, add try-catch blocks for error handling, parse request bodies for POST/PUT/PATCH requests, include basic validation comments, return appropriate NextResponse.json() with status codes, add TODO comments where developers should implement business logic, handle path parameters for dynamic routes, and follow Next.js App Router conventions for API routes.

### /templates/pages/list.tsx.hbs
Create a Handlebars template for React list page components that display collections of resources. The template should generate a client component with 'use client' directive, import necessary types and the API client, use React hooks (useState, useEffect) for state management, fetch data on component mount using the API client, implement loading state while data is fetching, display data in a simple table format with appropriate columns, handle errors with user-friendly messages and retry options, include links to detail pages for each item if applicable, add a button to create new items if POST operation exists, use basic CSS modules for styling, and ensure full TypeScript typing throughout the component.

### /templates/pages/detail.tsx.hbs
Create a Handlebars template for React detail page components that display single resource data. Generate a client component that accepts ID from route parameters, fetches single item data using the API client, shows loading skeleton while fetching, displays all properties of the resource in a readable format, handles 404 errors when resource is not found, includes edit button if PUT operation exists for the resource, includes delete button with confirmation if DELETE operation exists, adds navigation back to the list page, implements proper error handling with retry capability, uses TypeScript for all props and state, and includes basic styling for a clean presentation.

### /templates/pages/form.tsx.hbs
Create a Handlebars template for React form components used for creating and editing resources. The template should generate a component that handles both create (POST) and edit (PUT) modes, creates form fields for each property in the schema, uses controlled components with React state, implements client-side validation based on schema constraints, handles form submission using the API client, shows loading state during submission, displays success messages and redirects after successful submission, shows error messages for failed submissions, includes a cancel button to return to previous page, uses TypeScript for form data typing, and provides a clean, accessible form layout.

### /templates/lib/api-client.ts.hbs
Create a Handlebars template that generates a typed API client library. The template should import all types from the generated types file, create a base configuration with API URL from environment variables, generate classes or objects grouped by API tags or resources, create methods for each API operation with full TypeScript typing, construct proper URLs with path parameter substitution, handle all HTTP methods (GET, POST, PUT, DELETE, PATCH), include request headers and authentication setup, implement error handling with custom ApiError class, parse responses with proper typing, add JSDoc comments from operation descriptions, and export a well-structured API object for easy imports.

### /templates/project/package.json.hbs
Create a Handlebars template for package.json that includes project name derived from OpenAPI info title (converted to kebab-case), version from OpenAPI spec, description from OpenAPI info, scripts for dev, build, start, lint, and type-check commands, dependencies including next@14, react@18, react-dom@18, typescript@5, and any additional deps based on features used, devDependencies for types and development tools, engines specifying Node.js 18 or higher, and proper package configuration for a Next.js application.

### /templates/project/tsconfig.json.hbs
Create a Handlebars template for TypeScript configuration suitable for Next.js 14 applications. Include compiler options with strict mode enabled, target ES2022 and module ESNext, moduleResolution set to bundler, jsx preserve for Next.js, lib including dom and ES2022, paths configuration for @ alias pointing to root, skipLibCheck for faster builds, allowJs for gradual migration, and all strict type checking flags enabled. Include next.config.js in the configuration, exclude node_modules and build directories.

### /templates/project/next.config.js.hbs
Create a Handlebars template for Next.js configuration that enables TypeScript and ESLint, sets reactStrictMode to true, configures environment variables including API_URL, sets up image domains if the API includes image URLs, adds basic security headers, enables SWC minification, and exports configuration as an ES module compatible with Next.js 14.

### /templates/project/.env.example.hbs
Create a Handlebars template for environment variables example file that includes NEXT_PUBLIC_API_URL with a default local development URL, API_KEY placeholder if authentication is detected in the OpenAPI spec, any other environment variables extracted from the spec's server variables or security schemes, comments explaining each variable's purpose, and example values that work for local development.

### /templates/project/.gitignore.hbs
Create a Handlebars template for Git ignore file suitable for Next.js projects. Include node_modules, .next build directory, .env.local and other environment files (except .env.example), build outputs like out and dist directories, dependency directories like .pnp, IDE files for VS Code, WebStorm, and others, OS files like .DS_Store and Thumbs.db, npm and yarn debug logs, test coverage reports, and TypeScript build info files.

### /templates/project/README.md.hbs
Create a Handlebars template for project README that extracts the title from OpenAPI info, includes description from OpenAPI spec, lists prerequisites (Node.js 18+, npm or yarn), provides installation instructions, explains environment setup with reference to .env.example, includes commands for development, building, and starting the production server, credits the swagger-to-nextjs generator, and provides any additional notes based on the API's features or requirements.

---

## Phase 9: Example Files

### /examples/petstore.yaml
Create a simple but complete OpenAPI 3.0 specification for a pet store API. Include basic info with title "Pet Store API" and version 1.0.0, define three schemas: Pet (with id, name, status, category, and tags), Category (id and name), and Tag (id and name). Create CRUD operations for pets including GET /pets (list all), POST /pets (create), GET /pets/{petId} (get by ID), PUT /pets/{petId} (update), and DELETE /pets/{petId} (delete). Each operation should have an operationId, summary, appropriate request/response schemas, and basic error responses (400, 404). Keep it simple but complete enough to test all generator features.

### /examples/simple-api.yaml
Create a minimal OpenAPI 3.0 specification for a todo list API to serve as the simplest possible example. Include just one model: Todo with properties id (string), title (string), completed (boolean), and createdAt (date-time). Define only three endpoints: GET /todos (list all), POST /todos (create new), and GET /todos/{id} (get single todo). Include proper operationIds, request/response schemas, and minimal error handling. This should be the bare minimum needed to demonstrate the generator's capabilities.

---

## Build Sequence

When implementing these files, follow this order to avoid dependency issues:

1. **Phase 1**: Foundation (package.json, README, bin entry, CLI, orchestrator)
2. **Phase 2**: Core components (loader, validator, file writer)
3. **Phase 3**: Utilities (path, string, schema utils)
4. **Phase 4**: Template system (engine, helpers)
5. **Phase 5**: Base generator
6. **Phase 6**: Main generators (can be parallel)
7. **Phase 7**: Config generators (can be parallel after Phase 5)
8. **Phase 8**: Templates (can be parallel)
9. **Phase 9**: Examples

## Usage Notes

- Each prompt is self-contained and can be used independently
- When regenerating a file, use the exact prompt for that file
- Test each component after generation before moving to dependent files
- Configuration generators (Phase 7) can be developed in parallel once BaseGenerator exists
- Templates (Phase 8) can be adjusted based on generator output
