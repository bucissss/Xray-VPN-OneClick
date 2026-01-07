#!/bin/bash

# Xray 配置备份脚本
# 用法: bash backup.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}错误: 请使用 root 权限运行此脚本${NC}"
  echo "使用命令: sudo bash $0"
  exit 1
fi

# 配置
CONFIG_FILE="/usr/local/etc/xray/config.json"
BACKUP_DIR="/var/backups/xray"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "================================"
echo "Xray 配置备份脚本"
echo "================================"
echo ""

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}错误: 配置文件不存在${NC}"
  exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份配置文件
BACKUP_FILE="$BACKUP_DIR/config-$TIMESTAMP.json"
cp "$CONFIG_FILE" "$BACKUP_FILE"

# 备份 geoip 和 geosite 数据
if [ -f "/usr/local/share/xray/geoip.dat" ]; then
  cp "/usr/local/share/xray/geoip.dat" "$BACKUP_DIR/geoip-$TIMESTAMP.dat"
fi

if [ -f "/usr/local/share/xray/geosite.dat" ]; then
  cp "/usr/local/share/xray/geosite.dat" "$BACKUP_DIR/geosite-$TIMESTAMP.dat"
fi

# 创建压缩包
ARCHIVE_FILE="$BACKUP_DIR/xray-backup-$TIMESTAMP.tar.gz"
tar -czf "$ARCHIVE_FILE" -C /usr/local/etc xray/ 2>/dev/null || true

# 获取文件大小
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
ARCHIVE_SIZE=$(du -h "$ARCHIVE_FILE" | cut -f1 2>/dev/null || echo "N/A")

echo -e "${GREEN}✅ 备份完成！${NC}"
echo ""
echo "备份信息："
echo "  配置文件: $BACKUP_FILE ($BACKUP_SIZE)"
if [ "$ARCHIVE_SIZE" != "N/A" ]; then
  echo "  压缩包: $ARCHIVE_FILE ($ARCHIVE_SIZE)"
fi
echo "  备份目录: $BACKUP_DIR"
echo ""

# 列出最近的备份
echo "最近的备份文件（最多显示 5 个）："
ls -lt "$BACKUP_DIR"/config-*.json 2>/dev/null | head -5 | awk '{print "  " $9 " (" $6, $7, $8 ")"}'

# 清理旧备份（保留最近 10 个）
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/config-*.json 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
  echo ""
  echo "检测到超过 10 个备份文件"
  read -p "是否清理旧备份（保留最近 10 个）？(y/N): " CLEAN
  if [[ "$CLEAN" =~ ^[Yy]$ ]]; then
    ls -t "$BACKUP_DIR"/config-*.json | tail -n +11 | xargs rm -f
    ls -t "$BACKUP_DIR"/xray-backup-*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    echo -e "${GREEN}旧备份已清理${NC}"
  fi
fi

echo ""
echo "================================"
echo "💡 恢复备份使用以下命令："
echo "sudo cp $BACKUP_FILE /usr/local/etc/xray/config.json"
echo "sudo systemctl restart xray"
echo "================================"
