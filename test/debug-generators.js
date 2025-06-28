#!/usr/bin/env node
// debug-generators.js - Test individual generators
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

// Import generators
import SwaggerLoader from '../src/core/SwaggerLoader.js';
import ApiRouteGenerator from '../src/generators/ApiRouteGenerator.js';
import PageGenerator from '../src/generators/PageGenerator.js';
import FileWriter from '../src/core/FileWriter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugGenerators() {
    console.log('=== DEBUGGING GENERATORS ===\n');

    // Load the spec
    const loader = new SwaggerLoader();
    const spec = await loader.load('http://localhost:8090/v3/api-docs/public-api');

    console.log('Loaded spec:', {
        openapi: spec.openapi,
        paths: Object.keys(spec.paths || {}).length,
        schemas: Object.keys(spec.components?.schemas || {}).length
    });

    // Initialize FileWriter
    const fileWriter = new FileWriter({
        dryRun: true,
        force: true
    });

    const outputDir = join(__dirname, 'debug-output');

    // Common options
    const options = {
        output: outputDir,
        outputDir: outputDir,
        dryRun: true,
        typescript: true,
        fileWriter: fileWriter,
        verbose: true
    };

    // Test API Route Generator
    console.log('\n=== TESTING API ROUTE GENERATOR ===');
    const apiGen = new ApiRouteGenerator(spec, options);

    // Check if templateEngine exists
    console.log('Has templateEngine?', !!apiGen.templateEngine);
    console.log('Template base dir:', apiGen.templateEngine?.options?.baseDir);

    // Check if template exists
    const apiTemplateExists = apiGen.templateEngine?.templateExists('api/[...route].ts.hbs');
    console.log('API template exists?', apiTemplateExists);

    try {
        const apiResult = await apiGen.generate();
        console.log('API Routes Result:', apiResult);
    } catch (error) {
        console.error('API Generator Error:', error);
    }

    // Test Page Generator
    console.log('\n=== TESTING PAGE GENERATOR ===');
    const pageGen = new PageGenerator(spec, options);

    // Check templates
    const pageTemplates = ['pages/list.tsx.hbs', 'pages/detail.tsx.hbs', 'pages/form.tsx.hbs'];
    for (const template of pageTemplates) {
        const exists = pageGen.templateEngine?.templateExists(template);
        console.log(`Template ${template} exists?`, exists);
    }

    try {
        const pageResult = await pageGen.generate();
        console.log('Pages Result:', pageResult);
    } catch (error) {
        console.error('Page Generator Error:', error);
    }

    // Test specific path processing
    console.log('\n=== TESTING SPECIFIC PATH ===');
    const firstPath = Object.keys(spec.paths)[0];
    const pathObj = spec.paths[firstPath];

    console.log(`\nPath: ${firstPath}`);
    console.log('Methods:', Object.keys(pathObj));

    // Try to generate route for this specific path
    if (apiGen.generateRoute) {
        try {
            const routeResult = await apiGen.generateRoute(firstPath, pathObj);
            console.log('Route result:', routeResult);
        } catch (error) {
            console.error('Route generation error:', error);
        }
    }
}

debugGenerators().catch(console.error);