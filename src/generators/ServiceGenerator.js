import BaseGenerator from './BaseGenerator.js';
import { toPascalCase, toCamelCase, toKebabCase } from '../utils/StringUtils.js';
import path from 'path';

export default class ServiceGenerator extends BaseGenerator {
    constructor(spec, options) {
        super(spec, options);
        this.serviceName = options.serviceName || 'api';
    }

    async generate() {
        this.emit('progress', { step: 'services', message: 'Generating service wrappers and handlers...' });

        const results = [];
        const resources = this.extractResources();

        for (const resource of resources) {
            try {
                // Generate service file
                const serviceResult = await this.generateServiceFile(resource);
                if (serviceResult) {
                    results.push(serviceResult);
                }

                // Generate API handler file
                const handlerResult = await this.generateHandlerFile(resource);
                if (handlerResult) {
                    results.push(handlerResult);
                }
            } catch (error) {
                console.error(`Error generating service files for ${resource}:`, error);
                this.emit('warning', `Failed to generate service files for ${resource}: ${error.message}`);
            }
        }

        // Generate shared utilities if not resource-specific
        if (this.options.generateSharedUtils) {
            const utilsResult = await this.generateSharedUtils();
            if (utilsResult) {
                results.push(...utilsResult);
            }
        }

        this.emit('progress', {
            step: 'services',
            message: `Generated ${results.length} service files`,
            completed: true
        });

        return {
            files: results,
            totalFiles: results.length
        };
    }

    extractResources() {
        const resources = new Set();
        const paths = this.spec.paths || {};

        for (const pathStr of Object.keys(paths)) {
            const resource = this.extractResource(pathStr);
            if (resource && resource !== 'root') {
                resources.add(resource);
            }
        }

        return Array.from(resources);
    }

    extractResource(pathStr) {
        const segments = pathStr.split('/').filter(Boolean);
        const prefixesToSkip = ['api', 'v1', 'v2', 'v3'];
        let startIndex = 0;

        while (startIndex < segments.length && prefixesToSkip.includes(segments[startIndex])) {
            startIndex++;
        }

        for (let i = startIndex; i < segments.length; i++) {
            if (!segments[i].startsWith('{') && !segments[i].endsWith('}')) {
                return segments[i];
            }
        }

        return null;
    }

    async generateServiceFile(resource) {
        const templateContext = {
            serviceName: this.serviceName,
            resourceName: resource,
            apiUrl: this.options.apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
        };

        // Render the template directly if template doesn't exist
        const templatePath = 'services/[resource]-service.ts.hbs';
        let content;

        try {
            // Try to use template if it exists
            content = await this.templateEngine.render(templatePath, templateContext);
        } catch (error) {
            // Fallback to inline template
            console.warn(`Service template not found: ${templatePath}, using inline template`);
            content = this.generateServiceContent(templateContext);
        }

        // Determine output path
        const outputPath = path.join(
            this.options.output,
            'app',
            'api',
            `${toKebabCase(resource)}-service.ts`
        );

        if (!this.options.dryRun) {
            await this.fileWriter.writeFile(outputPath, content);
        }

        return {
            file: outputPath,
            type: 'service',
            resource
        };
    }

    generateServiceContent(context) {
        return `import { ${toPascalCase(context.serviceName)}Api, Configuration } from '@/lib/api-client';
import { AxiosRequestConfig } from 'axios';

// Service instance singleton
let ${toCamelCase(context.resourceName)}Service: ${toPascalCase(context.resourceName)}Service | null = null;

/**
 * Service wrapper for ${toPascalCase(context.resourceName)} API operations
 */
export class ${toPascalCase(context.resourceName)}Service {
  public ${toCamelCase(context.resourceName)}: ${toPascalCase(context.serviceName)}Api;
  private baseConfig: Configuration;

  constructor(config?: Configuration) {
    this.baseConfig = config || new Configuration({
      basePath: process.env.NEXT_PUBLIC_API_URL || '${context.apiUrl}',
    });
    
    this.${toCamelCase(context.resourceName)} = new ${toPascalCase(context.serviceName)}Api(this.baseConfig);
  }

  /**
   * Create request config with session headers
   */
  withSession(sessionId: string): AxiosRequestConfig {
    return {
      headers: {
        'X-Session-ID': sessionId,
        'Content-Type': 'application/json',
      },
    };
  }

  /**
   * Update base configuration
   */
  updateConfig(config: Partial<Configuration>) {
    this.baseConfig = new Configuration({
      ...this.baseConfig,
      ...config,
    });
    this.${toCamelCase(context.resourceName)} = new ${toPascalCase(context.serviceName)}Api(this.baseConfig);
  }
}

/**
 * Get or create the ${toPascalCase(context.resourceName)} service instance
 */
export function get${toPascalCase(context.resourceName)}Service(): ${toPascalCase(context.resourceName)}Service {
  if (!${toCamelCase(context.resourceName)}Service) {
    ${toCamelCase(context.resourceName)}Service = new ${toPascalCase(context.resourceName)}Service();
  }
  return ${toCamelCase(context.resourceName)}Service;
}

/**
 * Reset the service instance (useful for testing)
 */
export function reset${toPascalCase(context.resourceName)}Service(): void {
  ${toCamelCase(context.resourceName)}Service = null;
}`;
    }

    async generateHandlerFile(resource) {
        const templateContext = {
            serviceName: this.serviceName,
            resourceName: resource,
        };

        // Render the template directly if template doesn't exist
        const templatePath = 'services/[resource]-api-handler.ts.hbs';
        let content;

        try {
            // Try to use template if it exists
            content = await this.templateEngine.render(templatePath, templateContext);
        } catch (error) {
            // Fallback to inline template
            console.warn(`Handler template not found: ${templatePath}, using inline template`);
            content = this.generateHandlerContent(templateContext);
        }

        // Determine output path
        const outputPath = path.join(
            this.options.output,
            'app',
            'api',
            `${toKebabCase(resource)}-api-handler.ts`
        );

        if (!this.options.dryRun) {
            await this.fileWriter.writeFile(outputPath, content);
        }

        return {
            file: outputPath,
            type: 'handler',
            resource
        };
    }

    generateHandlerContent(context) {
        return `import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@/utils/logger';

export interface AuthInfo {
  sessionId: string;
  token: string;
  userInfo?: {
    id: string;
    email?: string;
    name?: string;
  };
}

/**
 * Authentication middleware for ${toPascalCase(context.resourceName)} API routes
 */
export async function withAuthenticationAsync<T>(
  handler: (auth: AuthInfo) => Promise<T>,
  request: NextRequest
): Promise<T | NextResponse> {
  try {
    // Extract session from cookies or headers
    const sessionId = request.cookies.get('session-id')?.value || 
                     request.headers.get('X-Session-ID');

    if (!sessionId) {
      logger.warn('No session ID found in request');
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        error: 'NO_SESSION',
      }, { status: StatusCodes.UNAUTHORIZED });
    }

    // Extract authorization token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      logger.warn('No authorization token found in request');
      return NextResponse.json({
        success: false,
        message: 'Authorization token required',
        error: 'NO_TOKEN',
      }, { status: StatusCodes.UNAUTHORIZED });
    }

    // TODO: Validate session and token with auth service
    // For now, we'll pass through with the extracted values
    const authInfo: AuthInfo = {
      sessionId,
      token,
      userInfo: {
        id: 'user-id', // This should come from token validation
      },
    };

    // Call the handler with auth info
    return await handler(authInfo);

  } catch (error) {
    logger.error('Authentication error:', error);
    return NextResponse.json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_ERROR',
    }, { status: StatusCodes.UNAUTHORIZED });
  }
}

/**
 * Create standardized error response
 */
export async function createErrorResponseAsync(
  error: any,
  defaultMessage: string
): Promise<NextResponse> {
  logger.error(defaultMessage, error);

  // Handle Axios errors from API client
  if (error.response) {
    const status = error.response.status || StatusCodes.INTERNAL_SERVER_ERROR;
    const data = error.response.data;

    // If the API already returns a structured error, use it
    if (data && typeof data === 'object') {
      return NextResponse.json({
        success: false,
        message: data.message || defaultMessage,
        error: data.error || 'API_ERROR',
        details: data.details,
      }, { status });
    }

    // Otherwise, create a structured error
    return NextResponse.json({
      success: false,
      message: error.response.statusText || defaultMessage,
      error: 'API_ERROR',
      status,
    }, { status });
  }

  // Handle network errors
  if (error.request) {
    return NextResponse.json({
      success: false,
      message: 'Service unavailable',
      error: 'NETWORK_ERROR',
    }, { status: StatusCodes.SERVICE_UNAVAILABLE });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return NextResponse.json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: error.details || error.message,
    }, { status: StatusCodes.BAD_REQUEST });
  }

  // Default error response
  return NextResponse.json({
    success: false,
    message: defaultMessage,
    error: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
}

/**
 * Validate request parameters
 */
export function validateParams(
  params: Record<string, any>,
  required: string[]
): { valid: boolean; missing?: string[] } {
  const missing = required.filter(key => !params[key]);
  
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  
  return { valid: true };
}

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
  const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '10', 10)));
  const sortBy = searchParams.get('sortBy') || 'id';
  const sortDir = (searchParams.get('sortDir') || 'asc').toLowerCase() as 'asc' | 'desc';

  return { page, size, sortBy, sortDir };
}`;
    }

    async generateSharedUtils() {
        const results = [];

        // Generate logger utility
        const loggerPath = path.join(this.options.output, 'utils', 'logger.ts');

        try {
            const templateContext = {
                projectName: this.spec.info?.title || 'API Project',
            };

            let content;
            try {
                // Try to use template
                content = await this.templateEngine.render('utils/logger.ts.hbs', templateContext);
            } catch (error) {
                // Fallback to inline content
                console.warn('Logger template not found, using inline template');
                content = this.generateLoggerContent(templateContext);
            }

            if (!this.options.dryRun) {
                await this.fileWriter.writeFile(loggerPath, content);
            }
            results.push({ file: loggerPath, type: 'utility', name: 'logger' });
        } catch (error) {
            // If file exists and force is not set, that's okay
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }

        return results;
    }

    generateLoggerContent(context) {
        return `/**
 * Logger utility for ${context.projectName}
 * Generated by swagger-to-nextjs
 * 
 * This is a simple console-based logger.
 * Replace with your preferred logging library (winston, pino, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = \`[\${timestamp}] [\${level.toUpperCase()}]\`;

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(prefix, message, ...args);
        }
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, error?: Error | any, ...args: any[]) {
    if (error instanceof Error) {
      this.log('error', message, error.message, error.stack, ...args);
    } else {
      this.log('error', message, error, ...args);
    }
  }
}

export const logger = new Logger();`;
    }
}