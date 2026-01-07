#!/bin/bash

# Xray 用户添加脚本
# 用法: bash add-user.sh <用户邮箱>

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

# 检查 Xray 是否安装
if [ ! -f "/usr/local/bin/xray" ]; then
  echo -e "${RED}错误: Xray 未安装${NC}"
  echo "请先运行安装脚本: bash install.sh"
  exit 1
fi

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}错误: 配置文件不存在${NC}"
  exit 1
fi

# 获取用户邮箱
if [ -z "$1" ]; then
  read -p "请输入新用户的邮箱地址: " USER_EMAIL
else
  USER_EMAIL="$1"
fi

# 验证邮箱格式
if [[ ! "$USER_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
  echo -e "${RED}错误: 无效的邮箱地址${NC}"
  exit 1
fi

# 检查用户是否已存在
if grep -q "\"email\": \"$USER_EMAIL\"" "$CONFIG_FILE"; then
  echo -e "${YELLOW}警告: 用户 $USER_EMAIL 已存在${NC}"
  exit 1
fi

echo "================================"
echo "添加 Xray 用户"
echo "================================"
echo ""

# 生成新的 UUID
NEW_UUID=$(cat /proc/sys/kernel/random/uuid)
echo "生成 UUID: $NEW_UUID"

# 备份配置文件
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/config-$(date +%Y%m%d-%H%M%S).json"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "配置文件已备份到: $BACKUP_FILE"

# 使用 Python 添加用户到配置文件
python3 << EOF
import json
import sys

try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)

    # 查找 VLESS inbound
    vless_inbound = None
    for inbound in config.get('inbounds', []):
        if inbound.get('protocol') == 'vless':
            vless_inbound = inbound
            break

    if not vless_inbound:
        print("错误: 未找到 VLESS 配置")
        sys.exit(1)

    # 添加新用户
    new_client = {
        "id": "$NEW_UUID",
        "flow": "xtls-rprx-vision",
        "email": "$USER_EMAIL"
    }

    vless_inbound['settings']['clients'].append(new_client)

    # 保存配置
    with open('$CONFIG_FILE', 'w') as f:
        json.dump(config, f, indent=2)

    print("用户添加成功")

except Exception as e:
    print(f"错误: {str(e)}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
  echo -e "${RED}添加用户失败，正在恢复配置...${NC}"
  cp "$BACKUP_FILE" "$CONFIG_FILE"
  exit 1
fi

# 重启 Xray 服务
echo "重启 Xray 服务..."
systemctl restart xray

# 等待服务启动
sleep 2

if systemctl is-active --quiet xray; then
  echo -e "${GREEN}✅ Xray 服务重启成功${NC}"
else
  echo -e "${RED}❌ Xray 服务启动失败，正在恢复配置...${NC}"
  cp "$BACKUP_FILE" "$CONFIG_FILE"
  systemctl restart xray
  exit 1
fi

# 生成分享链接
echo ""
echo "================================"
echo "✅ 用户添加成功！"
echo "================================"
echo ""
echo "📋 用户信息："
echo "邮箱: $USER_EMAIL"
echo "UUID: $NEW_UUID"
echo ""

# 获取服务器 IP 和其他配置信息
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

# 从配置文件读取 Public Key
PUBLIC_KEY=$(python3 << EOF
import json
with open('$CONFIG_FILE', 'r') as f:
    config = json.load(f)
for inbound in config.get('inbounds', []):
    if inbound.get('protocol') == 'vless':
        settings = inbound.get('streamSettings', {}).get('realitySettings', {})
        # 这里需要从私钥计算公钥，暂时从之前的输出获取
        print("请查看原始安装输出获取 Public Key")
        break
EOF
)

# 获取配置信息
PORT=$(python3 << 'PYEOF'
import json
with open('/usr/local/etc/xray/config.json', 'r') as f:
    config = json.load(f)
for inbound in config.get('inbounds', []):
    if inbound.get('protocol') == 'vless':
        print(inbound.get('port', 443))
        break
PYEOF
)

SNI=$(python3 << 'PYEOF'
import json
with open('/usr/local/etc/xray/config.json', 'r') as f:
    config = json.load(f)
for inbound in config.get('inbounds', []):
    if inbound.get('protocol') == 'vless':
        settings = inbound.get('streamSettings', {}).get('realitySettings', {})
        server_names = settings.get('serverNames', [])
        if server_names:
            print(server_names[0])
        break
PYEOF
)

SHORT_ID=$(python3 << 'PYEOF'
import json
with open('/usr/local/etc/xray/config.json', 'r') as f:
    config = json.load(f)
for inbound in config.get('inbounds', []):
    if inbound.get('protocol') == 'vless':
        settings = inbound.get('streamSettings', {}).get('realitySettings', {})
        short_ids = settings.get('shortIds', [])
        if short_ids and short_ids[0]:
            print(short_ids[0])
        break
PYEOF
)

echo "📱 客户端配置参数："
echo "地址: $SERVER_IP"
echo "端口: $PORT"
echo "UUID: $NEW_UUID"
echo "SNI: $SNI"
echo "Short ID: $SHORT_ID"
echo "Flow: xtls-rprx-vision"
echo ""
echo "提示: 你需要使用原始安装时的 Public Key"
echo ""
echo "💡 使用 show-config.sh 脚本可以查看完整配置信息"
