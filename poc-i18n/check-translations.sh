#!/bin/bash
# 翻译维护脚本
# 当源文档更新时，标记翻译为需要更新

echo "🔍 Checking for document updates..."

# 获取源文件的最新修改时间
for file in *.md; do
  if [[ ! "$file" =~ \.[a-z]{2}(-[A-Z]{2})?\.md$ ]]; then
    source_mtime=$(stat -f %m "$file")
    base="${file%.md}"
    
    # 检查各语言版本
    for lang_file in ${base}.*.md; do
      if [ -f "$lang_file" ]; then
        trans_mtime=$(stat -f %m "$lang_file")
        
        if [ $source_mtime -gt $trans_mtime ]; then
          echo "⚠️  $lang_file needs update (source: $file)"
        fi
      fi
    done
  fi
done

echo "✅ Check complete"
