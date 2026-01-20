/**
 * Tests for Clash Config Generator
 * @module tests/unit/services/clash-config
 */

import { describe, it, expect } from 'vitest';
import { buildClashConfigYaml } from '../../../src/services/clash-config';
import type { VlessLinkInfo } from '../../../src/utils/vless-link';

describe('Clash Config Generator', () => {
  const baseVlessInfo: VlessLinkInfo = {
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    server: 'example.com',
    port: 443,
    name: 'Test Server',
  };

  describe('buildClashConfigYaml', () => {
    it('should generate basic VLESS config', () => {
      const result = buildClashConfigYaml(baseVlessInfo);

      expect(result.yaml).toContain('type: vless');
      expect(result.yaml).toContain('server: "example.com"');
      expect(result.yaml).toContain('port: 443');
      expect(result.yaml).toContain('uuid: "550e8400-e29b-41d4-a716-446655440000"');
      expect(result.yaml).toContain('udp: true');
      expect(result.proxyName).toBe('Test Server');
      expect(result.proxyGroupName).toBe('PROXY');
    });

    it('should use custom proxy name and group name', () => {
      const result = buildClashConfigYaml(baseVlessInfo, {
        proxyName: 'Custom Proxy',
        proxyGroupName: 'Custom Group',
      });

      expect(result.yaml).toContain('name: "Custom Proxy"');
      expect(result.yaml).toContain('name: "Custom Group"');
      expect(result.proxyName).toBe('Custom Proxy');
      expect(result.proxyGroupName).toBe('Custom Group');
    });

    it('should use server:port as default proxy name if name not provided', () => {
      const infoWithoutName = { ...baseVlessInfo, name: undefined };
      const result = buildClashConfigYaml(infoWithoutName);

      expect(result.proxyName).toBe('example.com:443');
      expect(result.yaml).toContain('name: "example.com:443"');
    });

    it('should include flow parameter if provided', () => {
      const infoWithFlow = { ...baseVlessInfo, flow: 'xtls-rprx-vision' };
      const result = buildClashConfigYaml(infoWithFlow);

      expect(result.yaml).toContain('flow: "xtls-rprx-vision"');
    });

    it('should configure TLS when security is tls', () => {
      const infoWithTls = {
        ...baseVlessInfo,
        security: 'tls',
        sni: 'example.com',
      };
      const result = buildClashConfigYaml(infoWithTls);

      expect(result.yaml).toContain('tls: true');
      expect(result.yaml).toContain('servername: "example.com"');
    });

    it('should configure Reality when security is reality', () => {
      const infoWithReality = {
        ...baseVlessInfo,
        security: 'reality',
        sni: 'example.com',
        pbk: 'public-key-value',
        sid: 'short-id',
        spx: '/spider-path',
      };
      const result = buildClashConfigYaml(infoWithReality);

      expect(result.yaml).toContain('tls: true');
      expect(result.yaml).toContain('reality-opts:');
      expect(result.yaml).toContain('public-key: "public-key-value"');
      expect(result.yaml).toContain('short-id: "short-id"');
      expect(result.yaml).toContain('spider-x: "/spider-path"');
    });

    it('should throw error if Reality config missing pbk', () => {
      const infoWithoutPbk = {
        ...baseVlessInfo,
        security: 'reality',
        sni: 'example.com',
      };

      expect(() => buildClashConfigYaml(infoWithoutPbk)).toThrow('Reality 链接缺少 pbk 参数');
    });

    it('should include client fingerprint if provided', () => {
      const infoWithFp = { ...baseVlessInfo, fp: 'chrome' };
      const result = buildClashConfigYaml(infoWithFp);

      expect(result.yaml).toContain('client-fingerprint: "chrome"');
    });

    it('should parse and include ALPN list', () => {
      const infoWithAlpn = { ...baseVlessInfo, alpn: 'h2,http/1.1' };
      const result = buildClashConfigYaml(infoWithAlpn);

      expect(result.yaml).toContain('alpn:');
      expect(result.yaml).toContain('- "h2"');
      expect(result.yaml).toContain('- "http/1.1"');
    });

    it('should handle ALPN with spaces', () => {
      const infoWithAlpn = { ...baseVlessInfo, alpn: 'h2 , http/1.1 , h3' };
      const result = buildClashConfigYaml(infoWithAlpn);

      expect(result.yaml).toContain('- "h2"');
      expect(result.yaml).toContain('- "http/1.1"');
      expect(result.yaml).toContain('- "h3"');
    });

    it('should configure WebSocket transport', () => {
      const infoWithWs = {
        ...baseVlessInfo,
        type: 'ws',
        path: '/websocket',
        host: 'ws.example.com',
      };
      const result = buildClashConfigYaml(infoWithWs);

      expect(result.yaml).toContain('network: "ws"');
      expect(result.yaml).toContain('ws-opts:');
      expect(result.yaml).toContain('path: "/websocket"');
      expect(result.yaml).toContain('headers:');
      expect(result.yaml).toContain('Host: "ws.example.com"');
    });

    it('should configure gRPC transport with serviceName', () => {
      const infoWithGrpc = {
        ...baseVlessInfo,
        type: 'grpc',
        serviceName: 'GunService',
      };
      const result = buildClashConfigYaml(infoWithGrpc);

      expect(result.yaml).toContain('network: "grpc"');
      expect(result.yaml).toContain('grpc-opts:');
      expect(result.yaml).toContain('grpc-service-name: "GunService"');
    });

    it('should use path as serviceName fallback for gRPC', () => {
      const infoWithGrpc = {
        ...baseVlessInfo,
        type: 'grpc',
        path: '/grpc-path',
      };
      const result = buildClashConfigYaml(infoWithGrpc);

      expect(result.yaml).toContain('grpc-service-name: "/grpc-path"');
    });

    it('should default to tcp network if type not specified', () => {
      const result = buildClashConfigYaml(baseVlessInfo);

      expect(result.yaml).toContain('network: "tcp"');
    });

    it('should handle case-insensitive network type', () => {
      const infoWithUpperCase = { ...baseVlessInfo, type: 'WS' };
      const result = buildClashConfigYaml(infoWithUpperCase);

      expect(result.yaml).toContain('network: "ws"');
    });

    it('should handle case-insensitive security type', () => {
      const infoWithUpperCase = {
        ...baseVlessInfo,
        security: 'TLS',
        sni: 'example.com',
      };
      const result = buildClashConfigYaml(infoWithUpperCase);

      expect(result.yaml).toContain('tls: true');
    });

    it('should include standard Clash config sections', () => {
      const result = buildClashConfigYaml(baseVlessInfo);

      expect(result.yaml).toContain('port: 7890');
      expect(result.yaml).toContain('socks-port: 7891');
      expect(result.yaml).toContain('allow-lan: true');
      expect(result.yaml).toContain('mode: rule');
      expect(result.yaml).toContain('log-level: info');
    });

    it('should include proxy groups section', () => {
      const result = buildClashConfigYaml(baseVlessInfo);

      expect(result.yaml).toContain('proxy-groups:');
      expect(result.yaml).toContain('type: select');
      expect(result.yaml).toContain('- DIRECT');
    });

    it('should include rules section', () => {
      const result = buildClashConfigYaml(baseVlessInfo);

      expect(result.yaml).toContain('rules:');
      expect(result.yaml).toContain('- MATCH,PROXY');
    });

    it('should properly escape special characters in YAML strings', () => {
      const infoWithSpecialChars = {
        ...baseVlessInfo,
        name: 'Test "Server" with\\backslash',
      };
      const result = buildClashConfigYaml(infoWithSpecialChars);

      expect(result.yaml).toContain('name: "Test \\"Server\\" with\\\\backslash"');
    });

    it('should generate valid YAML structure', () => {
      const result = buildClashConfigYaml(baseVlessInfo);

      // Check that YAML has proper structure
      expect(result.yaml).toMatch(/^port: \d+/);
      expect(result.yaml).toMatch(/proxies:\n {2}- name:/);
      expect(result.yaml).toMatch(/proxy-groups:\n {2}- name:/);
      expect(result.yaml).toMatch(/rules:\n {2}- MATCH,/);
      expect(result.yaml.endsWith('\n')).toBe(true);
    });

    it('should handle complete Reality + WebSocket config', () => {
      const complexInfo: VlessLinkInfo = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        server: 'example.com',
        port: 443,
        name: 'Complex Server',
        type: 'ws',
        security: 'reality',
        sni: 'www.example.com',
        pbk: 'public-key',
        sid: 'short-id',
        spx: '/spider',
        fp: 'chrome',
        alpn: 'h2,http/1.1',
        path: '/websocket',
        host: 'ws.example.com',
        flow: 'xtls-rprx-vision',
      };

      const result = buildClashConfigYaml(complexInfo);

      expect(result.yaml).toContain('type: vless');
      expect(result.yaml).toContain('network: "ws"');
      expect(result.yaml).toContain('tls: true');
      expect(result.yaml).toContain('reality-opts:');
      expect(result.yaml).toContain('ws-opts:');
      expect(result.yaml).toContain('alpn:');
      expect(result.yaml).toContain('flow: "xtls-rprx-vision"');
      expect(result.yaml).toContain('client-fingerprint: "chrome"');
    });

    it('should not include optional fields when not provided', () => {
      const minimalInfo: VlessLinkInfo = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        server: 'example.com',
        port: 443,
      };

      const result = buildClashConfigYaml(minimalInfo);

      expect(result.yaml).not.toContain('flow:');
      expect(result.yaml).not.toContain('servername:');
      expect(result.yaml).not.toContain('reality-opts:');
      expect(result.yaml).not.toContain('client-fingerprint:');
      expect(result.yaml).not.toContain('alpn:');
      expect(result.yaml).not.toContain('ws-opts:');
      expect(result.yaml).not.toContain('grpc-opts:');
    });
  });
});
