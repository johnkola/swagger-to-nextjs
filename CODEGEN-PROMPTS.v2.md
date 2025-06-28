# Swagger-to-Next.js Generator - Implementation Guide

This document provides comprehensive implementation prompts for building a CLI tool that generates Next.js applications from OpenAPI specifications with DaisyUI component integration.

## Executive Summary

The Swagger-to-Next.js Generator transforms OpenAPI/Swagger specifications into complete Next.js 14+ applications featuring TypeScript support, DaisyUI-styled components, and ES Module architecture. This guide contains detailed prompts for implementing each component of the system, organized by development phase.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Requirements](#architecture-requirements)
3. [Project Structure](#project-structure)
4. [Implementation Phases](#implementation-phases)
5. [Build Sequence](#build-sequence)
6. [Key Implementation Guidelines](#key-implementation-guidelines)

---

## Project Overview

### Purpose

This CLI tool generates production-ready Next.js applications from OpenAPI specifications, incorporating modern web development practices and beautiful UI components from DaisyUI.

### Core Features

- **Template-Based Generation**: All code generation occurs through Handlebars templates
- **TypeScript First**: Full TypeScript support with strict typing
- **DaisyUI Integration**: Pre-styled components for rapid UI development
- **ES Modules**: Modern JavaScript module system throughout
- **Service-Oriented Architecture**: Clean separation between API routes and service layers
- **Comprehensive Testing**: Native Node.js test runner support

### Technical Requirements

- Node.js 18+ (required for native test runner)
- ES Modules enabled (`type: "module"` in package.json)
- All code generation through templates (no hardcoded content)
- DaisyUI components for all UI elements

---

## Architecture Requirements

### Design Principles

1. **Template-Driven Generation**: Generators prepare context data only; templates contain all code generation logic
2. **ES Module Consistency**: All JavaScript files use ES Module syntax
3. **Service Layer Pattern**: API routes delegate to service wrappers for business logic
4. **Standardized Error Handling**: Consistent error responses across all endpoints
5. **Authentication Middleware**: Centralized authentication handling for protected routes

### Key Architectural Decisions

- **No Hardcoded Content**: Generators must never construct file content directly
- **Template Engine Usage**: All file generation must use TemplateEngine.render()
- **Native Testing**: Use Node.js built-in test runner instead of external frameworks
- **Component Library**: DaisyUI provides all UI components with consistent theming

---

## Project Structure

```
swagger-to-nextjs/
├── package.json                      # ES Module configuration
├── README.md                         # Comprehensive documentation
├── bin/
│   └── swagger-to-nextjs.js         # CLI entry point
├── src/
│   ├── index.js                     # Main orchestrator
│   ├── cli.js                       # Commander.js CLI interface
│   ├── core/                        # Core system components
│   │   ├── SwaggerLoader.js         # OpenAPI spec loader
│   │   ├── SwaggerValidator.js      # Spec validation
│   │   └── FileWriter.js            # File system operations
│   ├── generators/                  # Code generators
│   │   ├── BaseGenerator.js         # Abstract base class
│   │   ├── TypeGenerator.js         # TypeScript types
│   │   ├── ApiRouteGenerator.js     # API route handlers
│   │   ├── ServiceGenerator.js      # Service wrappers
│   │   ├── PageGenerator.js         # React components
│   │   ├── ClientGenerator.js       # API client library
│   │   ├── ProjectGenerator.js      # Project configuration
│   │   └── config/                  # Configuration generators
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
│   ├── templates/                   # Template management
│   │   ├── TemplateEngine.js        # Handlebars wrapper
│   │   ├── helpers.js               # Template helpers
│   │   └── TemplateTester.js        # Template validation
│   └── utils/                       # Utility modules
│       ├── PathUtils.js             # Path manipulation
│       ├── SchemaUtils.js           # Schema processing
│       └── StringUtils.js           # String manipulation
├── templates/                       # Handlebars templates
│   ├── types/
│   │   └── api.ts.hbs              # TypeScript types
│   ├── api/
│   │   └── [...route].ts.hbs       # API route handlers
│   ├── services/
│   │   ├── [resource]-service.ts.hbs      # Service wrappers
│   │   └── [resource]-api-handler.ts.hbs   # API utilities
│   ├── pages/
│   │   ├── list.tsx.hbs            # List components
│   │   ├── detail.tsx.hbs          # Detail components
│   │   └── form.tsx.hbs            # Form components
│   ├── components/
│   │   ├── ThemeSwitcher.tsx.hbs   # Theme switching
│   │   ├── LoadingSpinner.tsx.hbs  # Loading states
│   │   └── ErrorAlert.tsx.hbs      # Error display
│   ├── lib/
│   │   ├── api-client.ts.hbs       # API client
│   │   ├── toast.ts.hbs            # Notifications
│   │   ├── service-wrapper.ts.hbs  # Service wrapper
│   │   ├── service-hooks.ts.hbs    # React hooks
│   │   ├── unified-index.ts.hbs    # Unified client
│   │   ├── unified-client.ts.hbs   # Client config
│   │   ├── mock-client.ts.hbs      # Mock implementation
│   │   ├── service-types.d.ts.hbs  # Type declarations
│   │   └── service-config.ts.hbs   # Service config
│   ├── utils/
│   │   └── logger.ts.hbs           # Logging utility
│   └── project/                     # Project configuration
│       └── [various config files]
├── test/                           # Test files
│   ├── core/
│   ├── generators/
│   └── utils/
└── examples/                       # Example specifications
    ├── petstore.yaml
    └── simple-api.yaml
```

---

## Implementation Phases

### Phase 1: Foundation & Core Infrastructure

#### /package.json

Create a package.json file for a CLI tool called "swagger-to-nextjs" that generates Next.js applications from OpenAPI specifications with DaisyUI component integration. Set "type": "module" to enable ES Modules throughout the project. This tool should use Commander.js for CLI parsing, Handlebars for templating, js-yaml for YAML parsing, chalk for colored output, ora for progress spinners, and fs-extra for file operations. Include appropriate npm scripts for testing using Node.js built-in test runner with "test": "node --test test/**/*.test.js", and coverage with "test:coverage": "node --test --experimental-test-coverage test/**/*.test.js". Add scripts for linting with ESLint and formatting with Prettier. Set up the bin field to point to "./bin/swagger-to-nextjs.js" for global CLI installation. Require Node.js 18 or higher (for native test runner support). Include relevant keywords for npm discoverability related to OpenAPI, Swagger, Next.js, code generation, TypeScript, DaisyUI, and Tailwind CSS.

#### /README.md

Write a comprehensive README for a CLI tool that generates Next.js applications from OpenAPI/Swagger specifications with beautiful DaisyUI components. Explain that this tool takes an OpenAPI spec (YAML or JSON) and generates a complete Next.js 14+ application with TypeScript types, API routes, client library, and UI components styled with DaisyUI. Mention that the project uses ES Modules and requires Node.js 18+. Include installation instructions for global npm installation, a quick start example showing the basic command "swagger-to-nextjs generate petstore.yaml my-app", and explain what gets generated including DaisyUI-styled components. List key features like TypeScript support, automatic API client generation, CRUD UI components with DaisyUI theming, responsive design out of the box, dark mode support, and customizable templates. Provide basic usage documentation with common options like --force, --dry-run, --no-pages, --theme (for DaisyUI theme selection), --themes (list of themes to include). Include a section on theming explaining how to customize DaisyUI themes. Include a testing section explaining how to run tests using the native Node.js test runner. Include requirements (Node.js 18+) and MIT license information.

#### /bin/swagger-to-nextjs.js

Create a Node.js executable file using ES Module syntax that serves as the entry point for a CLI tool. This file should have a shebang for Node.js, import and execute the main CLI module using ES Module import from '../src/cli.js', handle any uncaught errors gracefully with user-friendly messages, and exit with appropriate status codes. It should also handle SIGINT signals for clean interruption when users press Ctrl+C. The file should be minimal, focusing only on launching the CLI and basic error handling. Use top-level await if needed and ensure all imports use ES Module syntax.

#### /src/cli.js

Build a Commander.js CLI interface using ES Module syntax for a Next.js code generator from OpenAPI specs with DaisyUI styling options. Import Commander using ES Module syntax. The main command should be "generate <spec> [output]" where spec is a path to an OpenAPI file and output is the target directory. Include options for --typescript (default true), --client (generate API client, default true), --pages (generate UI components, default true), --force (overwrite without asking), --dry-run (preview without writing), --theme <theme> (DaisyUI theme selection, default "light"), --themes <themes...> (list of DaisyUI themes to include, default ["light", "dark", "cupcake", "corporate"]), --no-daisyui (generate without DaisyUI, use plain CSS), and --custom-theme <path> (path to custom DaisyUI theme file). Add --config <path> option for configuration file support. Add new command "generate-from-config <config-file> [output]" that uses OpenAPI Generator config files. Add "test-templates" command with --verbose and --list options for template validation. Import and use ora for progress spinner and chalk for colored messages using ES Module imports. Display colored success/error messages and provide helpful next steps after generation including how to switch themes. Include proper version handling by reading package.json using fs.readFileSync and JSON.parse, and comprehensive help text. Export the CLI setup as the default export.

#### /src/index.js

Create the main orchestrator class using ES Module syntax for a code generator that coordinates the entire generation process from OpenAPI spec to Next.js application with DaisyUI components. Use ES Module imports for all dependencies. Import TemplateTester class for template validation. This class should accept configuration options in its constructor including theme preferences, have a main generate() method that sequentially runs all generation steps, coordinate loading the spec, validating it, running template tests via testTemplates() method if enabled, and running various generators (types, API routes, client, pages with DaisyUI components, project files including Tailwind config). Add initialize() method that supports loading configuration from files (JSON or YAML). It should emit events for progress tracking using EventEmitter, handle errors gracefully with helpful messages, track DaisyUI theme configuration throughout the process, emit progress events for template testing phase, and return a summary of generated files. Export the class as the default export. The class should support both CLI usage and programmatic usage as a library.

### Phase 2: Core System Components

#### /src/core/SwaggerLoader.js

Create a class using ES Module syntax that loads and parses OpenAPI/Swagger specifications from various sources. Import dependencies like js-yaml, fs-extra, and node-fetch using ES Module imports. The class should support loading from local file paths and HTTP/HTTPS URLs, automatically detect JSON vs YAML format, parse YAML using js-yaml library, resolve internal $ref references within the document, support both OpenAPI 3.x and Swagger 2.0 formats (converting Swagger 2.0 to OpenAPI 3.0 structure internally), handle file reading and network errors gracefully, implement basic timeout for URL fetching, extract any branding colors or theme information from the spec for potential DaisyUI theme customization, and return a normalized specification object ready for processing. Export the class as the default export.

#### /src/core/SwaggerValidator.js

Build a validator class using ES Module syntax for OpenAPI specifications that ensures the spec is valid and ready for code generation. Import necessary utilities using ES Module imports. It should check for required fields (openapi/swagger version, info, paths), verify each path has at least one operation, generate missing operationIds from path and method, validate that all referenced schemas exist, check for common issues like empty paths or missing response schemas, extract any UI hints or display preferences from spec extensions that could influence DaisyUI component selection, separate validation results into errors (blocking) and warnings (non-blocking), provide detailed error messages with the path to the problem (e.g., "paths./pets.get.responses.200.content is missing"), and return a validation result object with valid boolean, errors array, and warnings array. Export as default.

#### /src/core/FileWriter.js

Create a file writer class using ES Module syntax that handles all file system operations for the code generator. Import fs-extra and other dependencies using ES Module imports. It should create nested directories recursively, check for existing files and handle conflicts based on options (force overwrites, interactive prompts, or skip), support dry-run mode that logs what would be written without actually writing, format code files appropriately (TypeScript/JavaScript files with Prettier, CSS files with Prettier CSS parser), track all written files for final summary reporting including count of DaisyUI components used, handle file system errors gracefully (permissions, disk space), provide progress callbacks for each file written, ensure atomic writes to prevent partial file generation, and create proper directory structure for Next.js App Router with Tailwind CSS. Export as default.

### Phase 3: Utility Modules

#### /src/utils/PathUtils.js

Create a utility module using ES Module syntax for path and route manipulation between OpenAPI and Next.js conventions. Export individual named functions (not an object) to convert OpenAPI paths like /users/{userId}/posts/{postId} to Next.js routes like /users/[userId]/posts/[postId], extract parameter names from paths, convert paths to file system safe directory structures, group related paths by resource (all /users paths together), determine if a path represents a collection (typically GET without ID) or single resource, generate appropriate file names from paths, handle special characters and edge cases in path conversion, create component-friendly names for DaisyUI page components, and ensure all generated paths are valid for both Next.js routing and file systems. Use export keyword for each function.

#### /src/utils/StringUtils.js

Create a comprehensive string manipulation utility module using ES Module syntax for various naming convention conversions needed in code generation. Export individual named functions to convert strings between different cases: toPascalCase (for class names like UserProfile and React components), toCamelCase (for variables like userId), toKebabCase (for file names like user-profile and CSS classes), toSnakeCase (for some APIs like user_id), and toUpperCase (for constants like USER_ID). Add functions for pluralization and singularization of resource names, capitalizing first letters, sanitizing strings to valid JavaScript identifiers, generating DaisyUI-friendly class names, handling special characters and numbers in conversions, preserving acronyms appropriately (API stays API, not Api), creating human-readable labels from field names for form labels, and ensuring all conversions handle edge cases like empty strings, single characters, and mixed input formats. Use export keyword for each function.

#### /src/utils/SchemaUtils.js

Build a utility module using ES Module syntax for converting OpenAPI schemas to TypeScript types and extracting UI hints for DaisyUI components. Export named functions to convert OpenAPI schema objects to TypeScript type strings, map OpenAPI types (string, integer, number, boolean) to TypeScript types, handle array types with proper TypeScript array syntax, process nested object schemas recursively, resolve $ref references to get actual schema definitions, generate valid TypeScript interface names from schema names, handle nullable types using TypeScript union types, process enum schemas to TypeScript enums or union types (and determine if they should be rendered as select, radio, or badges in DaisyUI), manage schema composition (allOf, oneOf, anyOf), detect and handle circular references, extract descriptions for JSDoc comments and form field help text, determine appropriate DaisyUI input components based on schema properties (text input, textarea, select, checkbox, etc.), and identify fields that should use specific DaisyUI components (dates with date picker, colors with color picker, etc.). Use export keyword for each function.

### Phase 4: Template System

#### /src/templates/TemplateEngine.js

Create a template engine wrapper class using ES Module syntax around Handlebars that manages template loading and rendering for the code generator with DaisyUI-specific helpers. Import Handlebars and other dependencies using ES Module imports. This class should load templates from the templates directory using ES Module URL resolution and fs.readFileSync, compile and cache templates for performance, register custom Handlebars helpers for code generation tasks by importing from helpers.js, register DaisyUI-specific helpers for component class generation, support template overrides from user-specified directories, render templates with provided data contexts including theme configuration, handle missing templates with clear error messages, support partials for reusable template fragments (especially for common DaisyUI patterns), provide debugging information when template rendering fails, and maintain a registry of available DaisyUI components and their usage patterns. Export as default.

#### /src/templates/helpers.js

Create a module using ES Module syntax that exports custom Handlebars helper functions specifically designed for code generation tasks with DaisyUI components. Import string utilities using ES Module imports. Export individual named helper functions for case conversion: pascalCase (convert any string to PascalCase for class names), camelCase (for variable names), kebabCase (for file names), and upperCase (for constants). Add helpers for type generation: typeString (convert OpenAPI schema to TypeScript type string), isRequired (check if a property is in the required array), and isNullable (determine if a type should be nullable). Include path helpers: pathToRoute (convert OpenAPI path to Next.js route), extractPathParams (get parameter names from path), and routeToFilePath (convert route to file system path). Add DaisyUI-specific helpers: daisyInputType (determine DaisyUI input class based on schema), daisyButtonVariant (select button variant based on operation type), daisyAlertType (map error types to alert variants), daisyTableClass (generate table classes with modifiers), formControlClass (generate form control classes based on validation state), and badgeColor (map status values to badge colors). Add utility helpers: hasBody (check if operation has request body), getSuccessStatus (determine success response code), jsonStringify (safely stringify objects for templates with enhanced type handling - must handle null, undefined, strings, numbers, booleans, dates, arrays, and objects properly), safeValue (helper for safe template value rendering), and isLargeTextField (determine if textarea should be used). Add logical helpers: eq (equality check), or (logical OR), uniqueParams (get unique parameters by type to prevent duplicates), hasSuccessResponse (check for 2xx responses), and hasPathParam (check for path parameters). Ensure no duplicate function declarations. Export each helper as a named export.

#### /src/templates/TemplateTester.js

Create a class using ES Module syntax that validates all Handlebars templates before generation. Import Handlebars, fs-extra, and path using ES Module imports. The class should scan the templates directory recursively for .hbs files, attempt to compile each template with Handlebars, track compilation errors with file path and error details, support custom test data for template rendering tests, provide summary statistics (tested, passed, failed), emit progress events during testing, support verbose mode for detailed output, handle missing template directories gracefully, test both built-in and custom templates if provided, validate template helpers are available, check for common template issues (missing variables, invalid syntax), and return detailed results for error reporting. Export as default.

### Phase 5: Base Generator

#### /src/generators/BaseGenerator.js

Create an abstract base class using ES Module syntax that all specific generators (types, API routes, pages, etc.) will extend. Import EventEmitter and other dependencies using ES Module imports. This class should accept the OpenAPI specification and generator options in its constructor including DaisyUI theme configuration, define an abstract generate() method that subclasses must implement, provide common utility methods like getOperations() to extract all operations from paths, getSchemas() to get all schema definitions, getThemeConfig() to access DaisyUI theme settings, and renderTemplate() to render Handlebars templates with theme context. Include event emission for progress reporting, error handling with context about what was being generated, support for dry-run mode, helper methods for common tasks like creating operation IDs or extracting path parameters, methods to track DaisyUI component usage for reporting, and utilities for determining appropriate DaisyUI components based on operation types. Export as default.

### Phase 6: Main Code Generators

#### /src/generators/TypeGenerator.js

Build a generator class using ES Module syntax extending BaseGenerator that creates TypeScript type definitions from OpenAPI schemas by rendering the templates/types/api.ts.hbs template using TemplateEngine. Import BaseGenerator and utilities using ES Module imports. This generator should prepare template context data from all OpenAPI schemas including resolved $ref references and UI hints, use TemplateEngine.render() to generate the types/api.ts file content, handle schema organization and dependency ordering for the template, pass all schemas, enums, compositions, and metadata to the template which handles all TypeScript generation logic, write the rendered output to types/api.ts using FileWriter, and never generate TypeScript code directly in JavaScript - all type conversion logic must be in the Handlebars template. Export as default.

#### /src/generators/ApiRouteGenerator.js

Create a generator class using ES Module syntax that produces Next.js 14 App Router API route handlers by rendering the templates/api/[...route].ts.hbs template for each API path using TemplateEngine. Import BaseGenerator and utilities using ES Module imports. Accept serviceName in constructor options. For each path in the OpenAPI spec, convert OpenAPI paths like /pets/{id} to file paths like app/api/pets/[id]/route.ts, prepare template context with all operations, methods, parameters, schemas, and error responses for that path. Implement enhanced processRequestBodyForTemplate method that handles missing schema names by checking for array types and inline schemas, with fallback schema name generation. Include extractParametersForTemplate method with deduplication logic using Set to prevent duplicate parameters. Add formatOperationId method to ensure proper camelCase formatting and remove method prefix duplication. Group paths by resource for better organization. Pass serviceName and resourceName to template context for service integration. Use TemplateEngine.render() with the [...route].ts.hbs template to generate the route handler code that integrates with authentication middleware and service wrappers. Write each rendered file to the appropriate app/api directory structure using FileWriter. Let the template handle all Next.js route handler code generation including TypeScript types, request parsing, authentication integration, and error handling. Never write route handler code in JavaScript. Export as default.

#### /src/generators/ServiceGenerator.js

Create a service generator class using ES Module syntax extending BaseGenerator that generates service wrappers and API handler utilities for each resource. Import BaseGenerator, string utilities, and path using ES Module imports. Accept serviceName in constructor options. Implement extractResources method to identify unique resources from API paths. For each resource, generate two files: a service wrapper and an API handler. Create generateServiceFile method that renders templates/services/[resource]-service.ts.hbs with context including serviceName, resourceName, and apiUrl. Create generateHandlerFile method that renders templates/services/[resource]-api-handler.ts.hbs with authentication middleware and error handling utilities. Include generateSharedUtils method that creates a logger utility if it doesn't exist, with a simple console-based logger implementation supporting debug, info, warn, and error levels. The service wrapper should implement singleton pattern, session management with withSession method, and configuration management. The API handler should export withAuthenticationAsync middleware, createErrorResponseAsync for standardized errors, validateParams for request validation, and parsePaginationParams for pagination. Emit progress events during generation. Support dry-run mode. Generate files in app/api directory with naming pattern [resource]-service.ts and [resource]-api-handler.ts. Export as default.

#### /src/generators/ClientGenerator.js

Build a generator using ES Module syntax that creates typed API client libraries for multiple services by using OpenAPI Generator CLI with configuration files. Import BaseGenerator, child_process (execSync), fs-extra, path, js-yaml, chalk for colored output, ora for progress spinners, and utilities using ES Module imports.

The generator should extend BaseGenerator and implement the following functionality:

Constructor and initialization with options including serviceName, configFile, configPattern, baseOutputDir, continueOnError, parallel, and withMocks. Main generate() method that detects single or multiple services, processes each service, tracks success/failure status, generates unified client interface, and emits progress events. Service detection and processing through findConfigFiles and processService methods with service name extraction and normalization. OpenAPI Generator execution with prerequisite checking, command building, progress visualization, error handling, and dry-run support. Post-processing per service including directory structure creation, import path updates, ESLint fixes, and TypeScript compilation checks. Integration wrapper generation with index.ts re-exports, client.ts configuration, authentication interceptors, error handling, and typed interfaces. Unified client interface creation with namespace exports, client instances, TypeScript interfaces, and service discovery utilities. React hooks generation for CRUD operations with loading states, error handling, and proper TypeScript generics. Environment and configuration updates with service-specific variables and TypeScript declarations. Documentation generation with comprehensive README, usage examples, authentication docs, and troubleshooting guides. Error handling and recovery with service context logging, continue-on-error support, and rollback capabilities.

Support multiple API services with separate directories, independent versioning, pattern matching for configs, and backward compatibility. Handle service name extraction from CLI options, config properties, OpenAPI spec titles, or filenames. Ensure clear console output with colors and spinners, event emission for progress tracking, incremental update support, and backward compatibility maintenance.

Export the class as default export using ES Module syntax.

#### /src/generators/PageGenerator.js

Create a generator using ES Module syntax that produces React components for user interfaces by rendering templates/pages/list.tsx.hbs, templates/pages/detail.tsx.hbs, and templates/pages/form.tsx.hbs using TemplateEngine. Import BaseGenerator and utilities using ES Module imports. For each appropriate API operation, determine which template to use based on operation type (GET array → list, GET with ID → detail, POST/PUT → form), prepare template context with operation data, schemas, UI hints, and DaisyUI component configuration, use TemplateEngine.render() to generate the React component where the template handles all React code, hooks, state management, and DaisyUI component usage, write rendered components to appropriate directories like app/[resource]/page.tsx, never generate React code in JavaScript - templates contain all component logic including data fetching, error handling, and UI rendering, and pass theme configuration to templates for consistent styling. Export as default.

#### /src/generators/ProjectGenerator.js

Build a generator using ES Module syntax that creates all necessary project configuration files by rendering templates in templates/project/ directory using TemplateEngine and delegating to specialized configuration generators. Import BaseGenerator, all config generators, and TemplateEngine using ES Module imports. Generate project files by rendering templates/project/package.json.hbs with dependencies analyzed from API spec, templates/project/tsconfig.json.hbs for TypeScript configuration, templates/project/next.config.js.hbs for Next.js settings, templates/project/tailwind.config.js.mhbs with DaisyUI themes, templates/project/postcss.config.mjs.hbs for CSS processing, templates/project/globals.css.hbs with Tailwind directives, templates/project/layout.tsx.hbs for root layout with theme setup, templates/project/.env.example.hbs with extracted environment variables, templates/project/.gitignore.hbs for Git configuration, and templates/project/README.md.hbs with project documentation, while also delegating to specialized generators for additional configs like Docker, CI/CD, linting, etc., ensuring all file content comes from templates not JavaScript code. Export as default.

### Phase 7: Configuration Generators

#### /src/generators/config/ConfigHelpers.js

Create a utility module using ES Module syntax with shared helper functions for configuration generation including DaisyUI-specific utilities. Export named functions for template helper registration for Handlebars helpers, project name extraction and sanitization from OpenAPI spec, API feature analysis to determine required dependencies, DaisyUI theme configuration from spec metadata or branding, extracting color schemes for custom DaisyUI themes, environment variable extraction from security schemes, build configuration preparation with Tailwind CSS optimization, security configuration setup, image domain extraction from server URLs, component library usage statistics, package manager command helpers for different managers (npm, yarn, pnpm), secret generation utilities for secure tokens, theme preference detection and setup, and YAML/JSON stringification helpers with proper formatting. Use export keyword for each function.

#### /src/generators/config/TypeScriptConfigGenerator.js

Build a TypeScript configuration generator using ES Module syntax that creates tsconfig.json by rendering a template (create templates/project/tsconfig.json.hbs if not exists) using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Prepare template context with TypeScript compiler options, path aliases, lib references, and Next.js specific settings, render the tsconfig.json.hbs template which contains all configuration structure, never hardcode JSON configuration in JavaScript, and ensure the template handles all TypeScript settings including strict mode, module resolution, and DaisyUI type support. Export as default.

#### /src/generators/config/NextConfigGenerator.js

Create a specialized generator using ES Module syntax for Next.js configuration that generates next.config.js by rendering templates/project/next.config.js.hbs using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Analyze API spec to prepare template context including image domains, security headers, environment variables, internationalization settings, and deployment target, render the template which contains all Next.js configuration code including optimization settings and Tailwind CSS configuration, never write configuration code in JavaScript - the template handles all module.exports and configuration logic, and pass theme and styling preferences to the template. Export as default.

#### /src/generators/config/PackageConfigGenerator.js

Create a package configuration generator using ES Module syntax that generates package.json by rendering templates/project/package.json.hbs using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Analyze OpenAPI spec to determine required dependencies including Next.js, React, TypeScript, Tailwind CSS, DaisyUI, and feature-specific packages, prepare template context with all package metadata, scripts, dependencies, and devDependencies, render the template which handles all JSON structure and formatting, never construct package.json content in JavaScript, ensure the template includes "type": "module" and proper Node.js version requirements. Export as default.

#### /src/generators/config/TailwindConfigGenerator.js

Create a Tailwind CSS configuration generator using ES Module syntax that sets up tailwind.config.js by rendering templates/project/tailwind.config.mjs.hbs using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Prepare template context with content paths, DaisyUI plugin configuration, theme settings from CLI options, custom colors from API branding, and any additional Tailwind customizations, render the template which contains all Tailwind configuration code, never write config code in JavaScript - the template handles the complete module.exports structure, and ensure template receives all specified DaisyUI themes and customization options. Export as default.

#### /src/generators/config/LintingConfigGenerator.js

Create a comprehensive linting configuration generator using ES Module syntax that generates all linting config files by rendering templates using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Generate multiple files by rendering templates/project/.eslintrc.json.hbs for ESLint with TypeScript and React rules, templates/project/.prettierrc.json.hbs for Prettier with Tailwind plugin, templates/project/.stylelintrc.json.hbs for CSS linting, and templates/project/.lintstagedrc.json.hbs for pre-commit hooks, prepare appropriate context for each template based on project analysis, never construct JSON configurations in JavaScript - all config structure must be in templates, and ensure templates include all necessary rules for ES Modules, TypeScript, React, and DaisyUI. Export as default.

#### /src/generators/config/EnvironmentConfigGenerator.js

Build an environment configuration generator using ES Module syntax that creates environment files by rendering templates using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Generate files by rendering templates/project/.env.example.hbs with all discovered environment variables, templates/project/env.d.ts.hbs for TypeScript environment typing, analyze API spec for security schemes, server variables, and configuration needs, prepare template context with categorized variables (public, private, theme-related), never construct file content in JavaScript - templates handle all formatting and comments, and ensure templates include proper documentation and type definitions. Export as default.

#### /src/generators/config/DockerConfigGenerator.js

Build a Docker configuration generator using ES Module syntax that creates Docker-related files by rendering templates using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Generate files by rendering templates/project/Dockerfile.hbs for multi-stage builds, templates/project/docker-compose.yml.hbs for development, templates/project/docker-compose.prod.yml.hbs for production, and templates/project/.dockerignore.hbs for exclusions, prepare context with Node.js version, build optimizations, and service configurations, never write Dockerfile commands or YAML in JavaScript - templates contain all Docker configuration, and ensure templates handle Tailwind CSS compilation and Next.js standalone builds. Export as default.

#### /src/generators/config/CICDConfigGenerator.js

Create a CI/CD configuration generator using ES Module syntax that produces GitHub Actions workflows by rendering templates using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Generate workflows by rendering templates/project/.github/workflows/ci.yml.hbs for continuous integration, templates/project/.github/workflows/deploy.yml.hbs for deployment, templates/project/.github/dependabot.yml.hbs for dependency updates, prepare context with Node.js version, test commands, deployment targets, and security scanning needs, never construct YAML in JavaScript - templates handle all workflow syntax, and ensure templates include CSS compilation checks and visual regression testing for DaisyUI components. Export as default.

#### /src/generators/config/DeploymentConfigGenerator.js

Build a deployment configuration generator using ES Module syntax that creates platform-specific deployment configs by rendering templates using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Generate configs by rendering templates/project/vercel.json.hbs for Vercel, templates/project/netlify.toml.hbs for Netlify, templates/project/serverless.yml.hbs for AWS Lambda, templates/project/kubernetes/*.yaml.hbs for Kubernetes, analyze deployment target from CLI options to determine which templates to render, prepare context with build commands, environment variables, and platform-specific settings, never write deployment configuration in JavaScript - templates contain all platform-specific syntax, and ensure templates handle CSS optimization and CDN configuration. Export as default.

#### /src/generators/config/DocumentationGenerator.js

Build a documentation generator using ES Module syntax that creates comprehensive documentation by rendering templates using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Generate documentation by rendering templates/project/README.md.hbs for main project documentation, templates/project/docs/API.md.hbs for API reference from OpenAPI spec, templates/project/docs/CONTRIBUTING.md.hbs for contribution guidelines, templates/project/docs/DEPLOYMENT.md.hbs for deployment instructions, prepare rich context from API spec including endpoints, schemas, examples, and project metadata, never construct markdown in JavaScript - templates handle all documentation formatting, ensure templates include DaisyUI component usage guides and theme customization docs, and organize output in proper directory structure. Export as default.

#### /src/generators/config/EditorConfigGenerator.js

Create an editor configuration generator using ES Module syntax that produces editor configs by rendering templates using TemplateEngine. Import BaseGenerator, helpers, and TemplateEngine using ES Module imports. Generate configs by rendering templates/project/.editorconfig.hbs for universal editor settings, templates/project/.vscode/settings.json.hbs for VS Code workspace, templates/project/.vscode/launch.json.hbs for debugging configuration, templates/project/.vscode/extensions.json.hbs for recommended extensions, prepare context with file type settings, formatting rules, and debug configurations, never construct JSON or config files in JavaScript - templates handle all syntax, and ensure templates include Tailwind CSS IntelliSense settings and DaisyUI snippets. Export as default.

### Phase 8: Template Files

#### Core Type and API Templates

##### /templates/types/api.ts.hbs

Create a Handlebars template that generates a TypeScript type definition file from OpenAPI schemas with UI metadata for DaisyUI components. The template should produce a file header comment indicating it's auto-generated, iterate through all schemas and generate TypeScript interfaces, handle primitive types, arrays, and nested objects, use TypeScript's optional operator (?) for optional properties, generate union types for nullable properties, create enum types from string enumerations with comments for UI rendering hints, add JSDoc comments from schema descriptions including @uiComponent hints for DaisyUI components, generate form state types for each schema (loading, errors, touched fields), create pagination types for list responses, ensure proper TypeScript syntax with semicolons, export all interfaces and types, and organize related types with section comments. The output should be clean, readable TypeScript that passes strict type checking.

##### /templates/api/[...route].ts.hbs

Create a Handlebars template for Next.js 14 App Router API route handlers that integrates with service wrappers and authentication middleware. The template should generate imports for NextRequest and NextResponse from 'next/server', StatusCodes from 'http-status-codes', authentication utilities (createErrorResponseAsync, withAuthenticationAsync) from '@/app/api/{{kebabCase resourceName}}-api-handler', service getter from '@/app/api/{{kebabCase resourceName}}-service', logger from '@/utils/logger', and necessary types from '@/lib/api-client'. For each HTTP method, wrap the entire implementation in withAuthenticationAsync middleware that provides auth context with sessionId and userInfo. Use the service getter pattern (get{{pascalCase resourceName}}Service) to obtain service instance. Create request configuration using service.withSession(auth.sessionId) for API calls. Implement proper query parameter extraction with type conversion for numbers and booleans. Handle request body parsing with fallback variable name when schema name is missing. Use the service's API client methods with proper parameter passing. Return standardized responses with success flag and data property. Implement comprehensive error handling using createErrorResponseAsync. Add detailed logging throughout with logger.debug and logger.error. Handle all HTTP methods (GET, POST, PUT, PATCH, DELETE) with method-specific logic. Ensure TypeScript typing throughout and follow Next.js App Router conventions for API routes.

#### Service Templates

##### /templates/services/[resource]-service.ts.hbs

Create a Handlebars template that generates a service wrapper class for API client integration. Import the generated API client classes from '@/lib/api-client' and Configuration type. Create a singleton service instance variable. Define a service class named {{pascalCase resourceName}}Service that instantiates the API client with base configuration from environment variables. Implement withSession method that returns AxiosRequestConfig with session headers including X-Session-ID and Content-Type. Add updateConfig method for runtime configuration changes. Create a getter function get{{pascalCase resourceName}}Service that returns or creates the singleton instance. Add a reset function for testing purposes. Include proper TypeScript typing throughout. Export the service class and helper functions. The service should encapsulate all API client interactions and provide a clean interface for route handlers to use.

##### /templates/services/[resource]-api-handler.ts.hbs

Create a Handlebars template for API handler utilities that provide authentication middleware and error handling. Import NextRequest, NextResponse from 'next/server', StatusCodes from 'http-status-codes', and logger from '@/utils/logger'. Define AuthInfo interface with sessionId, token, and optional userInfo containing id, email, and name. Implement withAuthenticationAsync function that extracts session from cookies or headers, validates authentication, and calls the provided handler with auth context. Return proper error responses for missing session or token. Create createErrorResponseAsync function that handles different error types: axios errors with response data, network errors, validation errors, and generic errors. Return standardized error responses with success: false, message, error code, and optional details. Implement validateParams helper for required field validation. Add parsePaginationParams helper that extracts and validates page, size, sortBy, and sortDir from search params with sensible defaults and limits. Export all functions and interfaces. Include comprehensive error logging throughout.

#### Page Component Templates

##### /templates/pages/list.tsx.hbs

Create a Handlebars template for React list page components that display collections of resources using DaisyUI components. The template should generate a client component with 'use client' directive, import necessary types and the API client, import DaisyUI component helpers, use React hooks (useState, useEffect) for state management, implement data fetching with loading states using DaisyUI skeleton components (skeleton h-4 w-full for each row), display data in a DaisyUI table with classes "table table-zebra table-pin-rows table-pin-cols", implement sorting with clickable headers showing sort indicators, add filtering with DaisyUI form controls (input input-bordered input-sm), implement pagination using DaisyUI pagination component (join), handle empty states with friendly message in a DaisyUI card, show errors using DaisyUI alert components (alert alert-error) with retry button, include action buttons using btn classes (btn-primary, btn-ghost, btn-sm), add a floating action button for creating new items if POST operation exists, implement row selection with checkboxes for bulk actions, use DaisyUI drawer or modal for quick preview, ensure responsive design with overflow-x-auto for tables, and include keyboard navigation support.

##### /templates/pages/detail.tsx.hbs

Create a Handlebars template for React detail page components that display single resource data using DaisyUI card and layout components. Generate a client component that accepts ID from route parameters, implement data fetching with DaisyUI skeleton loader for the entire card, display content in a DaisyUI card (card bg-base-100 shadow-xl), use card-body with proper spacing and sections, show title in card-title with badges for status (badge badge-primary, badge-success, etc.), organize data in description lists using DaisyUI's prose class for readability, display timestamps with relative time and tooltips, handle 404 errors with a centered DaisyUI alert and back button, include action buttons in card-actions (btn btn-primary for edit, btn btn-error for delete), implement delete confirmation using DaisyUI modal with warning styling, add breadcrumbs using DaisyUI breadcrumbs component for navigation, show related data in tabs using DaisyUI tabs component if applicable, implement loading states for individual sections when updating, use DaisyUI divider component to separate sections, include a timeline component for audit history if available, and ensure proper responsive layout with stack on mobile.

##### /templates/pages/form.tsx.hbs

Create a Handlebars template for React form components using DaisyUI form styling for creating and editing resources. The template should generate a component that handles both create and edit modes with appropriate titles, create form using DaisyUI form-control wrapper for each field, implement different input types based on schema: text inputs (input input-bordered), textareas (textarea textarea-bordered), selects (select select-bordered), checkboxes (checkbox), radio buttons (radio), file uploads (file-input file-input-bordered), date pickers, and color pickers. Add labels using label component with label-text, show required fields with text-error asterisk, implement client-side validation with error states (input-error) and messages (label-text-alt text-error), show field descriptions using label-text-alt, group related fields using DaisyUI card or divider components, handle form submission with loading state (loading loading-spinner in button), show success using DaisyUI toast or alert-success, display API errors using alert-error with field-specific messages, implement dirty checking with unsaved changes warning, add a sticky footer with form actions (btn btn-primary for submit, btn btn-ghost for cancel), use DaisyUI steps component for multi-step forms if needed, implement field dependencies and conditional rendering, add keyboard shortcuts for save (Ctrl+S) and cancel (Esc), and ensure accessible form with proper ARIA labels.

#### Component Templates

##### /templates/components/ThemeSwitcher.tsx.hbs

Create a Handlebars template for a theme switcher component using DaisyUI's theme capabilities. Generate a client component that reads current theme from localStorage or system preference, renders a DaisyUI dropdown (dropdown dropdown-end) with theme options, use swap component with sun/moon icons for light/dark toggle, list all available themes from configuration with preview colors, implement theme switching by updating data-theme attribute on html element, persist theme choice to localStorage, sync across tabs using storage event listener, show current theme with check mark or active state, include system preference option that follows OS settings, use smooth transitions when switching themes, make component keyboard accessible, position in navbar or as floating button based on layout, and export as reusable component.

##### /templates/components/LoadingSpinner.tsx.hbs

Create a Handlebars template for a reusable loading spinner component using DaisyUI loading utilities. Generate a component that accepts size prop (loading-xs, loading-sm, loading-md, loading-lg), type prop (loading-spinner, loading-dots, loading-ring, loading-ball, loading-bars), color prop using DaisyUI color classes, optional overlay prop for full-screen loading with backdrop, optional text prop for loading messages, center content using flex utilities, implement as both inline and overlay variants, add fade-in animation for smooth appearance, make it accessible with proper ARIA attributes, and export with TypeScript props interface.

##### /templates/components/ErrorAlert.tsx.hbs

Create a Handlebars template for a reusable error alert component using DaisyUI alert. Generate a component that accepts error object with message and optional details, render using DaisyUI alert with appropriate variant (alert-error, alert-warning), include icon using DaisyUI's alert icon pattern, show error message with optional details in collapsible section, add retry button if retry callback is provided, implement dismiss functionality with fade-out animation, support different layouts (horizontal, vertical), make it stackable for multiple errors, include copy error details button for debugging, auto-dismiss option with timeout, and export with proper TypeScript types.

#### Library Templates

##### /templates/lib/api-client.ts.hbs

Create a Handlebars template that generates a typed API client library with DaisyUI toast integration. The template should import all types from the generated types file, create a base configuration with API URL from environment variables, implement a base fetch wrapper with common functionality, generate classes or objects grouped by API tags or resources, create methods for each API operation with full TypeScript typing, construct proper URLs with path parameter substitution, handle all HTTP methods with appropriate body serialization, include authentication headers from environment variables or auth context, implement request/response interceptors for loading states and error handling, throw custom ApiError with structured error info for DaisyUI alerts, parse responses with proper typing and handle different content types, add JSDoc comments from operation descriptions, support abort controllers for cancellable requests, implement retry logic with exponential backoff for failed requests, include optional toast notifications using a toast manager, track request metrics for performance monitoring, support file uploads with progress tracking, handle pagination headers and return metadata, and export a well-structured API object for easy imports.

##### /templates/lib/toast.ts.hbs

Create a Handlebars template for a toast notification manager that integrates with DaisyUI toast component. Generate a ToastManager class that manages a queue of toast notifications, renders toasts in a portal at the edge of the screen, supports different toast types (success, error, warning, info) with DaisyUI alert styling, implements auto-dismiss with configurable duration, supports manual dismiss with close button, handles multiple toasts with stacking and animation, provides promise-based API for confirmation toasts, supports custom content and actions in toasts, implements position configuration (top-right, bottom-center, etc.), adds progress bar for auto-dismiss countdown, ensures accessibility with ARIA live regions, manages z-index for proper layering, and exports singleton instance and hook for React components.

##### /templates/lib/service-wrapper.ts.hbs

Create a Handlebars template that generates a TypeScript wrapper class around the generated OpenAPI client for a single service. The template should import all generated API classes from the OpenAPI Generator output, create a ServiceClient class that instantiates all API classes with shared configuration, accept service name and base URL from template context, implement configuration methods for updating base URL and auth tokens, create helper methods for common tasks like setting default headers, handle axios interceptors for request/response transformation, export both the wrapper class and individual API instances, include JSDoc comments explaining usage, support both bearer token and API key authentication based on security schemes, and provide typed configuration interfaces. The wrapper should make it easy to use the generated client with proper error handling and DaisyUI toast integration.

##### /templates/lib/service-hooks.ts.hbs

Create a Handlebars template for generating React hooks for each API operation in a service. The template should accept hookLibrary option (react-query, swr, or vanilla), generate custom hooks for each operation with proper TypeScript typing, implement loading, error, and data states, support both automatic execution and manual triggers, handle pagination for list operations, include optimistic updates for mutations, integrate with DaisyUI toast for success/error notifications, generate separate hooks for queries (useGet*, useList*) and mutations (useCreate*, useUpdate*, useDelete*), support request cancellation, implement proper cache invalidation strategies, include refetch and retry functionality, and export all hooks with clear naming conventions based on operation IDs.

##### /templates/lib/unified-index.ts.hbs

Create a Handlebars template for the root API client index file that combines multiple services. The template should import all service wrappers and types, create a unified client object with all services as properties, export individual service clients for direct access, export all types from each service with proper namespacing, create type definitions for the unified client, include initialization functions that configure all services at once, support dynamic service discovery if service list is provided, handle authentication configuration across all services, export utility types for common patterns (pagination, errors), and provide a clear API surface for consuming applications. Include comments explaining the structure and usage patterns.

##### /templates/lib/unified-client.ts.hbs

Create a Handlebars template for unified client configuration and management across multiple services. Generate a configuration class that manages settings for all API services, implement methods for updating URLs for specific services, create authentication management that can differ per service, support environment-based configuration with validation, implement health check methods for all services, create event emitters for global API events (errors, auth failures), handle request queuing and rate limiting if needed, provide methods for enabling/disabling specific services, support middleware registration for all services, and export typed interfaces for configuration options. The client should support both runtime and build-time configuration.

##### /templates/lib/mock-client.ts.hbs

Create a Handlebars template for generating mock implementations of API clients for testing. The template should create mock classes that match the real API client interfaces, implement all methods with configurable mock responses, support different response scenarios (success, error, timeout), allow response customization through mock data providers, implement realistic delays to simulate network calls, support request validation to ensure correct parameters, track method calls for test assertions, provide utilities for common testing scenarios, integrate with popular testing frameworks, and export both individual mocks and a unified mock client. Include helpers for generating mock data that matches the API schemas.

##### /templates/lib/service-types.d.ts.hbs

Create a Handlebars template for TypeScript declaration files that augment the generated types. The template should declare module augmentations for the generated client, add utility types for common patterns (WithPagination, ApiResponse, etc.), declare global types for authentication tokens and configuration, extend generated interfaces with helper methods if needed, provide type guards for runtime type checking, declare environment variable types for each service, create branded types for IDs to prevent mixing between services, export helper types for React components using the client, and ensure all declarations are properly namespaced to avoid conflicts.

##### /templates/lib/service-config.ts.hbs

Create a Handlebars template for service-specific configuration files. Generate a configuration schema for each service including base URL, authentication settings, retry configuration, timeout settings, and custom headers. Implement validation functions using the schema, create default configurations based on environment, support configuration merging for overrides, provide type-safe configuration builders, export configuration interfaces for TypeScript support, include configuration presets for common scenarios (development, staging, production), support configuration from multiple sources (env vars, files, runtime), implement configuration change listeners, and provide debugging utilities for configuration issues.

#### Utility Templates

##### /templates/utils/logger.ts.hbs

Create a Handlebars template for a logger utility that provides structured logging for the application. Accept projectName from context for documentation. Generate a TypeScript logger class with support for multiple log levels (debug, info, warn, error). Implement log level filtering based on environment (debug only in development). Include timestamp formatting with ISO string format. Create methods for each log level with proper TypeScript typing. Handle Error objects specially in the error method by extracting name, message, and stack trace. Add support for child loggers with context for structured logging. Export a singleton logger instance for application-wide use. Include JSDoc comments explaining usage and mentioning alternative logging libraries (winston, pino, bunyan). Add type exports for extending the logger. Consider test environment to suppress console output during testing. The logger should be simple enough to work out of the box but extensible for production needs.

### Phase 9: Test Files

Create comprehensive test files using Node.js built-in test framework (node:test) for all core components, generators, and utilities. Each test file should use ES Module imports, properly structured describe/it blocks, async functions where needed, and appropriate assertions. Tests should cover both success and error scenarios, edge cases, and integration points between components.

### Phase 10: Example Files

Create example OpenAPI specifications that demonstrate the full capabilities of the generator, including UI hints for DaisyUI component selection, theme configuration, and various API patterns that showcase different generated outputs.

---

## Build Sequence

Implement the project components in this order to ensure proper dependency resolution:

1. **Phase 1: Foundation** - Package configuration, documentation, CLI entry point, and main orchestrator
2. **Phase 2: Core Components** - Spec loader, validator, and file writer utilities
3. **Phase 3: Utilities** - Path, string, and schema manipulation functions
4. **Phase 4: Template System** - Template engine, helpers, and validation
5. **Phase 5: Base Generator** - Abstract base class for all generators
6. **Phase 6: Main Generators** - Type, API route, service, page, client, and project generators
7. **Phase 7: Configuration Generators** - All specialized config file generators
8. **Phase 8: Template Files** - All Handlebars templates for code generation
9. **Phase 9: Test Files** - Comprehensive test coverage using Node.js test runner
10. **Phase 10: Example Files** - Sample OpenAPI specifications with UI hints

---

## Key Implementation Guidelines

### Template-Based Generation

All code generation must occur through Handlebars templates. Generators should only prepare context data and never construct file content directly in JavaScript. This ensures consistency, maintainability, and allows for easy customization of generated code.

### Service-Oriented Architecture

API routes integrate with service wrappers to provide clean separation of concerns. Authentication middleware ensures consistent security handling across all protected routes. Standardized error responses maintain uniform error structure throughout the application.

### ES Module Compliance

Every JavaScript file in the project must use ES Module syntax. This includes using import/export statements, proper file extensions in imports where needed, and ensuring compatibility with Node.js ES Module resolution.

### DaisyUI Component Integration

All UI components use DaisyUI classes for consistent styling. Theme support is built into every level of the generation process. Components are responsive by default and include proper accessibility attributes.

### Testing Strategy

Use Node.js built-in test runner exclusively (no external test frameworks). Tests should cover both unit and integration scenarios. Mock file system operations where appropriate to avoid side effects during testing.

### Error Handling

Implement comprehensive error handling at every level. Provide helpful error messages that guide users toward solutions. Use structured error objects that can be properly displayed in DaisyUI alert components.

This implementation guide provides a complete roadmap for building the Swagger-to-Next.js generator. Each prompt is self-contained and can be implemented independently while maintaining consistency with the overall architecture.