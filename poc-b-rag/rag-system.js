/**
 * Simple RAG (Retrieval-Augmented Generation) System
 * PoC for AI Documentation
 * 
 * Architecture:
 * 1. Document Ingestion: Load markdown files
 * 2. Text Splitting: Break into chunks
 * 3. Embedding: Convert to vectors (mock for PoC)
 * 4. Storage: Simple in-memory vector store
 * 5. Retrieval: Similarity search
 * 6. Generation: Query with context
 */

const fs = require('fs');
const path = require('path');

// ==================== 1. Document Loader ====================

class DocumentLoader {
  constructor(docsPath) {
    this.docsPath = docsPath;
  }

  loadAll() {
    const files = fs.readdirSync(this.docsPath)
      .filter(f => f.endsWith('.md'));
    
    const documents = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(this.docsPath, file), 'utf-8');
      documents.push({
        source: file,
        content: content,
        metadata: { filename: file }
      });
    }
    return documents;
  }
}

// ==================== 2. Text Splitter ====================

class MarkdownSplitter {
  constructor(chunkSize = 500, overlap = 50) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  split(documents) {
    const chunks = [];
    
    for (const doc of documents) {
      // Simple splitting by headers and paragraphs
      const sections = doc.content.split(/\n##+ /);
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section.length === 0) continue;

        // Further split if section is too long
        if (section.length > this.chunkSize) {
          const subChunks = this.splitBySize(section);
          for (const chunk of subChunks) {
            chunks.push({
              content: chunk,
              metadata: {
                source: doc.source,
                section: i
              }
            });
          }
        } else {
          chunks.push({
            content: section,
            metadata: {
              source: doc.source,
              section: i
            }
          });
        }
      }
    }
    
    return chunks;
  }

  splitBySize(text) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - this.overlap;
    }
    
    return chunks;
  }
}

// ==================== 3. Simple Vector Store (Mock) ====================

class SimpleVectorStore {
  constructor() {
    this.documents = [];
  }

  // Mock embedding: use simple keyword matching
  // In production, use OpenAI embeddings or similar
  async addDocuments(chunks) {
    for (const chunk of chunks) {
      // Create a simple vector representation (word frequency)
      const vector = this.simpleEmbed(chunk.content);
      this.documents.push({
        ...chunk,
        vector
      });
    }
    console.log(`✅ Indexed ${chunks.length} document chunks`);
  }

  simpleEmbed(text) {
    // Simple bag-of-words embedding
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    const freq = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
    return freq;
  }

  similarity(v1, v2) {
    // Cosine similarity
    const words = new Set([...Object.keys(v1), ...Object.keys(v2)]);
    let dot = 0, norm1 = 0, norm2 = 0;
    
    for (const w of words) {
      const a = v1[w] || 0;
      const b = v2[w] || 0;
      dot += a * b;
      norm1 += a * a;
      norm2 += b * b;
    }
    
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2) + 1e-10);
  }

  search(query, k = 3) {
    const queryVector = this.simpleEmbed(query);
    
    const scored = this.documents.map(doc => ({
      ...doc,
      score: this.similarity(queryVector, doc.vector)
    }));
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

// ==================== 4. RAG Chain ====================

class RAGSystem {
  constructor(vectorStore) {
    this.vectorStore = vectorStore;
  }

  async query(question) {
    // 1. Retrieve relevant documents
    const relevant = this.vectorStore.search(question, 3);
    
    console.log('\n🔍 Retrieved documents:');
    relevant.forEach((doc, i) => {
      console.log(`  ${i + 1}. [${doc.metadata.source}] (score: ${doc.score.toFixed(3)})`);
      console.log(`     ${doc.content.slice(0, 100)}...`);
    });

    // 2. Build context
    const context = relevant.map(d => d.content).join('\n\n---\n\n');
    
    // 3. Generate prompt (in production, call LLM here)
    const prompt = this.buildPrompt(question, context);
    
    return {
      question,
      context,
      sources: relevant.map(d => d.metadata.source),
      prompt
    };
  }

  buildPrompt(question, context) {
    return `You are a helpful assistant. Answer the question based on the provided context.

Context:
${context}

Question: ${question}

Answer:`;
  }
}

// ==================== 5. Run PoC ====================

async function main() {
  console.log('🚀 RAG System PoC - Starting...\n');

  // Step 1: Load documents
  console.log('📄 Loading documents...');
  const loader = new DocumentLoader('./sample-docs');
  const docs = loader.loadAll();
  console.log(`   Loaded ${docs.length} documents`);

  // Step 2: Split into chunks
  console.log('\n✂️  Splitting documents...');
  const splitter = new MarkdownSplitter(500, 50);
  const chunks = splitter.split(docs);
  console.log(`   Created ${chunks.length} chunks`);

  // Step 3: Create vector store
  console.log('\n🧮 Building vector index...');
  const store = new SimpleVectorStore();
  await store.addDocuments(chunks);

  // Step 4: Initialize RAG
  const rag = new RAGSystem(store);

  // Step 5: Test queries
  const testQueries = [
    'How do I deploy this project?',
    'What are the API endpoints for projects?',
    'How do I authenticate with the API?',
    'What database does this project use?'
  ];

  console.log('\n' + '='.repeat(60));
  console.log('📝 Testing Queries');
  console.log('='.repeat(60));

  for (const query of testQueries) {
    console.log(`\n❓ Query: "${query}"`);
    console.log('-'.repeat(40));
    const result = await rag.query(query);
    console.log(`📚 Sources: ${result.sources.join(', ')}`);
  }

  console.log('\n✅ PoC Complete!');
  console.log('\n📊 Summary:');
  console.log(`   - Documents: ${docs.length}`);
  console.log(`   - Chunks: ${chunks.length}`);
  console.log(`   - Avg chunk size: ${Math.round(chunks.reduce((a, c) => a + c.content.length, 0) / chunks.length)} chars`);
}

main().catch(console.error);
