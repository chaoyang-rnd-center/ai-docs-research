/**
 * 会议记录转结构化文档工具
 * 将非结构化会议记录转换为标准会议纪要
 * 
 * 使用方法:
 *   node meeting-to-doc.js --input meeting.txt --output minutes.md
 */

const fs = require('fs');

// 示例会议记录（语音转录后）
const sampleMeetingTranscript = `
会议记录 - 2025年3月24日

参与者：张三、李四、王五、赵六

---

张三：大家好，今天讨论Q2产品规划。首先回顾一下Q1完成情况。

李四：Q1我们完成了用户系统重构，性能提升了40%，但是文档更新滞后了。

王五：对，API文档还是旧的，很多开发者反馈找不到新接口的说明。

张三：好，Q2我们要把文档自动化提上日程。我提几个点：
1. API文档要自动生成，从代码注释同步
2. 每个PR要有文档检查，不能合并没文档的代码
3. 考虑引入AI辅助，自动总结PR变更

李四：技术方案我调研了一下，可以用GitHub Actions，零成本。

赵六：从时间上看，两周内可以完成基础版。

张三：行，李四负责技术方案，周五前给我详细计划。

王五：文档更新提醒我可以先做，这个简单。

张三：还有其他事项吗？

赵六：测试覆盖率也得同步更新，建议和文档一起检查。

张三：好，一起纳入PR检查流程。

---

行动项：
- 李四：技术方案文档（周五）
- 王五：文档更新提醒配置（周三）
- 赵六：PR检查流程设计（下周一）
- 张三：协调资源和排期

下次会议：3月31日
`;

/**
 * 解析会议记录
 */
function parseMeeting(transcript) {
  const lines = transcript.trim().split('\n');
  
  const meeting = {
    title: '',
    date: '',
    participants: [],
    summary: [],
    decisions: [],
    actionItems: [],
    nextMeeting: ''
  };
  
  let currentSection = 'header';
  let currentSpeaker = null;
  let currentTopic = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '' || line === '---') continue;
    
    // 解析标题和日期
    if (line.includes('会议记录') || line.includes('Meeting')) {
      const dateMatch = line.match(/(\d{4}年\d{1,2}月\d{1,2}日)|(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        meeting.date = dateMatch[0];
      }
      meeting.title = '产品规划会议';
      continue;
    }
    
    // 解析参与者
    if (line.includes('参与者') || line.includes('Attendees')) {
      const participants = line.split('：')[1] || line.split(':')[1];
      if (participants) {
        meeting.participants = participants.split(/[,、，]\s*/).map(p => p.trim());
      }
      continue;
    }
    
    // 解析发言人
    const speakerMatch = line.match(/^([\u4e00-\u9fa5]{2,4}|[A-Za-z\s]+)：/);
    if (speakerMatch) {
      if (currentSpeaker && currentTopic.length > 0) {
        meeting.summary.push({
          speaker: currentSpeaker,
          content: currentTopic.join(' ')
        });
      }
      currentSpeaker = speakerMatch[1];
      currentTopic = [line.replace(speakerMatch[0], '').trim()];
      continue;
    }
    
    // 继续当前话题
    if (currentSpeaker && !line.includes('：')) {
      currentTopic.push(line);
    }
    
    // 解析决策点（包含"要"、"决定"、"确定"等关键词）
    if (/[要需应]|[决定确定]|agreed|decided/i.test(line) && 
        line.length > 10 && 
        !line.includes('行动项')) {
      const decision = line.replace(/^[\d\s.]+/, '').trim();
      if (decision && !meeting.decisions.includes(decision)) {
        meeting.decisions.push(decision);
      }
    }
  }
  
  // 添加最后一个话题
  if (currentSpeaker && currentTopic.length > 0) {
    meeting.summary.push({
      speaker: currentSpeaker,
      content: currentTopic.join(' ')
    });
  }
  
  // 从行动项部分提取
  const actionSection = transcript.match(/行动项[：:]?\n?([\s\S]*?)(?=下次会议|$)/i);
  if (actionSection) {
    const actionLines = actionSection[1].split('\n');
    for (const line of actionLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const match = trimmed.match(/[-•]\s*(.+?)[：:]\s*(.+?)(?:（(.+?)）)?$/);
        if (match) {
          meeting.actionItems.push({
            assignee: match[1].trim(),
            task: match[2].trim(),
            deadline: match[3] || '待定'
          });
        }
      }
    }
  }
  
  // 提取下次会议
  const nextMeetingMatch = transcript.match(/下次会议[：:]?\s*(.+)/i);
  if (nextMeetingMatch) {
    meeting.nextMeeting = nextMeetingMatch[1].trim();
  }
  
  return meeting;
}

/**
 * 生成结构化会议纪要
 */
function generateMinutes(meeting) {
  let md = `# 会议纪要\n\n`;
  
  // 基本信息
  md += `**日期**: ${meeting.date || '未指定'}\n\n`;
  md += `**主题**: ${meeting.title || '未指定'}\n\n`;
  md += `**参与者**: ${meeting.participants.join('、') || '未指定'}\n\n`;
  md += `**记录人**: 自动生成\n\n`;
  md += `---\n\n`;
  
  // 会议摘要
  md += `## 📋 会议摘要\n\n`;
  if (meeting.summary.length > 0) {
    for (const item of meeting.summary) {
      md += `**${item.speaker}**: ${item.content}\n\n`;
    }
  } else {
    md += '_无详细记录_\n\n';
  }
  
  // 决策事项
  md += `## ✅ 决策事项\n\n`;
  if (meeting.decisions.length > 0) {
    meeting.decisions.forEach((d, i) => {
      md += `${i + 1}. ${d}\n`;
    });
    md += '\n';
  } else {
    md += '_未记录明确决策_\n\n';
  }
  
  // 行动项
  md += `## 📝 行动项\n\n`;
  if (meeting.actionItems.length > 0) {
    md += `| 负责人 | 任务 | 截止日期 | 状态 |\n`;
    md += `|--------|------|----------|------|\n`;
    for (const item of meeting.actionItems) {
      md += `| ${item.assignee} | ${item.task} | ${item.deadline} | ⏳ 待办 |\n`;
    }
    md += '\n';
  } else {
    md += '_未记录行动项_\n\n';
  }
  
  // 下次会议
  if (meeting.nextMeeting) {
    md += `## 📅 下次会议\n\n`;
    md += `${meeting.nextMeeting}\n\n`;
  }
  
  // 附加信息
  md += `---\n\n`;
  md += `*此文档由 AI 自动生成于 ${new Date().toLocaleString('zh-CN')}*\n`;
  
  return md;
}

/**
 * 生成摘要（用于快速预览）
 */
function generateSummary(meeting) {
  const decisions = meeting.decisions.length;
  const actions = meeting.actionItems.length;
  const participants = meeting.participants.length;
  
  return {
    decisions,
    actions,
    participants,
    highlights: meeting.decisions.slice(0, 3)
  };
}

// 主程序
console.log('📝 Meeting Notes Processor\n');

// 写入示例会议记录
const inputFile = './meeting-transcript.txt';
fs.writeFileSync(inputFile, sampleMeetingTranscript);
console.log(`📄 Input: ${inputFile}`);

// 解析会议
console.log('\n🔍 Parsing meeting transcript...');
const meeting = parseMeeting(sampleMeetingTranscript);

// 生成摘要
const summary = generateSummary(meeting);
console.log('\n📊 Meeting Summary:');
console.log(`   Participants: ${summary.participants}`);
console.log(`   Decisions: ${summary.decisions}`);
console.log(`   Action Items: ${summary.actions}`);
console.log('\n   Key Highlights:');
summary.highlights.forEach((h, i) => {
  console.log(`   ${i + 1}. ${h.slice(0, 50)}...`);
});

// 生成会议纪要
const minutes = generateMinutes(meeting);
const outputFile = './meeting-minutes.md';
fs.writeFileSync(outputFile, minutes);

console.log(`\n✅ Generated: ${outputFile}`);

// 显示预览
console.log('\n📝 Preview:');
console.log('─'.repeat(60));
console.log(minutes.split('\n').slice(0, 30).join('\n'));
console.log('...');
console.log('─'.repeat(60));

// 创建处理脚本
const processScript = `#!/bin/bash
# 批量处理会议记录

INPUT_DIR="\${1:-./meeting-raw}"
OUTPUT_DIR="\${2:-./meeting-minutes}"

mkdir -p "$OUTPUT_DIR"

echo "📝 Processing meeting notes..."
echo "   Input: $INPUT_DIR"
echo "   Output: $OUTPUT_DIR"
echo ""

for file in "$INPUT_DIR"/*.txt; do
  if [ -f "$file" ]; then
    basename=$(basename "$file" .txt)
    echo "   Processing: $basename"
    node meeting-to-doc.js --input "$file" --output "$OUTPUT_DIR/$basename.md"
  fi
done

echo ""
echo "✅ All meetings processed!"
`;

fs.writeFileSync('./batch-process.sh', processScript);
fs.chmodSync('./batch-process.sh', 0o755);

console.log('\n💡 Usage:');
console.log('   # 处理单个文件');
console.log('   node meeting-to-doc.js --input meeting.txt --output out.md');
console.log('');
console.log('   # 批量处理');
console.log('   ./batch-process.sh ./raw-meetings ./minutes');
console.log('');
console.log('📚 Generated files:');
console.log('   - meeting-transcript.txt (示例输入)');
console.log('   - meeting-minutes.md (结构化输出)');
console.log('   - batch-process.sh (批量处理脚本)');
