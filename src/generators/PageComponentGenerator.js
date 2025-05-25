/**
 * ===AI PROMPT ==============================================================
 * FILE: src/generators/PageComponentGenerator.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create a generator for NextJS page components and UI elements based on
 * OpenAPI operations. Generate forms, data tables, and navigation components
 * with TypeScript support.
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
 * FILE: src/generators/PageComponentGenerator.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing the React page component generator that creates Next.js 13+ App Router
 * page components from OpenAPI specifications. This generator produces modern, responsive
 * React components with TypeScript, Tailwind CSS, and comprehensive state management.
 *
 * RESPONSIBILITIES:
 * - Generate Next.js page components (page.tsx files) for API endpoints
 * - Create responsive UI components with Tailwind CSS styling
 * - Implement data fetching logic with proper error handling
 * - Generate dynamic routing components with path parameter handling
 * - Produce comprehensive AI prompts for UI/UX enhancement
 * - Handle different HTTP methods with appropriate UI patterns
 * - Create accessible, mobile-responsive user interfaces
 *
 * TECHNICAL FEATURES:
 * - Template-based React component generation
 * - TypeScript integration with proper type definitions
 * - State management with React hooks (useState, useEffect)
 * - Dynamic routing with Next.js useParams/useSearchParams
 * - Comprehensive error handling and loading states
 * - Tailwind CSS responsive design patterns
 * - AI-assisted UI/UX improvement prompts
 *
 * REVIEW FOCUS:
 * - React component architecture and best practices
 * - TypeScript type safety and integration
 * - Responsive design implementation and accessibility
 * - State management patterns and performance
 * - Error handling user experience and feedback
 */

const BaseGenerator = require('./BaseGenerator');
const TemplateEngine = require('../templates/TemplateEngine');

class PageComponentGenerator extends BaseGenerator {
    constructor() {
        super();
        this.templateEngine = new TemplateEngine();
    }

    /**
     * Generate page components for all applicable paths
     */
    async generatePages(swaggerDoc, directoryManager) {
        this.resetStats();

        if (!swaggerDoc.paths) {
            console.error('❌ No paths found in Swagger document');
            return this.getStats();
        }

        const paths = swaggerDoc.paths;
        const applicablePaths = this.filterApplicablePaths(paths);

        console.log(`⚛️  Generating page components for ${applicablePaths.length} paths...`);

        for (const [routePath, pathItem] of applicablePaths) {
            try {
                await this.generatePage(routePath, pathItem, swaggerDoc, directoryManager);
                this.recordSuccess();
            } catch (error) {
                this.logError(`Failed to generate page for ${routePath}`, error);
                this.recordFailure(`${routePath}: ${error.message}`);
            }
        }

        console.log(`✅ Page component generation completed: ${this.stats.generated} generated, ${this.stats.failed} failed\n`);
        return this.getStats();
    }

    /**
     * Filter paths that should have page components generated
     */
    filterApplicablePaths(paths) {
        return Object.entries(paths).filter(([routePath, pathItem]) => {
            const methods = this.getHttpMethods(pathItem);

            // Generate pages for GET endpoints or user-facing routes
            return methods.includes('GET') || this.shouldGeneratePage(routePath);
        });
    }

    /**
     * Generate a single page component
     */
    async generatePage(routePath, pathItem, swaggerDoc, directoryManager) {
        // Generate page content
        const content = await this.generatePageContent(routePath, pathItem, swaggerDoc);

        // Write to file
        const filePath = directoryManager.getPageFilePath(routePath);
        const success = directoryManager.writeFile(filePath, content, `Page component ${routePath}`);

        if (!success) {
            throw new Error(`Failed to write page component file: ${filePath}`);
        }
    }

    /**
     * Generate the complete page component content
     */
    async generatePageContent(routePath, pathItem, swaggerDoc) {
        const methods = this.getHttpMethods(pathItem);
        const hasGetMethod = methods.includes('GET');
        const getOperation = hasGetMethod ? pathItem.get : null;

        // Prepare template data
        const templateData = {
            routePath,
            componentName: this.generateComponentName(routePath),
            pageTitle: this.generatePageTitle(routePath, getOperation),
            hasGetMethod,
            pathParams: this.extractPathParameters(routePath),
            queryParams: this.extractQueryParameters(getOperation),
            methods,
            getOperation,
            allOperations: this.extractAllOperations(pathItem, methods),
            apiUrl: this.buildApiUrl(routePath),
            uiFeatures: this.determineUIFeatures(methods, getOperation),
            aiPromptData: this.generateReactAIPrompt(routePath, methods, getOperation, pathItem)
        };

        try {
            // Use template engine to generate content
            return await this.templateEngine.render('pages/page.tsx.template', templateData);
        } catch (error) {
            // Fallback to inline generation if template fails
            this.logWarning(`Template rendering failed for ${routePath}, using fallback generation`);
            return this.generateFallbackPageContent(templateData);
        }
    }

    /**
     * Extract query parameters from GET operation
     */
    extractQueryParameters(getOperation) {
        if (!getOperation?.parameters) return [];

        return getOperation.parameters
            .filter(param => param.in === 'query')
            .map(param => ({
                name: param.name,
                type: param.schema?.type || 'string',
                required: param.required || false,
                description: param.description || 'No description',
                enum: param.schema?.enum || null
            }));
    }

    /**
     * Extract all operations for the path
     */
    extractAllOperations(pathItem, methods) {
        const operations = {};

        methods.forEach(method => {
            const operation = pathItem[method.toLowerCase()];
            if (operation) {
                operations[method] = {
                    method,
                    summary: operation.summary || 'Not specified',
                    description: operation.description || 'Not specified',
                    hasRequestBody: !!operation.requestBody,
                    requestBodyDescription: operation.requestBody?.description || 'Not specified',
                    parameters: operation.parameters || []
                };
            }
        });

        return operations;
    }

    /**
     * Build API URL with parameter placeholders
     */
    buildApiUrl(routePath) {
        const pathParams = this.extractPathParameters(routePath);
        let apiUrl = `/api${routePath}`;

        // Replace path parameters with template literals
        pathParams.forEach(param => {
            apiUrl = apiUrl.replace(`{${param}}`, `\${${param}}`);
        });

        return apiUrl;
    }

    /**
     * Determine UI features based on available methods
     */
    determineUIFeatures(methods, getOperation) {
        return {
            hasDataFetching: methods.includes('GET'),
            hasCreateForm: methods.includes('POST'),
            hasUpdateForm: methods.includes('PUT') || methods.includes('PATCH'),
            hasDeleteAction: methods.includes('DELETE'),
            needsRefresh: methods.includes('GET'),
            needsConfirmation: methods.includes('DELETE'),
            hasParameters: getOperation?.parameters?.length > 0,
            isInteractive: methods.length > 1 || methods.some(m => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(m))
        };
    }

    /**
     * Generate AI prompt data for React component enhancement
     */
    generateReactAIPrompt(routePath, methods, getOperation, pathItem) {
        return {
            componentInfo: {
                route: routePath,
                apiEndpoint: `/api${routePath}`,
                methods: methods.join(', '),
                framework: 'Next.js 13+ with App Router',
                typescript: true,
                styling: 'Tailwind CSS'
            },
            getEndpointDetails: getOperation ? {
                summary: getOperation.summary || 'Not specified',
                description: getOperation.description || 'Not specified',
                parameters: getOperation.parameters?.map(param => ({
                    name: param.name,
                    location: param.in,
                    type: param.schema?.type || 'unknown',
                    description: param.description || 'No description'
                })) || [],
                responses: this.extractResponseSchemas(getOperation)
            } : null,
            allOperations: Object.keys(pathItem).filter(key =>
                ['get', 'post', 'put', 'delete', 'patch'].includes(key)
            ).map(method => ({
                method: method.toUpperCase(),
                summary: pathItem[method].summary || 'Not specified',
                description: pathItem[method].description || 'Not specified',
                hasRequestBody: !!pathItem[method].requestBody,
                bodyDescription: pathItem[method].requestBody?.description || 'Not specified'
            })),
            uiRequirements: this.getUIRequirements(),
            componentFeatures: this.getComponentFeatures(methods),
            stylingGuidelines: this.getStylingGuidelines(),
            errorHandling: this.getErrorHandlingRequirements(),
            performanceConsiderations: this.getPerformanceConsiderations()
        };
    }

    /**
     * Extract response schemas for documentation
     */
    extractResponseSchemas(operation) {
        if (!operation.responses) return [];

        return Object.entries(operation.responses).map(([code, response]) => ({
            code,
            description: response.description || 'No description',
            contentTypes: Object.keys(response.content || {}),
            hasSchema: !!(response.content && Object.values(response.content)[0]?.schema)
        }));
    }

    /**
     * Get UI requirements for AI prompt
     */
    getUIRequirements() {
        return [
            'Create a modern, responsive React component',
            'Use TypeScript with proper type definitions',
            'Implement state management with React hooks',
            'Add loading states and error handling',
            'Use Tailwind CSS for styling',
            'Follow React best practices and patterns',
            'Add proper accessibility features',
            'Implement form validation if applicable',
            'Add user feedback (success/error messages)',
            'Make it mobile-responsive'
        ];
    }

    /**
     * Get component features based on HTTP methods
     */
    getComponentFeatures(methods) {
        const features = [];

        if (methods.includes('GET')) {
            features.push('Data fetching from GET endpoint');
            features.push('Display fetched data in user-friendly format');
            features.push('Refresh/reload functionality');
        }

        if (methods.includes('POST')) {
            features.push('Form for creating new resources');
            features.push('Form validation and submission');
        }

        if (methods.includes('PUT') || methods.includes('PATCH')) {
            features.push('Edit/update functionality');
            features.push('Pre-populate forms with existing data');
        }

        if (methods.includes('DELETE')) {
            features.push('Delete functionality with confirmation');
        }

        return features;
    }

    /**
     * Get styling guidelines for AI prompt
     */
    getStylingGuidelines() {
        return [
            'Use a clean, modern design',
            'Implement proper spacing and typography',
            'Add hover effects and transitions',
            'Use appropriate colors for different states',
            'Ensure good contrast for accessibility',
            'Make buttons and interactive elements obvious'
        ];
    }

    /**
     * Get error handling requirements
     */
    getErrorHandlingRequirements() {
        return [
            'Handle network errors gracefully',
            'Display user-friendly error messages',
            'Provide retry mechanisms where appropriate',
            'Log errors for debugging'
        ];
    }

    /**
     * Get performance considerations
     */
    getPerformanceConsiderations() {
        return [
            'Use React.memo() if needed for optimization',
            'Implement proper loading states',
            'Add debouncing for search/filter inputs',
            'Use appropriate data fetching strategies'
        ];
    }

    /**
     * Generate fallback content when template fails
     */
    generateFallbackPageContent(templateData) {
        const {
            routePath,
            componentName,
            pageTitle,
            hasGetMethod,
            pathParams,
            methods,
            apiUrl
        } = templateData;

        let content = `/**\n`;
        content += ` * AI PROMPT FOR REACT COMPONENT GENERATION:\n`;
        content += ` * =========================================\n`;
        content += ` * \n`;
        content += ` * You are a React/Next.js frontend developer. Generate a complete, production-ready React component.\n`;
        content += ` * \n`;
        content += ` * COMPONENT INFORMATION:\n`;
        content += ` * - Route: ${routePath}\n`;
        content += ` * - API Endpoint: /api${routePath}\n`;
        content += ` * - Available HTTP Methods: ${methods.join(', ')}\n`;
        content += ` * - Framework: Next.js 13+ with App Router\n`;
        content += ` * - TypeScript: Yes\n`;
        content += ` * - Styling: Tailwind CSS\n`;
        content += ` * \n`;
        content += ` * GENERATE: A complete, functional React component with all necessary features, proper TypeScript types, and professional UI/UX.\n`;
        content += ` */\n\n`;

        content += `'use client';\n\n`;
        content += `import React, { useState, useEffect } from 'react';\n`;
        content += `import { useParams, useSearchParams } from 'next/navigation';\n\n`;

        content += `export default function ${componentName}() {\n`;

        // Add path parameters extraction if needed
        if (pathParams.length > 0) {
            content += `  const params = useParams();\n`;
            pathParams.forEach(param => {
                content += `  const ${param} = params.${param} as string;\n`;
            });
            content += `\n`;
        }

        content += `  // State management\n`;
        content += `  const [data, setData] = useState<any>(null);\n`;
        content += `  const [loading, setLoading] = useState(false);\n`;
        content += `  const [error, setError] = useState<string | null>(null);\n\n`;

        if (hasGetMethod) {
            content += `  // Fetch data on component mount\n`;
            content += `  useEffect(() => {\n`;
            if (pathParams.length > 0) {
                content += `    if (${pathParams.map(p => p).join(' && ')}) {\n`;
                content += `      fetchData();\n`;
                content += `    }\n`;
            } else {
                content += `    fetchData();\n`;
            }
            content += `  }, [${pathParams.map(p => p).join(', ')}]);\n\n`;

            content += `  const fetchData = async () => {\n`;
            content += `    setLoading(true);\n`;
            content += `    setError(null);\n`;
            content += `    \n`;
            content += `    try {\n`;
            content += `      const response = await fetch(\`${apiUrl}\`);\n`;
            content += `      if (!response.ok) {\n`;
            content += `        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);\n`;
            content += `      }\n`;
            content += `      const result = await response.json();\n`;
            content += `      setData(result);\n`;
            content += `    } catch (err: any) {\n`;
            content += `      setError(err.message || 'Failed to fetch data');\n`;
            content += `    } finally {\n`;
            content += `      setLoading(false);\n`;
            content += `    }\n`;
            content += `  };\n\n`;
        }

        content += `  return (\n`;
        content += `    <div className="container mx-auto p-6 max-w-4xl">\n`;
        content += `      <div className="bg-white rounded-lg shadow-lg p-6">\n`;
        content += `        <h1 className="text-3xl font-bold text-gray-800 mb-6">\n`;
        content += `          ${pageTitle}\n`;
        content += `        </h1>\n\n`;

        // Path parameters display
        if (pathParams.length > 0) {
            content += `        {/* Path Parameters */}\n`;
            content += `        <div className="bg-gray-50 p-4 rounded-lg mb-6">\n`;
            content += `          <h3 className="text-sm font-semibold text-gray-600 mb-2">Parameters:</h3>\n`;
            pathParams.forEach(param => {
                content += `          <div className="text-sm text-gray-700">\n`;
                content += `            <span className="font-medium">${param}:</span> <code className="bg-gray-200 px-2 py-1 rounded">{${param}}</code>\n`;
                content += `          </div>\n`;
            });
            content += `        </div>\n\n`;
        }

        if (hasGetMethod) {
            content += `        {/* Loading State */}\n`;
            content += `        {loading && (\n`;
            content += `          <div className="flex items-center justify-center py-8">\n`;
            content += `            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>\n`;
            content += `            <span className="ml-3 text-gray-600">Loading...</span>\n`;
            content += `          </div>\n`;
            content += `        )}\n\n`;

            content += `        {/* Error State */}\n`;
            content += `        {error && (\n`;
            content += `          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">\n`;
            content += `            <div className="flex items-center">\n`;
            content += `              <div className="text-red-600 mr-3">⚠️</div>\n`;
            content += `              <div>\n`;
            content += `                <h3 className="text-red-800 font-semibold">Error</h3>\n`;
            content += `                <p className="text-red-700">{error}</p>\n`;
            content += `                <button \n`;
            content += `                  onClick={fetchData}\n`;
            content += `                  className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"\n`;
            content += `                >\n`;
            content += `                  Try Again\n`;
            content += `                </button>\n`;
            content += `              </div>\n`;
            content += `            </div>\n`;
            content += `          </div>\n`;
            content += `        )}\n\n`;

            content += `        {/* Success State */}\n`;
            content += `        {data && !loading && (\n`;
            content += `          <div className="space-y-6">\n`;
            content += `            <div className="flex items-center justify-between">\n`;
            content += `              <h2 className="text-xl font-semibold text-gray-800">Data</h2>\n`;
            content += `              <button \n`;
            content += `                onClick={fetchData}\n`;
            content += `                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"\n`;
            content += `              >\n`;
            content += `                Refresh\n`;
            content += `              </button>\n`;
            content += `            </div>\n`;
            content += `            \n`;
            content += `            <div className="bg-gray-50 rounded-lg p-4 overflow-auto">\n`;
            content += `              <pre className="text-sm text-gray-800 whitespace-pre-wrap">\n`;
            content += `                {JSON.stringify(data, null, 2)}\n`;
            content += `              </pre>\n`;
            content += `            </div>\n`;
            content += `          </div>\n`;
            content += `        )}\n\n`;
        }

        content += `        {/* API Information */}\n`;
        content += `        <div className="mt-8 pt-6 border-t border-gray-200">\n`;
        content += `          <h3 className="text-lg font-semibold text-gray-800 mb-3">API Information</h3>\n`;
        content += `          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">\n`;
        content += `            <div>\n`;
        content += `              <span className="text-gray-600">Endpoint:</span>\n`;
        content += `              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">${routePath}</code>\n`;
        content += `            </div>\n`;
        content += `            <div>\n`;
        content += `              <span className="text-gray-600">Methods:</span>\n`;
        content += `              <span className="ml-2 font-medium text-blue-600">${methods.join(', ')}</span>\n`;
        content += `            </div>\n`;
        content += `          </div>\n`;
        content += `        </div>\n`;
        content += `      </div>\n`;
        content += `    </div>\n`;
        content += `  );\n`;
        content += `}\n`;

        return content;
    }
}

module.exports = PageComponentGenerator;