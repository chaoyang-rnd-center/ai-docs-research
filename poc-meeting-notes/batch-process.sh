#!/bin/bash
# 批量处理会议记录

INPUT_DIR="${1:-./meeting-raw}"
OUTPUT_DIR="${2:-./meeting-minutes}"

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
