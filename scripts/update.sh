#!/bin/bash

# Xray 更新脚本
# 用法: bash update.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}错误: 请使用 root 权限运行此脚本${NC}"
  echo "使用命令: sudo bash $0"
  exit 1
fi

# 检查 Xray 是否安装
if [ ! -f "/usr/local/bin/xray" ]; then
  echo -e "${RED}错误: Xray 未安装${NC}"
  exit 1
fi

echo "================================"
echo "Xray 更新脚本"
echo "================================"
echo ""

# 获取当前版本
CURRENT_VERSION=$(/usr/local/bin/xray version | head -n 1 | awk '{print $2}')
echo -e "${BLUE}当前版本: $CURRENT_VERSION${NC}"

# 检查最新版本
echo "正在检查最新版本..."
LATEST_VERSION=$(curl -s https://api.github.com/repos/XTLS/Xray-core/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_VERSION" ]; then
  echo -e "${RED}无法获取最新版本信息${NC}"
  exit 1
fi

echo -e "${BLUE}最新版本: $LATEST_VERSION${NC}"

# 比较版本
if [ "$CURRENT_VERSION" == "$LATEST_VERSION" ]; then
  echo -e "${GREEN}✅ 已是最新版本，无需更新${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}发现新版本: $LATEST_VERSION${NC}"
read -p "是否更新到最新版本？(y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "操作已取消"
  exit 0
fi

echo ""
echo "开始更新..."

# 备份配置文件
BACKUP_DIR="/var/backups/xray"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/config-$(date +%Y%m%d-%H%M%S).json"
cp /usr/local/etc/xray/config.json "$BACKUP_FILE" 2>/dev/null || true
echo "配置文件已备份到: $BACKUP_FILE"

# 停止服务
echo "停止 Xray 服务..."
systemctl stop xray

# 使用官方脚本更新
echo "下载并安装最新版本..."
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# 恢复配置文件（如果被覆盖）
if [ -f "$BACKUP_FILE" ]; then
  echo "恢复配置文件..."
  cp "$BACKUP_FILE" /usr/local/etc/xray/config.json
fi

# 启动服务
echo "启动 Xray 服务..."
systemctl start xray

# 等待服务启动
sleep 2

# 检查服务状态
if systemctl is-active --quiet xray; then
  NEW_VERSION=$(/usr/local/bin/xray version | head -n 1 | awk '{print $2}')
  echo ""
  echo "================================"
  echo -e "${GREEN}✅ 更新成功！${NC}"
  echo "================================"
  echo "旧版本: $CURRENT_VERSION"
  echo "新版本: $NEW_VERSION"
  echo ""
  echo "服务状态: 运行中"
else
  echo -e "${RED}❌ 服务启动失败${NC}"
  echo "请查看日志: journalctl -u xray -n 50"
  exit 1
fi
