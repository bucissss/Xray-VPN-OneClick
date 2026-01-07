#!/bin/bash

# Xray 用户删除脚本
# 用法: bash del-user.sh <用户邮箱>

set -e

CONFIG_FILE="/usr/local/etc/xray/config.json"
BACKUP_DIR="/var/backups/xray"

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

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}错误: 配置文件不存在${NC}"
  exit 1
fi

# 获取用户邮箱
if [ -z "$1" ]; then
  read -p "请输入要删除的用户邮箱: " USER_EMAIL
else
  USER_EMAIL="$1"
fi

# 检查用户是否存在
if ! grep -q "\"email\": \"$USER_EMAIL\"" "$CONFIG_FILE"; then
  echo -e "${RED}错误: 用户 $USER_EMAIL 不存在${NC}"
  exit 1
fi

echo "================================"
echo "删除 Xray 用户"
echo "================================"
echo ""
echo "⚠️  即将删除用户: $USER_EMAIL"
read -p "确认删除？(y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "操作已取消"
  exit 0
fi

# 备份配置文件
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/config-$(date +%Y%m%d-%H%M%S).json"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "配置文件已备份到: $BACKUP_FILE"

# 使用 Python 删除用户
python3 << EOF
import json
import sys

try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)

    # 查找并删除用户
    user_found = False
    for inbound in config.get('inbounds', []):
        if inbound.get('protocol') == 'vless':
            clients = inbound['settings']['clients']
            for i, client in enumerate(clients):
                if client.get('email') == '$USER_EMAIL':
                    clients.pop(i)
                    user_found = True
                    break
            if user_found:
                break

    if not user_found:
        print("错误: 未找到用户")
        sys.exit(1)

    # 保存配置
    with open('$CONFIG_FILE', 'w') as f:
        json.dump(config, f, indent=2)

    print("用户删除成功")

except Exception as e:
    print(f"错误: {str(e)}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
  echo -e "${RED}删除用户失败，正在恢复配置...${NC}"
  cp "$BACKUP_FILE" "$CONFIG_FILE"
  exit 1
fi

# 重启 Xray 服务
echo "重启 Xray 服务..."
systemctl restart xray

# 等待服务启动
sleep 2

if systemctl is-active --quiet xray; then
  echo -e "${GREEN}✅ 用户删除成功，Xray 服务已重启${NC}"
else
  echo -e "${RED}❌ Xray 服务启动失败，正在恢复配置...${NC}"
  cp "$BACKUP_FILE" "$CONFIG_FILE"
  systemctl restart xray
  exit 1
fi

echo ""
echo "================================"
echo "✅ 操作完成"
echo "================================"
