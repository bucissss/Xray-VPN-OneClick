#!/bin/bash

# Xray 一键安装脚本
# 适用于 Debian/Ubuntu/Kali Linux

set -e

echo "================================"
echo "Xray VLESS+Reality 一键安装脚本"
echo "================================"
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
  echo "请使用 root 权限运行此脚本"
  echo "使用命令: sudo bash $0"
  exit 1
fi

# 安装 Xray
echo "[1/4] 安装 Xray-core..."
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# 生成配置参数
echo ""
echo "[2/4] 生成配置参数..."
UUID=$(cat /proc/sys/kernel/random/uuid)
KEYS=$(/usr/local/bin/xray x25519)
PRIVATE_KEY=$(echo "$KEYS" | grep "Private key" | awk '{print $3}')
PUBLIC_KEY=$(echo "$KEYS" | grep "Public key" | awk '{print $3}')
SHORT_ID=$(openssl rand -hex 8)

echo "UUID: $UUID"
echo "Private Key: $PRIVATE_KEY"
echo "Public Key: $PUBLIC_KEY"
echo "Short ID: $SHORT_ID"

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me)
echo "服务器 IP: $SERVER_IP"

# 创建配置文件
echo ""
echo "[3/4] 创建配置文件..."
cat > /usr/local/etc/xray/config.json <<EOF
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "tag": "vless_tls",
      "settings": {
        "clients": [
          {
            "id": "$UUID",
            "flow": "xtls-rprx-vision",
            "email": "user@example.com"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "www.microsoft.com:443",
          "xver": 0,
          "serverNames": [
            "www.microsoft.com"
          ],
          "privateKey": "$PRIVATE_KEY",
          "shortIds": [
            "$SHORT_ID",
            ""
          ]
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": [
          "http",
          "tls"
        ]
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "tag": "block"
    }
  ],
  "routing": {
    "domainStrategy": "AsIs",
    "rules": [
      {
        "type": "field",
        "ip": [
          "geoip:private"
        ],
        "outboundTag": "block"
      }
    ]
  }
}
EOF

# 修改服务用户为 root
sed -i 's/User=nobody/User=root/' /etc/systemd/system/xray.service

# 启动服务
echo ""
echo "[4/4] 启动 Xray 服务..."
systemctl daemon-reload
systemctl enable xray
systemctl restart xray

# 等待服务启动
sleep 2

# 检查服务状态
if systemctl is-active --quiet xray; then
  echo ""
  echo "================================"
  echo "✅ Xray 安装成功！"
  echo "================================"
  echo ""
  echo "📋 服务器信息："
  echo "地址: $SERVER_IP"
  echo "端口: 443"
  echo ""
  echo "🔑 客户端配置："
  echo "UUID: $UUID"
  echo "Public Key: $PUBLIC_KEY"
  echo "Short ID: $SHORT_ID"
  echo "SNI: www.microsoft.com"
  echo "Flow: xtls-rprx-vision"
  echo ""
  echo "📱 分享链接："
  SHARE_LINK="vless://${UUID}@${SERVER_IP}:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=www.microsoft.com&fp=chrome&pbk=${PUBLIC_KEY}&sid=${SHORT_ID}&type=tcp&headerType=none#Xray-Reality"
  echo "$SHARE_LINK"
  echo ""
  echo "配置信息已保存到: /root/xray-info.txt"

  # 保存配置信息
  cat > /root/xray-info.txt <<INFO
Xray 配置信息
生成时间: $(date)

服务器信息:
- 地址: $SERVER_IP
- 端口: 443
- 协议: VLESS + XTLS-Reality

客户端配置:
- UUID: $UUID
- Public Key: $PUBLIC_KEY
- Short ID: $SHORT_ID
- SNI: www.microsoft.com
- Flow: xtls-rprx-vision
- Fingerprint: chrome

分享链接:
$SHARE_LINK

服务管理命令:
- 启动: systemctl start xray
- 停止: systemctl stop xray
- 重启: systemctl restart xray
- 状态: systemctl status xray
- 日志: journalctl -u xray -f
INFO

else
  echo ""
  echo "❌ Xray 启动失败，请检查日志："
  echo "journalctl -u xray -n 50"
  exit 1
fi
