#!/usr/bin/env node
/**
 * CHANGELOG 自动生成工具
 * 从 Git 提交历史生成结构化发布说明
 * 
 * 使用方法:
 *   node generate-changelog.js [--version x.x.x] [--from-tag v1.0.0]
 * 
 * 约定式提交 (Conventional Commits):
 *   feat: 新功能
 *   fix: 修复
 *   docs: 文档
 *   style: 格式
 *   refactor: 重构
 *   perf: 性能
 *   test: 测试
 *   chore: 构建/工具
 *   BREAKING CHANGE: 破坏性变更
 */

const { execSync } = require('child_process');
const fs = require('fs');

// 配置
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
  build: { title: '📦 Build', emoji: '📦' },
  revert: { title: '⏪ Reverts', emoji: '⏪' }
};

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    version: null,
    fromTag: null,
    toTag: 'HEAD',
    output: 'CHANGELOG.md'
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--version':
        options.version = args[++i];
        break;
      case '--from-tag':
        options.fromTag = args[++i];
        break;
      case '--to-tag':
        options.toTag = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
    }
  }
  
  return options;
}

/**
 * 获取 Git 提交历史
 */
function getCommits(fromTag, toTag) {
  const range = fromTag ? `${fromTag}..${toTag}` : toTag;
  const format = '%H|%s|%b|%an|%ad';
  
  try {
    const output = execSync(
      `git log ${range} --pretty=format:"${format}" --date=short`,
      { encoding: 'utf-8', cwd: '/Users/joez/.openclaw-coder/workspace' }
    );
    
    return output.split('\n').filter(line => line.trim()).map(line => {
      const [hash, subject, body, author, date] = line.split('|');
      return { hash, subject, body, author, date };
    });
  } catch (e) {
    console.error('Error getting git log:', e.message);
    return [];
  }
}

/**
 * 解析约定式提交
 */
function parseConventionalCommit(subject) {
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  
  if (!match) {
    return { type: 'chore', scope: null, subject, breaking: false };
  }
  
  const [, type, scope, msg] = match;
  const breaking = subject.includes('BREAKING CHANGE') || subject.includes('!:');
  
  return { type, scope, subject: msg, breaking };
}

/**
 * 获取最新 tag
 */
function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { 
      encoding: 'utf-8',
      cwd: '/Users/joez/.openclaw-coder/workspace'
    }).trim();
  } catch {
    return null;
  }
}

/**
 * 获取版本号
 */
function getNextVersion(currentVersion) {
  if (!currentVersion) return '0.1.0';
  
  const match = currentVersion.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return '0.1.0';
  
  const [, major, minor, patch] = match;
  // 简单规则：默认 minor 版本 +1
  return `${major}.${parseInt(minor) + 1}.0`;
}

/**
 * 生成 CHANGELOG 内容
 */
function generateChangelog(commits, version, date) {
  const categories = {};
  const breaking = [];
  const contributors = new Set();
  
  // 分类提交
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.subject);
    commit.parsed = parsed;
    
    contributors.add(commit.author);
    
    if (parsed.breaking) {
      breaking.push(commit);
    }
    
    const typeKey = parsed.type in COMMIT_TYPES ? parsed.type : 'chore';
    if (!categories[typeKey]) {
      categories[typeKey] = [];
    }
    categories[typeKey].push(commit);
  }
  
  // 生成内容
  let md = `## [${version}] - ${date}\n\n`;
  
  // 破坏性变更
  if (breaking.length > 0) {
    md += `### ⚠️ BREAKING CHANGES\n\n`;
    for (const commit of breaking) {
      const scope = commit.parsed.scope ? `**${commit.parsed.scope}**: ` : '';
      md += `- ${scope}${commit.parsed.subject}\n`;
    }
    md += '\n';
  }
  
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

/**
 * 更新 CHANGELOG.md 文件
 */
function updateChangelogFile(content, outputPath) {
  const header = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

  let existing = '';
  if (fs.existsSync(outputPath)) {
    existing = fs.readFileSync(outputPath, 'utf-8');
    // 去掉 header，保留已有内容
    existing = existing.replace(header, '');
    // 提取第一个版本之前的内容
    const firstVersionMatch = existing.match(/##\s*\[/);
    if (firstVersionMatch) {
      existing = existing.slice(firstVersionMatch.index);
    }
  }

  const newContent = header + content + existing;
  fs.writeFileSync(outputPath, newContent);
}

// 主程序
console.log('🚀 CHANGELOG Generator\n');

const options = parseArgs();
const today = new Date().toISOString().split('T')[0];

// 确定版本范围
const latestTag = options.fromTag || getLatestTag();
const version = options.version || getNextVersion(latestTag);

console.log(`📋 Configuration:`);
console.log(`   Version: ${version}`);
console.log(`   Range: ${latestTag || 'start'}..${options.toTag}`);
console.log(`   Output: ${options.output}`);

// 获取提交
console.log(`\n📊 Fetching commits...`);
const commits = getCommits(latestTag, options.toTag);
console.log(`   Found ${commits.length} commits`);

if (commits.length === 0) {
  console.log('\n⚠️  No commits found. Exiting.');
  process.exit(0);
}

// 显示提交统计
const stats = {};
for (const commit of commits) {
  const type = commit.parsed?.type || 'chore';
  stats[type] = (stats[type] || 0) + 1;
}

console.log('\n📈 Commit breakdown:');
for (const [type, count] of Object.entries(stats)) {
  const info = COMMIT_TYPES[type] || COMMIT_TYPES.chore;
  console.log(`   ${info.emoji} ${type}: ${count}`);
}

// 生成内容
console.log('\n✍️  Generating CHANGELOG...');
const changelog = generateChangelog(commits, version, today);

// 写入文件
updateChangelogFile(changelog, options.output);

console.log(`\n✅ Generated: ${options.output}`);
console.log(`\n📝 Preview (first 20 lines):`);
console.log(changelog.split('\n').slice(0, 20).join('\n'));
console.log('\n...');
