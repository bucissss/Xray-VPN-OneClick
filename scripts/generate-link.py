#!/usr/bin/env python3
"""
Xray VLESS 分享链接生成工具
"""

import urllib.parse
import sys

def generate_vless_link(uuid, server, port, public_key, short_id, sni="www.microsoft.com", remark="Xray-Reality"):
    """生成 VLESS 分享链接"""

    # URL encode public key
    pbk_encoded = urllib.parse.quote(public_key, safe='')

    # 生成 VLESS 链接
    vless_link = (
        f"vless://{uuid}@{server}:{port}"
        f"?encryption=none"
        f"&flow=xtls-rprx-vision"
        f"&security=reality"
        f"&sni={sni}"
        f"&fp=chrome"
        f"&pbk={pbk_encoded}"
        f"&sid={short_id}"
        f"&type=tcp"
        f"&headerType=none"
        f"#{remark}"
    )

    return vless_link

def main():
    print("=" * 50)
    print("Xray VLESS 分享链接生成工具")
    print("=" * 50)
    print()

    if len(sys.argv) == 6:
        # 从命令行参数读取
        uuid = sys.argv[1]
        server = sys.argv[2]
        port = sys.argv[3]
        public_key = sys.argv[4]
        short_id = sys.argv[5]
    else:
        # 交互式输入
        print("请输入配置信息：")
        uuid = input("UUID: ").strip()
        server = input("服务器地址: ").strip()
        port = input("端口 (默认443): ").strip() or "443"
        public_key = input("Public Key: ").strip()
        short_id = input("Short ID: ").strip()
        sni = input("SNI (默认www.microsoft.com): ").strip() or "www.microsoft.com"
        remark = input("备注 (默认Xray-Reality): ").strip() or "Xray-Reality"

    # 生成链接
    if len(sys.argv) == 6:
        link = generate_vless_link(uuid, server, port, public_key, short_id)
    else:
        link = generate_vless_link(uuid, server, port, public_key, short_id, sni, remark)

    print()
    print("=" * 50)
    print("分享链接：")
    print("=" * 50)
    print(link)
    print()
    print("提示：复制此链接并在客户端中导入即可使用")

if __name__ == "__main__":
    main()
