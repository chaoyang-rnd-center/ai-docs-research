#!/usr/bin/env node
/**
 * OpenAPI 文档自动生成工具
 * 从 JSDoc 注释生成 OpenAPI 3.0 规范
 * 
 * 使用方法:
 *   node generate-openapi.js
 * 
 * 输出: openapi.json
 */

const fs = require('fs');
const path = require('path');

// 扫描路由文件
const ROUTES_DIR = './routes';

/**
 * 从 JSDoc 解析 API 信息
 * 简化版实现 - 生产环境建议使用 swagger-jsdoc
 */
function parseJsDoc(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const apis = [];
  
  // 匹配 JSDoc 块
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
  const matches = content.match(jsdocRegex) || [];
  
  for (const doc of matches) {
    const api = {};
    
    // 解析 @route
    const routeMatch = doc.match(/@route\s+(\w+)\s+(\S+)/);
    if (routeMatch) {
      api.method = routeMatch[1].toLowerCase();
      api.path = routeMatch[2];
    }
    
    // 解析 @group
    const groupMatch = doc.match(/@group\s+(.+)/);
    if (groupMatch) api.group = groupMatch[1];
    
    // 解析 @summary (使用第一行描述)
    const descMatch = doc.match(/\*\s+([A-Za-z].+)/);
    if (descMatch) api.summary = descMatch[1];
    
    // 解析 @description
    const fullDesc = doc.match(/@description\s+([\s\S]*?)(?=\*\s*@|\*\/)/);
    if (fullDesc) {
      api.description = fullDesc[1].replace(/\n\s*\*\s*/g, ' ').trim();
    }
    
    // 解析 @param
    const paramMatches = doc.matchAll(/@param\s+\{([^}]+)\}\s+(\[?\w+\]?)\s*(.+)?/g);
    api.parameters = [];
    for (const match of paramMatches) {
      const param = {
        type: match[1],
        name: match[2].replace(/[\[\]]/g, ''),
        required: !match[2].includes('['),
        description: match[3] || ''
      };
      if (match[2].includes('[')) param.default = param.name.match(/=(\w+)/)?.[1];
      api.parameters.push(param);
    }
    
    // 解析 @returns
    const returnMatches = doc.matchAll(/@returns\s+\{([^}]+)\}\s+(\d+)\s*-\s*(.+)/g);
    api.responses = {};
    for (const match of returnMatches) {
      const code = match[2];
      api.responses[code] = {
        description: match[3],
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      };
    }
    
    // 解析 @security
    if (doc.includes('@security')) {
      api.security = [{ bearerAuth: [] }];
    }
    
    if (api.method && api.path) {
      apis.push(api);
    }
  }
  
  return apis;
}

/**
 * 生成 OpenAPI 3.0 规范
 */
function generateOpenAPI(apis) {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'Sample API',
      description: 'Auto-generated API documentation from JSDoc comments',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'api@example.com'
      }
    },
    servers: [
      {
        url: 'https://api.example.com/v1',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User unique identifier' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            avatar: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'email', 'name']
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            ownerId: { type: 'string' },
            status: { type: 'string', enum: ['active', 'archived', 'deleted'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'name', 'ownerId']
        },
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object', nullable: true }
          },
          required: ['code', 'message']
        }
      }
    },
    tags: [
      { name: 'Users', description: 'User management operations' },
      { name: 'Projects', description: 'Project management' }
    ]
  };
  
  // 按路径组织 API
  for (const api of apis) {
    const pathKey = api.path.replace(/:([^/]+)/g, '{$1}');
    
    if (!spec.paths[pathKey]) {
      spec.paths[pathKey] = {};
    }
    
    const operation = {
      summary: api.summary || '',
      description: api.description || '',
      tags: api.group ? [api.group.split(' - ')[0]] : [],
      parameters: [],
      responses: api.responses || {
        '200': { description: 'Success' }
      }
    };
    
    // 添加参数
    for (const param of api.parameters || []) {
      if (api.path.includes(`{${param.name}}`)) {
        operation.parameters.push({
          name: param.name,
          in: 'path',
          required: true,
          schema: { type: mapType(param.type) },
          description: param.description
        });
      } else {
        operation.parameters.push({
          name: param.name,
          in: 'query',
          required: param.required,
          schema: { 
            type: mapType(param.type),
            default: param.default
          },
          description: param.description
        });
      }
    }
    
    // 添加安全要求
    if (api.security) {
      operation.security = api.security;
    }
    
    spec.paths[pathKey][api.method] = operation;
  }
  
  return spec;
}

function mapType(jsType) {
  const mapping = {
    'string': 'string',
    'integer': 'integer',
    'number': 'number',
    'boolean': 'boolean',
    'object': 'object',
    'array': 'array'
  };
  return mapping[jsType] || 'string';
}

// 主程序
console.log('🚀 OpenAPI Generator\n');

// 扫描所有路由文件
const files = fs.readdirSync(ROUTES_DIR)
  .filter(f => f.endsWith('.js'))
  .map(f => path.join(ROUTES_DIR, f));

console.log(`📁 Found ${files.length} route files`);

let allApis = [];
for (const file of files) {
  console.log(`   Parsing: ${path.basename(file)}`);
  const apis = parseJsDoc(file);
  allApis = allApis.concat(apis);
}

console.log(`\n📊 Parsed ${allApis.length} API endpoints`);

// 生成 OpenAPI 规范
const spec = generateOpenAPI(allApis);

// 写入文件
const outputPath = './openapi.json';
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`\n✅ Generated: ${outputPath}`);
console.log(`   Routes: ${Object.keys(spec.paths).length}`);
console.log(`   Schemas: ${Object.keys(spec.components.schemas).length}`);

// 显示示例
console.log('\n📋 Sample output (first 3 endpoints):');
allApis.slice(0, 3).forEach((api, i) => {
  console.log(`   ${i + 1}. ${api.method.toUpperCase()} ${api.path}`);
  console.log(`      ${api.summary}`);
});
