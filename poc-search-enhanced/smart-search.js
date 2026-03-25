/**
 * 增强版文档智能搜索系统
 * 测试 RAG 方案的搜索效果和优化策略
 */

const fs = require('fs');

// 简化的测试文档
const testDocuments = [
  {
    id: 'doc1',
    title: '系统架构概述',
    sections: [
      { heading: '整体架构', content: '本系统采用微服务架构，包含 API Gateway、用户服务、订单服务、支付服务。API Gateway 基于 Kong Nginx 实现，负责路由鉴权限流。用户服务提供注册登录功能，使用 JWT Token 认证。' },
      { heading: '数据存储', content: '用户服务使用 PostgreSQL 主数据库，订单服务使用 PostgreSQL，缓存使用 Redis，搜索使用 Elasticsearch，日志使用 ClickHouse。' },
      { heading: '部署架构', content: '生产环境使用 Kubernetes 部署，支持自动扩缩容 HPA 滚动更新健康检查。' }
    ]
  },
  {
    id: 'doc2',
    title: '部署指南',
    sections: [
      { heading: '环境要求', content: '开发环境需要 Docker 20.10 Docker Compose 2.0 Node.js 18。生产环境需要 Kubernetes 1.25 Helm 3.0 至少3个Worker节点推荐8C16G配置。' },
      { heading: '本地部署', content: '使用 Docker Compose 本地部署。步骤：克隆代码 docker-compose up -d 启动服务。访问 API localhost:3000 文档 localhost:3000/docs 数据库 localhost:5432 Redis localhost:6379。' },
      { heading: '生产部署', content: '使用 Kubernetes 部署。创建命名空间 production，使用 Helm 安装应用，检查 Pod 状态，查看日志。' },
      { heading: '配置说明', content: '关键配置 DATABASE_URL 数据库连接串 REDIS_URL Redis连接串 JWT_SECRET JWT签名密钥 LOG_LEVEL 日志级别。' }
    ]
  },
  {
    id: 'doc3',
    title: 'API 认证文档',
    sections: [
      { heading: '认证方式', content: 'JWT Token 认证。所有 API 请求需要在 Header 中携带 Token Authorization Bearer your-jwt-token。' },
      { heading: '获取 Token', content: '使用登录接口 POST api auth login 获取 Token。响应包含 token refreshToken expiresIn user 信息。' },
      { heading: 'Token 刷新', content: '当 Token 即将过期时使用 refreshToken 换取新 Token POST api auth refresh。' },
      { heading: '错误处理', content: '401 Unauthorized Token 无效或已过期。403 Forbidden 权限不足。' },
      { heading: '最佳实践', content: 'Token 存储在 httpOnly cookie 或 secure storage。自动刷新在 Token 过期前5分钟。失败重试 401 后尝试刷新一次失败则跳转登录。' }
    ]
  },
  {
    id: 'doc4',
    title: '性能优化指南',
    sections: [
      { heading: '数据库优化', content: '索引优化 单列索引 为用户邮箱创建唯一索引 为订单用户ID创建索引。复合索引 订单状态加创建时间复合索引。' },
      { heading: '查询优化', content: '避免 N+1 问题 使用 JOIN 或批量查询。错误做法循环查询每个用户的订单。正确做法使用 include 一次查询。' },
      { heading: '缓存策略', content: 'Redis 缓存。读取缓存 未命中再读数据库 写入缓存 TTL 1小时。Cache Aside 先读缓存未命中再读数据库。Write Through 写数据库同时写缓存。' },
      { heading: '前端优化', content: '代码分割 路由级别懒加载。图片优化 WebP格式 响应式图片srcset 懒加载loading lazy。' },
      { heading: '监控指标', content: 'API 响应时间目标小于200ms告警500ms。数据库查询时间目标小于50ms告警100ms。页面加载时间目标小于3s告警5s。错误率目标小于0.1%告警1%。' }
    ]
  },
  {
    id: 'doc5',
    title: '故障排查手册',
    sections: [
      { heading: '数据库连接问题', content: '症状 API 响应缓慢或超时 错误日志显示 connection refused 监控显示连接池耗尽。检查数据库状态 PostgreSQL pg_isready MySQL mysqladmin ping。查看连接数。检查慢查询。' },
      { heading: '内存溢出 OOM', content: '症状 Pod 被 Kubernetes 驱逐 应用突然崩溃重启 监控显示内存持续增长。排查查看内存使用 Node.js 内存分析生成堆快照。常见原因 内存泄漏未关闭的数据库连接 缓存过大未设置TTL 大对象一次性加载大量数据。' },
      { heading: '网络问题', content: '症状 服务间调用超时 DNS 解析失败 间歇性连接中断。排查工具 ping dig traceroute nc。' },
      { heading: '日志分析', content: '集中式日志查询 Elasticsearch 查询特定时间段错误日志。' }
    ]
  }
];

// 搜索系统
class DocumentSearch {
  constructor() {
    this.documents = [];
  }

  index(docs) {
    for (const doc of docs) {
      for (const section of doc.sections) {
        this.documents.push({
          id: doc.id,
          title: doc.title,
          section: section.heading,
          content: section.content,
          vector: this.embed(section.content)
        });
      }
    }
    console.log(`✅ Indexed ${this.documents.length} sections from ${docs.length} documents`);
  }

  embed(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
    
    const freq = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
    return freq;
  }

  similarity(v1, v2) {
    const words = new Set([...Object.keys(v1), ...Object.keys(v2)]);
    let dot = 0, norm1 = 0, norm2 = 0;
    
    for (const w of words) {
      const a = v1[w] || 0;
      const b = v2[w] || 0;
      dot += a * b;
      norm1 += a * a;
      norm2 += b * b;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  search(query, k = 3) {
    const queryVec = this.embed(query);
    
    const results = this.documents.map(doc => ({
      ...doc,
      score: this.similarity(queryVec, doc.vector)
    })).sort((a, b) => b.score - a.score);

    // 按文档去重
    const seen = new Set();
    const unique = [];
    
    for (const r of results) {
      if (!seen.has(r.id) && unique.length < k) {
        seen.add(r.id);
        unique.push(r);
      }
    }
    
    return unique;
  }

  highlight(text, query) {
    const words = query.toLowerCase().split(/\s+/);
    let highlighted = text;
    for (const word of words) {
      if (word.length > 2) {
        const regex = new RegExp(`(${word})`, 'gi');
        highlighted = highlighted.replace(regex, '**$1**');
      }
    }
    return highlighted.slice(0, 150) + (text.length > 150 ? '...' : '');
  }
}

// 测试查询
const testQueries = [
  { query: '如何部署到生产环境', expected: ['部署指南'] },
  { query: 'JWT token 怎么使用', expected: ['API 认证文档'] },
  { query: '数据库查询慢怎么办', expected: ['性能优化指南', '故障排查手册'] },
  { query: '内存溢出怎么排查', expected: ['故障排查手册'] },
  { query: 'Redis 缓存配置', expected: ['性能优化指南', '部署指南'] },
  { query: 'Kubernetes 部署步骤', expected: ['部署指南', '系统架构概述'] },
  { query: '用户登录接口', expected: ['API 认证文档'] },
  { query: '连接池满了', expected: ['故障排查手册'] }
];

// 主程序
console.log('🔍 Enhanced Document Search System\n');
console.log('═'.repeat(60));

const search = new DocumentSearch();
search.index(testDocuments);

console.log('\n' + '═'.repeat(60));
console.log('🧪 Testing Search Queries\n');

let totalScore = 0;
const detailedResults = [];

for (const test of testQueries) {
  console.log(`\n❓ Query: "${test.query}"`);
  console.log('─'.repeat(50));
  
  const results = search.search(test.query, 3);
  
  // 检查预期匹配
  const foundExpected = results.filter(r => 
    test.expected.some(exp => r.title.includes(exp))
  );
  
  const score = foundExpected.length > 0 ? 1 : 0;
  totalScore += score;
  
  console.log(`📊 Top ${results.length} Results:`);
  results.forEach((r, i) => {
    const isExpected = test.expected.some(exp => r.title.includes(exp));
    const matchIcon = isExpected ? '✅' : '  ';
    console.log(`   ${matchIcon} ${i + 1}. [${r.title}]`);
    console.log(`      Section: ${r.section}`);
    console.log(`      Score: ${r.score.toFixed(3)}`);
    console.log(`      ${search.highlight(r.content, test.query)}`);
  });
  
  const status = foundExpected.length > 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`   Result: ${status} (found ${foundExpected.length}/${test.expected.length} expected)`);
  
  detailedResults.push({
    query: test.query,
    expected: test.expected,
    found: results.map(r => r.title),
    passed: foundExpected.length > 0
  });
}

// 总结
console.log('\n' + '═'.repeat(60));
console.log('📈 Search Quality Report');
console.log('═'.repeat(60));
console.log(`   Total Queries: ${testQueries.length}`);
console.log(`   Passed: ${totalScore}`);
console.log(`   Failed: ${testQueries.length - totalScore}`);
console.log(`   Accuracy: ${(totalScore / testQueries.length * 100).toFixed(1)}%`);

// 性能统计
console.log('\n📊 System Stats:');
console.log(`   Documents: ${testDocuments.length}`);
console.log(`   Sections: ${search.documents.length}`);
console.log(`   Avg sections/doc: ${(search.documents.length / testDocuments.length).toFixed(1)}`);

// 分析失败案例
const failedQueries = detailedResults.filter(r => !r.passed);
if (failedQueries.length > 0) {
  console.log('\n⚠️  Failed Queries Analysis:');
  failedQueries.forEach(q => {
    console.log(`   ❌ "${q.query}"`);
    console.log(`      Expected: ${q.expected.join(', ')}`);
    console.log(`      Got: ${q.found.join(', ')}`);
  });
}

console.log('\n💡 Optimization Recommendations:');
console.log('   1. Use real embeddings (OpenAI text-embedding-3-small)');
console.log('   2. Add Chinese word segmentation (jieba)');
console.log('   3. Implement hybrid search (keyword + semantic)');
console.log('   4. Add query expansion with synonyms');
console.log('   5. Use cross-encoder for re-ranking');

// 保存报告
const report = {
  timestamp: new Date().toISOString(),
  stats: {
    documents: testDocuments.length,
    sections: search.documents.length,
    queries: testQueries.length,
    passed: totalScore,
    accuracy: (totalScore / testQueries.length * 100).toFixed(1)
  },
  results: detailedResults
};

fs.writeFileSync('./search-report.json', JSON.stringify(report, null, 2));
console.log('\n✅ Report saved: search-report.json');
