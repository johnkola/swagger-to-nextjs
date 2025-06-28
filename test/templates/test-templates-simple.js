// test-templates-simple.js
// A simple standalone test to check if templates exist and can be loaded

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testTemplates() {
    console.log('=== Simple Template Test ===\n');

    // List of templates that should exist
    const requiredTemplates = [
        'templates/api/[...route].ts.hbs',
        'templates/pages/list.tsx.hbs',
        'templates/pages/detail.tsx.hbs',
        'templates/pages/form.tsx.hbs',
        'templates/types/api.ts.hbs',
        'templates/lib/api-client.ts.hbs',
        'templates/lib/toast.ts.hbs',
        'templates/components/ThemeSwitcher.tsx.hbs',
        'templates/components/LoadingSpinner.tsx.hbs',
        'templates/components/ErrorAlert.tsx.hbs'
    ];

    console.log('1. Checking template files exist:\n');
    let allExist = true;

    for (const templatePath of requiredTemplates) {
        const fullPath = path.join(__dirname, templatePath);
        const exists = await fs.pathExists(fullPath);

        if (exists) {
            console.log(`  ✓ ${templatePath}`);
        } else {
            console.log(`  ✗ ${templatePath} - NOT FOUND`);
            allExist = false;
        }
    }

    if (!allExist) {
        console.log('\n❌ Some templates are missing!');
        return;
    }

    console.log('\n2. Testing template compilation:\n');

    // Test compiling a simple template
    const apiRouteTemplatePath = path.join(__dirname, 'templates/api/[...route].ts.hbs');

    if (await fs.pathExists(apiRouteTemplatePath)) {
        try {
            const templateContent = await fs.readFile(apiRouteTemplatePath, 'utf-8');
            console.log('  Template content loaded, length:', templateContent.length);

            // Try to compile it
            const template = Handlebars.compile(templateContent);
            console.log('  ✓ Template compiled successfully');

            // Try to render with minimal context
            const context = {
                resource: 'users',
                operations: [{
                    method: 'GET',
                    operationId: 'getUsers',
                    summary: 'Get all users',
                    responses: { '200': { description: 'Success' } }
                }],
                imports: [],
                theme: { theme: 'light' }
            };

            const rendered = template(context);
            console.log('  ✓ Template rendered successfully');
            console.log('  Rendered content length:', rendered.length);
            console.log('  First line:', rendered.split('\n')[0]);

        } catch (error) {
            console.error('  ✗ Template error:', error.message);
        }
    }

    console.log('\n3. Checking helpers file:\n');

    const helpersPath = path.join(__dirname, 'src/templates/helpers.js');
    if (await fs.pathExists(helpersPath)) {
        console.log('  ✓ helpers.js exists');

        try {
            // Try to import it
            const helpers = await import(helpersPath);
            console.log('  ✓ helpers.js can be imported');
            console.log('  Exported helpers:', Object.keys(helpers).join(', '));
        } catch (error) {
            console.error('  ✗ Error importing helpers:', error.message);
        }
    } else {
        console.log('  ✗ helpers.js NOT FOUND');
    }

    console.log('\n4. Checking TemplateEngine:\n');

    const templateEnginePath = path.join(__dirname, 'src/templates/TemplateEngine.js');
    if (await fs.pathExists(templateEnginePath)) {
        console.log('  ✓ TemplateEngine.js exists');

        try {
            const { default: TemplateEngine } = await import(templateEnginePath);
            console.log('  ✓ TemplateEngine can be imported');

            // Try to create an instance
            const engine = new TemplateEngine();
            console.log('  ✓ TemplateEngine instance created');

            // Try to render a template
            const result = await engine.render('api/[...route].ts.hbs', {
                resource: 'test',
                operations: [],
                imports: [],
                theme: { theme: 'light' }
            });

            console.log('  ✓ Template rendered via TemplateEngine');

        } catch (error) {
            console.error('  ✗ TemplateEngine error:', error.message);
            console.error('    Stack:', error.stack);
        }
    } else {
        console.log('  ✗ TemplateEngine.js NOT FOUND');
    }

    console.log('\n=== Test Complete ===');
}

// Run the test
testTemplates().catch(console.error);