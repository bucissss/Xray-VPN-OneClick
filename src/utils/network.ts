/**
 * Network detection utilities
 * Feature: 009-cross-platform-support
 */

import { execSync } from 'child_process';
import { NetworkConfig, NetworkInterface } from '../types/platform.js';
import { PRIVATE_IP_RANGES } from '../constants/supported-distros.js';

/**
 * Check if an IP address is private (NAT)
 */
export function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((regex) => regex.test(ip));
}

/**
 * Get all network interfaces with IPv4 addresses
 */
export function getNetworkInterfaces(): NetworkInterface[] {
  const interfaces: NetworkInterface[] = [];

  try {
    const output = execSync('ip -4 addr show', { encoding: 'utf-8' });
    const lines = output.split('\n');

    let currentInterface: Partial<NetworkInterface> = {};

    for (const line of lines) {
      // Match interface line: "2: eth0: <BROADCAST..."
      const ifaceMatch = line.match(/^\d+:\s+(\S+):/);
      if (ifaceMatch) {
        if (currentInterface.name) {
          interfaces.push(currentInterface as NetworkInterface);
        }
        currentInterface = {
          name: ifaceMatch[1],
          isLoopback: ifaceMatch[1] === 'lo',
        };
      }

      // Match inet line: "    inet 192.168.1.100/24..."
      const inetMatch = line.match(/^\s+inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (inetMatch && currentInterface.name) {
        currentInterface.ipv4 = inetMatch[1];
      }
    }

    // Add last interface
    if (currentInterface.name) {
      interfaces.push(currentInterface as NetworkInterface);
    }
  } catch {
    // Failed to get interfaces
  }

  return interfaces.filter((iface) => !iface.isLoopback && iface.ipv4);
}

/**
 * Detect network configuration
 */
export function detectNetwork(): NetworkConfig {
  const interfaces = getNetworkInterfaces();
  const firstIp = interfaces[0]?.ipv4 || '';

  return {
    interfaces,
    selectedIp: firstIp,
    isNat: isPrivateIp(firstIp),
  };
}
