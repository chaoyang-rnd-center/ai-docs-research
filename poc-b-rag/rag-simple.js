/**
 * Simple RAG (Retrieval-Augmented Generation) System - PoC
 * Simplified version without memory issues
 */

const fs = require('fs');
const path = require('path');

// Simple document loader
function loadDocuments(docsPath) {
  const files = fs.readdirSync(docsPath).filter(f => f.endsWith('.md'));
  const documents = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(docsPath, file), 'utf-8');
    documents.push({
      source: file,
      content: content,
      chunks: splitIntoChunks(content)
    });
  }
  
  return documents;
}

// Split text into chunks by sections
function splitIntoChunks(text) {
  const lines = text.split('\n');
  const chunks = [];
  let currentChunk = [];
  
  for (const line of lines) {
    if (line.startsWith('#') && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [];
    }
    currentChunk.push(line);
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }
  
  return chunks.filter(c => c.trim().length > 50);
}

// Simple keyword-based search
function searchDocuments(documents, query) {
  const queryWords = query.toLowerCase().split(/\s+/);
  const results = [];
  
  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      const chunkLower = chunk.toLowerCase();
      let score = 0;
      
      for (const word of queryWords) {
        if (word.length > 2) {
          const count = (chunkLower.match(new RegExp(word, 'g')) || []).length;
          score += count;
        }
      }
      
      if (score > 0) {
        results.push({
          source: doc.source,
          content: chunk.slice(0, 300),
          score
        });
      }
    }
  }
  
  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}

// Main
console.log('🚀 RAG System PoC\n');

const docs = loadDocuments('./sample-docs');
console.log(`📄 Loaded ${docs.length} documents`);
console.log(`   Total chunks: ${docs.reduce((a, d) => a + d.chunks.length, 0)}`);

const queries = [
  'How do I deploy this project?',
  'What are the API endpoints for projects?',
  'How do I authenticate?',
  'What database is used?'
];

console.log('\n' + '='.repeat(50));
console.log('📝 Test Queries\n');

for (const query of queries) {
  console.log(`❓ Query: "${query}"`);
  const results = searchDocuments(docs, query);
  
  if (results.length > 0) {
    console.log(`📚 Top results:`);
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. [${r.source}] (score: ${r.score})`);
      console.log(`      ${r.content.replace(/\n/g, ' ').slice(0, 120)}...`);
    });
  } else {
    console.log('   ⚠️  No relevant documents found');
  }
  console.log('');
}

console.log('✅ PoC Complete!');
