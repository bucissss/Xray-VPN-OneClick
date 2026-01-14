/**
 * Firewall configuration utilities
 * Feature: 009-cross-platform-support
 */

import { execSync } from 'child_process';
import { FirewallConfig, FirewallType } from '../types/platform.js';

/**
 * Detect active firewall type
 */
export function detectFirewall(): FirewallConfig {
  let type = FirewallType.NONE;
  let isActive = false;

  try {
    // Check firewalld first (RHEL default)
    const firewalldStatus = execSync('systemctl is-active firewalld 2>/dev/null', {
      encoding: 'utf-8',
    }).trim();
    if (firewalldStatus === 'active') {
      type = FirewallType.FIREWALLD;
      isActive = true;
    }
  } catch {
    // firewalld not active, check iptables
    try {
      execSync('which iptables', { encoding: 'utf-8' });
      type = FirewallType.IPTABLES;
      isActive = true;
    } catch {
      // No firewall detected
    }
  }

  return {
    type,
    isActive,
    port: 443,
    protocol: 'tcp',
  };
}

/**
 * Configure firewall to allow a port
 */
export function configureFirewallPort(
  port: number,
  protocol: 'tcp' | 'udp' | 'both' = 'tcp'
): boolean {
  const firewall = detectFirewall();

  try {
    if (firewall.type === FirewallType.FIREWALLD) {
      if (protocol === 'both') {
        execSync(`firewall-cmd --add-port=${port}/tcp --permanent`);
        execSync(`firewall-cmd --add-port=${port}/udp --permanent`);
      } else {
        execSync(`firewall-cmd --add-port=${port}/${protocol} --permanent`);
      }
      execSync('firewall-cmd --reload');
      return true;
    } else if (firewall.type === FirewallType.IPTABLES) {
      if (protocol === 'both') {
        execSync(`iptables -I INPUT -p tcp --dport ${port} -j ACCEPT`);
        execSync(`iptables -I INPUT -p udp --dport ${port} -j ACCEPT`);
      } else {
        execSync(`iptables -I INPUT -p ${protocol} --dport ${port} -j ACCEPT`);
      }
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
