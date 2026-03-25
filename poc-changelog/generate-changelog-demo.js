/**
 * CHANGELOG 生成器 - 演示版本
 * 使用模拟数据展示功能
 */

const fs = require('fs');

// 模拟提交数据
const mockCommits = [
  { hash: 'abc1234', subject: 'feat(api): add user authentication endpoints', author: 'developer1', date: '2025-03-20' },
  { hash: 'def5678', subject: 'feat(ui): implement dark mode toggle', author: 'developer2', date: '2025-03-19' },
  { hash: 'ghi9012', subject: 'fix(api): resolve JWT token expiration bug', author: 'developer1', date: '2025-03-18' },
  { hash: 'jkl3456', subject: 'docs(readme): update installation instructions', author: 'developer3', date: '2025-03-17' },
  { hash: 'mno7890', subject: 'refactor(db): optimize user query performance', author: 'developer2', date: '2025-03-16' },
  { hash: 'pqr1234', subject: 'test(auth): add unit tests for login flow', author: 'developer1', date: '2025-03-15' },
  { hash: 'stu5678', subject: 'chore(deps): upgrade dependencies', author: 'developer2', date: '2025-03-14' },
  { hash: 'vwx9012', subject: 'feat: add project management module', author: 'developer1', date: '2025-03-13' },
  { hash: 'yza3456', subject: 'fix: correct pagination in list endpoints', author: 'developer3', date: '2025-03-12' },
  { hash: 'bcd7890', subject: 'perf: improve database indexing', author: 'developer2', date: '2025-03-11' },
  { hash: 'efg1234', subject: 'ci: add GitHub Actions workflow', author: 'developer1', date: '2025-03-10' },
  { hash: 'hij5678', subject: 'style: fix linting issues', author: 'developer3', date: '2025-03-09' }
];

const COMMIT_TYPES = {
  feat: { title: '✨ Features', emoji: '✨' },
  feature: { title: '✨ Features', emoji: '✨' },
  fix: { title: '🐛 Bug Fixes', emoji: '🐛' },
  docs: { title: '📚 Documentation', emoji: '📚' },
  style: { title: '💎 Styles', emoji: '💎' },
  refactor: { title: '♻️ Code Refactoring', emoji: '♻️' },
  perf: { title: '🚀 Performance', emoji: '🚀' },
  test: { title: '🧪 Tests', emoji: '🧪' },
  chore: { title: '🔧 Chores', emoji: '🔧' },
  ci: { title: '👷 CI/CD', emoji: '👷' },
  build: { title: '📦 Build', emoji: '📦' }
};

function parseConventionalCommit(subject) {
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  
  if (!match) {
    return { type: 'other', scope: null, subject };
  }
  
  const [, type, scope, msg] = match;
  return { type, scope, subject: msg };
}

function generateChangelog(commits, version, date) {
  const categories = {};
  const contributors = new Set();
  
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.subject);
    commit.parsed = parsed;
    contributors.add(commit.author);
    
    const typeKey = parsed.type in COMMIT_TYPES ? parsed.type : 'other';
    if (!categories[typeKey]) categories[typeKey] = [];
    categories[typeKey].push(commit);
  }
  
  let md = `## [${version}] - ${date}\n\n`;
  
  // 各类型提交
  for (const [type, info] of Object.entries(COMMIT_TYPES)) {
    const items = categories[type];
    if (!items || items.length === 0) continue;
    
    md += `### ${info.title}\n\n`;
    
    for (const commit of items) {
      const scope = commit.parsed.scope ? `**${commit.parsed.scope}**: ` : '';
      const shortHash = commit.hash.slice(0, 7);
      md += `- ${info.emoji} ${scope}${commit.parsed.subject} ([${shortHash}])\n`;
    }
    md += '\n';
  }
  
  // 贡献者
  if (contributors.size > 0) {
    md += `### 👥 Contributors\n\n`;
    md += Array.from(contributors).map(c => `@${c}`).join(', ');
    md += '\n\n';
  }
  
  return md;
}

// 主程序
console.log('🚀 CHANGELOG Generator (Demo)\n');

const version = '1.0.0';
const date = '2025-03-24';

console.log(`📋 Configuration:`);
console.log(`   Version: ${version}`);
console.log(`   Commits: ${mockCommits.length}`);

// 统计
const stats = {};
for (const commit of mockCommits) {
  const parsed = parseConventionalCommit(commit.subject);
  stats[parsed.type] = (stats[parsed.type] || 0) + 1;
}

console.log('\n📈 Commit breakdown:');
for (const [type, count] of Object.entries(stats)) {
  const info = COMMIT_TYPES[type] || { emoji: '📝' };
  console.log(`   ${info.emoji} ${type}: ${count}`);
}

// 生成内容
console.log('\n✍️  Generating CHANGELOG...');
const changelog = generateChangelog(mockCommits, version, date);

// 完整 CHANGELOG 带 header
const fullChangelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${changelog}`;

fs.writeFileSync('CHANGELOG.md', fullChangelog);

console.log(`\n✅ Generated: CHANGELOG.md`);
console.log(`\n📝 Preview:`);
console.log('─'.repeat(50));
console.log(changelog);
console.log('─'.repeat(50));

console.log('\n📖 Usage with Git:');
console.log('   # 从最新 tag 生成');
console.log('   node generate-changelog.js --from-tag v0.9.0');
console.log('   ');
console.log('   # 生成指定版本');
console.log('   node generate-changelog.js --version 2.0.0');
console.log('   ');
console.log('   # GitHub Actions 自动发布');
console.log('   git log $(git describe --tags --abbrev=0)..HEAD ...');
