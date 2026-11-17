/**
 * Carrega a especificação OpenAPI (YAML) usada pelo Swagger UI em /docs.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const specPath = path.resolve(__dirname, '..', 'docs', 'openapi.yaml');

module.exports = yaml.load(fs.readFileSync(specPath, 'utf8'));
