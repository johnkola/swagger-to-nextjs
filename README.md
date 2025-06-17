<!--
==============================================================================
SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
==============================================================================
FILE: README.md
VERSION: 2025-06-17 16:21:39
PHASE: Phase 1: Foundation & Core Infrastructure
==============================================================================

AI GENERATION PROMPT:

Write a comprehensive README for a CLI tool that generates Next.js
applications from OpenAPI/Swagger specifications with beautiful DaisyUI
components. Explain that this tool takes an OpenAPI spec (YAML or JSON) and
generates a complete Next.js 14+ application with TypeScript types, API
routes, client library, and UI components styled with DaisyUI. Mention that
the project uses ES Modules and requires Node.js 18+. Include installation
instructions for global npm installation, a quick start example showing the
basic command "swagger-to-nextjs generate petstore.yaml my-app", and explain
what gets generated including DaisyUI-styled components. List key features
like TypeScript support, automatic API client generation, CRUD UI components
with DaisyUI theming, responsive design out of the box, dark mode support, and
customizable templates. Provide basic usage documentation with common options
like --force, --dry-run, --no-pages, --theme (for DaisyUI theme selection),
--themes (list of themes to include). Include a section on theming explaining
how to customize DaisyUI themes. Include a testing section explaining how to
run tests using the native Node.js test runner. Include requirements (Node.js
18+) and MIT license information.

==============================================================================
-->
# Swagger-to-Next.js Generator - Complete Documentation
## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Detailed Design](#3-detailed-design)
4. [Implementation Plan](#4-implementation-plan)
5. [Technical Decisions](#5-technical-decisions)
6. [API Reference](#6-api-reference)
7. [Future Enhancements](#7-future-enhancements)
8. [Success Metrics](#8-success-metrics)
9. [Security Considerations](#9-security-considerations)
10. [Implementation Guide](#10-implementation-guide)
11. [Testing Strategy](#11-testing-strategy)
---
## 1. Executive Summary
### 1.1 Overview
The Swagger-to-Next.js Generator is a command-line tool that automatically generates a complete, production-ready Next.js application from an OpenAPI/Swagger specification. It transforms API definitions into a fully functional web application with TypeScript types, API routes, client libraries, and UI components.

### 1.2 Goals
- **Accelerate Development**: Reduce boilerplate code writing from days to minutes
- **Ensure Type Safety**: Generate fully-typed TypeScript code throughout the application
- **Maintain Consistency**: Enforce consistent patterns across generated applications
- **Developer Friendly**: Produce readable, maintainable code that developers can easily modify

### 1.3 Non-Goals
- Runtime API management or monitoring
- Database integration or ORM setup
- Authentication implementation (only boilerplate)
- Deployment or CI/CD configuration
- API specification editing or validation beyond basic checks

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   OpenAPI   │────▶│     CLI     │────▶│    Spec     │
│    Spec     │     │  Interface  │     │   Loader    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    File     │◀────│  Generator  │◀────│  Validator  │
│   Writer    │     │   Engine    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│            Next.js Application                      │
│  • TypeScript Types  • API Routes  • UI Components │
└─────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Interface                          │
│  • Command parsing    • Options handling    • Progress UI   │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Core Engine                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Loader   │  │  Validator   │  │  File Writer     │  │
│  │ • Parse    │  │ • Validate   │  │ • Write files    │  │
│  │ • Resolve  │  │ • Normalize  │  │ • Handle conflicts│  │
│  └────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Generators                               │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Types    │  │  API Routes  │  │     Client       │  │
│  └────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌────────────┐  ┌──────────────┐                        │
│  │   Pages    │  │   Project    │                        │
│  └────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                 Template Engine                             │
│  • Handlebars    • Custom Helpers    • Template Cache      │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Complete Project File Structure

```
swagger-to-nextjs/
├── package.json
├── README.md
├── openapi-config.yaml
├── bin/
│   └── swagger-to-nextjs.js      # CLI entry point
├── src/
│   ├── index.js                   # Main orchestrator
│   ├── cli.js                     # CLI interface
│   ├── core/
│   │   ├── SwaggerLoader.js       # Load & parse OpenAPI specs
│   │   ├── SwaggerValidator.js    # Validate OpenAPI specs
│   │   └── FileWriter.js          # Write files with conflict handling
│   ├── generators/
│   │   ├── BaseGenerator.js       # Abstract base class
│   │   ├── TypeGenerator.js       # TypeScript interfaces/types
│   │   ├── ApiRouteGenerator.js   # Next.js API routes
│   │   ├── PageGenerator.js       # React pages/components
│   │   ├── ClientGenerator.js     # API client functions
│   │   ├── ProjectGenerator.js    # Project setup files
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
│   │   ├── TemplateEngine.js      # Handlebars wrapper
│   │   └── helpers.js             # Custom Handlebars helpers
│   └── utils/
│       ├── PathUtils.js           # OpenAPI path → Next.js route
│       ├── SchemaUtils.js         # Schema → TypeScript conversion
│       └── StringUtils.js         # Case conversion, formatting
├── templates/                     # Default templates
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

### 2.4 Data Flow

1. **Input Stage**: OpenAPI specification (YAML/JSON) is provided via CLI
2. **Loading Stage**: Specification is loaded and references are resolved
3. **Validation Stage**: Specification is validated and normalized
4. **Analysis Stage**: Specification is analyzed to determine what to generate
5. **Generation Stage**: Each generator produces code based on the specification
6. **Template Stage**: Templates are rendered with specification data
7. **Output Stage**: Files are written to the target directory

## 3. Detailed Design

### 3.1 CLI Interface

#### Command Structure
```bash
swagger-to-nextjs generate <spec> [output] [options]
```

#### Options
| Option | Description | Default |
|--------|-------------|---------|
| `--typescript` | Generate TypeScript code | `true` |
| `--client` | Generate API client | `true` |
| `--pages` | Generate UI pages | `true` |
| `--force` | Overwrite existing files | `false` |
| `--dry-run` | Preview without writing files | `false` |
| `--template-dir` | Custom template directory | Built-in templates |

#### User Experience
- Interactive prompts for file conflicts
- Progress spinner during generation
- Colored output for success/error states
- Clear next steps after generation

### 3.2 Core Components

#### 3.2.1 Swagger Loader
**Purpose**: Load and parse OpenAPI specifications

**Key Features**:
- Support for OpenAPI 3.0, 3.1, and Swagger 2.0
- YAML and JSON format support
- Reference resolution (`$ref`)
- URL and file path support

**Interface**:
```javascript
class SwaggerLoader {
  async load(pathOrUrl: string): Promise<OpenAPISpec>
  private resolveReferences(spec: object): object
  private detectFormat(content: string): 'json' | 'yaml'
}
```

#### 3.2.2 Swagger Validator
**Purpose**: Validate and normalize specifications

**Key Features**:
- Structural validation
- Operation ID generation
- Schema validation
- Warning generation for best practices

**Interface**:
```javascript
class SwaggerValidator {
  validate(spec: OpenAPISpec): ValidationResult
  private checkRequiredFields(spec: OpenAPISpec): void
  private generateOperationIds(spec: OpenAPISpec): void
}
```

#### 3.2.3 File Writer
**Purpose**: Handle file system operations

**Key Features**:
- Directory creation
- Conflict resolution
- Dry-run support
- Progress tracking

**Interface**:
```javascript
class FileWriter {
  async write(path: string, content: string): Promise<void>
  async checkConflicts(files: FileMap): Promise<ConflictResult>
  setOptions(options: WriteOptions): void
}
```

### 3.3 Generators

#### 3.3.1 Type Generator
**Purpose**: Generate TypeScript type definitions

**Output**: `types/api.ts`

**Features**:
- Interface generation from schemas
- Enum type creation
- Union type support
- JSDoc comments from descriptions

**Example Output**:
```typescript
export interface Pet {
  id: number;
  name: string;
  status: 'available' | 'pending' | 'sold';
  category?: Category;
  tags?: Tag[];
}

export enum PetStatus {
  Available = 'available',
  Pending = 'pending',
  Sold = 'sold'
}
```

#### 3.3.2 API Route Generator
**Purpose**: Generate Next.js API route handlers

**Output**: `app/api/[...paths]/route.ts`

**Features**:
- Dynamic route generation
- Request validation
- Type-safe handlers
- Error handling

**Example Output**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { Pet, CreatePetRequest } from '@/types/api';

export async function GET(request: NextRequest) {
  // TODO: Implement pet listing logic
  const pets: Pet[] = [];
  return NextResponse.json(pets);
}

export async function POST(request: NextRequest) {
  const body: CreatePetRequest = await request.json();
  // TODO: Implement pet creation logic
  return NextResponse.json(body, { status: 201 });
}
```

#### 3.3.3 Client Generator
**Purpose**: Generate typed API client library

**Output**: `lib/api-client.ts`

**Features**:
- Grouped by tags or resources
- Full TypeScript typing
- Error handling
- Configuration support

**Example Output**:
```typescript
class PetApi {
  async list(): Promise<Pet[]> {
    const response = await fetch(`${API_URL}/pets`);
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }

  async create(pet: CreatePetRequest): Promise<Pet> {
    const response = await fetch(`${API_URL}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pet)
    });
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }
}

export const api = {
  pets: new PetApi()
};
```

#### 3.3.4 Page Generator
**Purpose**: Generate React UI components

**Outputs**:
- List pages for collections
- Detail pages for single resources
- Form pages for create/update operations

**Features**:
- Server/client component selection
- Loading and error states
- Basic styling
- TypeScript throughout

**Example List Page**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { Pet } from '@/types/api';

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.pets.list()
      .then(setPets)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Pets</h1>
      <ul>
        {pets.map(pet => (
          <li key={pet.id}>{pet.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### 3.3.5 Project Generator
**Purpose**: Generate project configuration files

**Outputs**:
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `.env.example` - Environment variables
- `.gitignore` - Git ignore patterns
- `README.md` - Project documentation

### 3.4 Template System

#### Template Engine
- Built on Handlebars
- Custom helper functions
- Template caching
- Override support

#### Helper Functions
| Helper | Purpose | Example |
|--------|---------|---------|
| `pascalCase` | Convert to PascalCase | `{{pascalCase "pet-store"}}` → `PetStore` |
| `camelCase` | Convert to camelCase | `{{camelCase "pet-store"}}` → `petStore` |
| `typeString` | Schema to TS type | `{{typeString schema}}` → `string \| null` |
| `pathToRoute` | OpenAPI to Next.js | `{{pathToRoute "/pets/{id}"}}` → `/pets/[id]` |

## 4. Implementation Plan

### 4.1 Development Phases

#### Phase 1: Foundation (Week 1)
- [ ] Project setup and configuration
- [ ] CLI interface implementation
- [ ] Basic loader and validator
- [ ] File writer with conflict handling

#### Phase 2: Type System (Week 1-2)
- [ ] Schema to TypeScript converter
- [ ] Type generator implementation
- [ ] Complex type handling (unions, enums)
- [ ] Type utility functions

#### Phase 3: API Generation (Week 2)
- [ ] API route generator
- [ ] Client library generator
- [ ] Request/response handling
- [ ] Error handling patterns

#### Phase 4: UI Generation (Week 3)
- [ ] Page component generator
- [ ] Form generation from schemas
- [ ] List and detail pages
- [ ] Basic styling setup

#### Phase 5: Polish (Week 3-4)
- [ ] Template system improvements
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Example projects

## 5. Technical Decisions

### 5.1 Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| CLI Framework | Commander.js | Industry standard, well-documented |
| Template Engine | Handlebars | Simple, powerful, extensive helpers |
| YAML Parser | js-yaml | Reliable, handles all YAML features |
| File Operations | fs-extra | Promise-based, extra utilities |
| UI Feedback | chalk + ora | Best-in-class CLI UX |

### 5.2 Design Decisions

#### Why Generate Code Instead of Runtime?
- **Performance**: No runtime overhead
- **Flexibility**: Developers can modify generated code
- **Debugging**: Standard Next.js debugging tools work
- **Type Safety**: Full TypeScript support at build time

#### Why Next.js App Router?
- **Modern**: Latest React patterns
- **Performance**: Server Components by default
- **TypeScript**: First-class TS support
- **Future-proof**: Recommended by Next.js team

#### Why Include UI Generation?
- **Complete Solution**: Working app out of the box
- **Best Practices**: Shows proper data fetching patterns
- **Time Saving**: Basic CRUD UI takes significant time
- **Optional**: Can be disabled with `--no-pages`

## 6. API Reference

### 6.1 Generated Project Structure
```
my-app/
├── app/
│   ├── api/
│   │   └── [...dynamic routes]/
│   │       └── route.ts
│   ├── [resources]/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── layout.tsx
├── lib/
│   └── api-client.ts
├── types/
│   └── api.ts
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

### 6.2 Configuration Schema
```typescript
interface GeneratorConfig {
  typescript: boolean;
  client: boolean;
  pages: boolean;
  force: boolean;
  dryRun: boolean;
  templateDir?: string;
  output: string;
}
```

## 7. Future Enhancements

### 7.1 Potential Features
- **Authentication Helpers**: Generate auth boilerplate
- **Database Integration**: Prisma schema generation
- **GraphQL Support**: Generate GraphQL resolvers
- **Custom Templates**: Template marketplace
- **Plugin System**: Extensible generator architecture

### 7.2 Compatibility
- **OpenAPI Versions**: Support for 3.1 features
- **Next.js Versions**: Track Next.js releases
- **Node.js**: Maintain LTS version support

## 8. Success Metrics

### 8.1 Performance Targets
- Generation time: < 5 seconds for typical APIs
- Memory usage: < 100MB for large specs
- File I/O: Optimized for SSDs

### 8.2 Quality Metrics
- Generated code passes TypeScript strict mode
- 100% of generated code is formatted
- Zero runtime errors in generated code
- Generated apps achieve 90+ Lighthouse scores

### 8.3 Adoption Metrics
- npm downloads
- GitHub stars
- Community contributions
- Generated app success stories

## 9. Security Considerations

### 9.1 Input Validation
- Sanitize file paths to prevent directory traversal
- Validate OpenAPI specs to prevent malicious content
- Limit file sizes to prevent DoS

### 9.2 Generated Code Security
- No hardcoded secrets
- Environment variable usage for configuration
- Security headers in Next.js config
- Input validation in API routes

## 10. Implementation Guide

This section contains detailed implementation instructions for each component, organized by build phase.

### 10.1 Phase 1: Foundation & Core Infrastructure

#### Root Configuration Files

**Package.json Requirements:**
- CLI tool called "swagger-to-nextjs" for Next.js app generation
- Dependencies: Commander.js, Handlebars, js-yaml, chalk, ora, fs-extra
- Dev dependencies: Jest, ESLint, Prettier
- Bin field pointing to "./bin/swagger-to-nextjs.js"
- Node.js 16+ requirement
- NPM scripts for testing, linting, and formatting

**README.md Requirements:**
- Comprehensive documentation for the CLI tool
- Installation instructions for global npm installation
- Quick start example: `swagger-to-nextjs generate petstore.yaml my-app`
- Key features listing
- Basic usage documentation with common options
- Requirements and license information

**CLI Entry Point Requirements:**
- Node.js shebang
- Import and execute main CLI module
- Graceful error handling
- Appropriate exit codes
- SIGINT signal handling for clean interruption

**Main CLI Interface Requirements:**
- Commander.js based interface
- Main command: `generate <spec> [output]`
- Options: --typescript, --client, --pages, --force, --dry-run
- Progress spinner using ora
- Colored messages with chalk
- Helpful next steps after generation

**Main Orchestrator Requirements:**
- Coordinate entire generation process
- Sequential execution of all generation steps
- Event emission for progress tracking
- Error handling with helpful messages
- Return summary of generated files
- Support both CLI and programmatic usage

### 10.2 Phase 2: Core System Components

#### OpenAPI Processing

**Swagger Loader Requirements:**
- Load from local files and HTTP/HTTPS URLs
- Auto-detect JSON vs YAML format
- Parse YAML using js-yaml
- Resolve internal $ref references
- Support OpenAPI 3.x and Swagger 2.0
- Convert Swagger 2.0 to OpenAPI 3.0 internally
- Graceful error handling
- Basic timeout for URL fetching

**Swagger Validator Requirements:**
- Check required fields (version, info, paths)
- Verify each path has operations
- Generate missing operationIds
- Validate referenced schemas exist
- Identify common issues
- Separate errors (blocking) from warnings
- Detailed error messages with paths
- Return validation result object

#### File System Operations

**File Writer Requirements:**
- Create nested directories recursively
- Handle existing file conflicts
- Support dry-run mode
- Format code with Prettier
- Track written files for summary
- Handle file system errors gracefully
- Progress callbacks for each file
- Atomic writes for safety

### 10.3 Phase 3: Utility Modules

#### Path and String Utilities

**Path Utils Requirements:**
- Convert OpenAPI paths to Next.js routes
- Extract parameter names from paths
- Convert to file-safe directory structures
- Group related paths by resource
- Determine collection vs single resource
- Generate appropriate file names
- Handle special characters
- Ensure valid paths for Next.js and file system

**String Utils Requirements:**
- Case conversions: PascalCase, camelCase, kebab-case, snake_case, UPPER_CASE
- Pluralization and singularization
- First letter capitalization
- Sanitize to valid JavaScript identifiers
- Handle special characters and numbers
- Preserve acronyms appropriately
- Handle edge cases

#### Schema Utilities

**Schema Utils Requirements:**
- Convert OpenAPI schemas to TypeScript types
- Map OpenAPI types to TypeScript
- Handle array types with proper syntax
- Process nested objects recursively
- Resolve $ref references
- Generate valid interface names
- Handle nullable types with unions
- Process enums appropriately
- Manage schema composition (allOf, oneOf, anyOf)
- Detect and handle circular references
- Extract descriptions for JSDoc

### 10.4 Phase 4: Template System

#### Template Engine

**Template Engine Requirements:**
- Wrap Handlebars for template management
- Load templates from directory
- Compile and cache for performance
- Register custom helpers
- Support template overrides
- Render with data contexts
- Clear error messages for missing templates
- Support partials
- Debug information for failures

**Template Helpers Requirements:**
- Case conversion helpers
- Type generation helpers
- Path manipulation helpers
- Utility helpers for common tasks
- Safe JSON stringification
- Operation analysis helpers

### 10.5 Phase 5: Base Generator

**Base Generator Requirements:**
- Abstract class for all generators
- Accept spec and options in constructor
- Abstract generate() method
- Common utility methods
- Event emission for progress
- Error handling with context
- Dry-run support
- Helper methods for common tasks

### 10.6 Phase 6: Main Code Generators

#### Type Generation

**Type Generator Requirements:**
- Create types/api.ts file
- Convert all schemas to TypeScript interfaces
- Handle all OpenAPI data types
- Support nullable properties
- Handle optional properties
- Generate enums from string enumerations
- Handle schema composition
- Add JSDoc comments
- Resolve references
- Handle circular references
- Export all interfaces and types

#### API Route Generation

**API Route Generator Requirements:**
- Generate route.ts files in app/api structure
- Convert OpenAPI paths to Next.js dynamic routes
- Create named exports for HTTP methods
- Import TypeScript types
- Parse request bodies
- Basic validation
- Error handling with status codes
- Use NextRequest and NextResponse
- Add TODO comments for business logic
- Follow RESTful conventions

#### Client Generation

**Client Generator Requirements:**
- Generate lib/api-client.ts
- Group by tags or resources
- Create typed functions for each operation
- Use native fetch API
- Construct URLs with parameters
- Handle all HTTP methods
- Include authentication headers
- Custom error handling
- Parse JSON with typing
- JSDoc comments
- Well-organized exports

#### Page Generation

**Page Generator Requirements:**
- Generate list pages for collections
- Generate detail pages for single resources
- Generate form pages for create/update
- Use Next.js 14 App Router
- Include 'use client' directive
- Use generated API client
- Implement loading states
- Handle errors gracefully
- TypeScript throughout
- Basic CSS modules
- React best practices

#### Project Setup Generation

**Project Generator Requirements:**
- Generate package.json with dependencies
- Create tsconfig.json with strict settings
- Generate next.config.js
- Create .env.example
- Generate .gitignore
- Create README.md
- Ensure cohesive configuration

### 10.7 Phase 7: Configuration Generators

Each configuration generator extends the base functionality to create specialized configuration files:

- **TypeScript Config**: Strict type checking, path aliases, Next.js compatibility
- **Next.js Config**: Optimization, security, environment variables
- **Package Config**: Dependencies, scripts, engine requirements
- **Linting Config**: ESLint and Prettier setup
- **Environment Config**: Type-safe env validation, documentation
- **Docker Config**: Multi-stage builds, security best practices
- **CI/CD Config**: GitHub Actions, testing, deployment
- **Deployment Config**: Platform-specific configurations
- **Documentation**: Comprehensive project docs
- **Editor Config**: IDE settings and recommendations

### 10.8 Phase 8: Template Files

Templates use Handlebars syntax with custom helpers:

- **Type Templates**: Generate TypeScript interfaces and types
- **API Route Templates**: Next.js App Router API handlers
- **Page Templates**: React components for UI
- **Client Template**: Typed API client library
- **Project Templates**: Configuration files

### 10.9 Phase 9: Example Files

- **petstore.yaml**: Complete example with CRUD operations
- **simple-api.yaml**: Minimal example for testing

## 11. Testing Strategy

### 11.1 Unit Tests
- Each utility function
- Generator logic
- Template rendering
- Schema conversion

### 11.2 Integration Tests
- Full generation flow
- Different spec formats
- Edge cases and errors

### 11.3 End-to-End Tests
- Generated code compilation
- Runtime functionality
- Type checking

### 11.4 Testing Order

1. **Phase 1**: Run CLI with --help to verify basic setup
2. **Phase 2**: Test loading and validating example specs
3. **Phase 3**: Unit test utility functions
4. **Phase 4**: Test template rendering with mock data
5. **Phase 5**: Test base generator methods
6. **Phase 6**: Test each generator with example specs
7. **Phase 7**: Test configuration generators individually
8. **Phase 8**: Validate generated templates compile
9. **Phase 9**: Full integration test with example files

## Conclusion

The Swagger-to-Next.js Generator bridges the gap between API design and implementation, significantly accelerating the development of type-safe Next.js applications. By focusing on developer experience and code quality, this tool enables teams to build production-ready applications faster while maintaining high standards.

This comprehensive documentation provides both the architectural design and detailed implementation guide necessary to build the complete system. Each component is designed to work together cohesively, creating a powerful tool that transforms API specifications into fully functional Next.js applications.