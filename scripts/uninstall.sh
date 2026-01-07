#!/bin/bash

# Xray 卸载脚本
# 用法: bash uninstall.sh

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

echo "================================"
echo "Xray 卸载脚本"
echo "================================"
echo ""
echo -e "${YELLOW}⚠️  警告: 此操作将完全卸载 Xray${NC}"
echo ""
read -p "确认卸载？(yes/NO): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "操作已取消"
  exit 0
fi

echo ""
read -p "是否保留配置文件备份？(Y/n): " KEEP_BACKUP

# 停止并禁用服务
if systemctl is-active --quiet xray 2>/dev/null; then
  echo "停止 Xray 服务..."
  systemctl stop xray
fi

if systemctl is-enabled --quiet xray 2>/dev/null; then
  echo "禁用 Xray 服务..."
  systemctl disable xray
fi

# 备份配置文件
if [[ ! "$KEEP_BACKUP" =~ ^[Nn]$ ]]; then
  BACKUP_DIR="/var/backups/xray"
  mkdir -p "$BACKUP_DIR"
  if [ -f "/usr/local/etc/xray/config.json" ]; then
    BACKUP_FILE="$BACKUP_DIR/config-final-$(date +%Y%m%d-%H%M%S).json"
    cp /usr/local/etc/xray/config.json "$BACKUP_FILE"
    echo -e "${GREEN}配置文件已备份到: $BACKUP_FILE${NC}"
  fi
fi

# 使用官方脚本卸载
if [ -f "/usr/local/bin/xray" ]; then
  echo "卸载 Xray-core..."
  bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ remove --purge
fi

# 删除残留文件
echo "清理残留文件..."

# 删除配置目录
if [ -d "/usr/local/etc/xray" ]; then
  rm -rf /usr/local/etc/xray
  echo "已删除: /usr/local/etc/xray"
fi

# 删除日志目录
if [ -d "/var/log/xray" ]; then
  rm -rf /var/log/xray
  echo "已删除: /var/log/xray"
fi

# 删除服务文件
if [ -f "/etc/systemd/system/xray.service" ]; then
  rm -f /etc/systemd/system/xray.service
  echo "已删除: /etc/systemd/system/xray.service"
fi

if [ -f "/etc/systemd/system/xray@.service" ]; then
  rm -f /etc/systemd/system/xray@.service
  echo "已删除: /etc/systemd/system/xray@.service"
fi

if [ -d "/etc/systemd/system/xray.service.d" ]; then
  rm -rf /etc/systemd/system/xray.service.d
  echo "已删除: /etc/systemd/system/xray.service.d"
fi

if [ -d "/etc/systemd/system/xray@.service.d" ]; then
  rm -rf /etc/systemd/system/xray@.service.d
  echo "已删除: /etc/systemd/system/xray@.service.d"
fi

# 重新加载 systemd
systemctl daemon-reload

echo ""
echo "================================"
echo -e "${GREEN}✅ Xray 已完全卸载${NC}"
echo "================================"
echo ""

if [[ ! "$KEEP_BACKUP" =~ ^[Nn]$ ]]; then
  echo "配置文件备份位置: /var/backups/xray/"
  echo "如需完全删除，请手动执行: sudo rm -rf /var/backups/xray"
fi

echo ""
echo "感谢使用 Xray！"
