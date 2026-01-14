#!/bin/bash
# detect-env.sh - Environment detection functions
# Feature: 009-cross-platform-support

# Global variables set by detection functions
ENV_SHELL=""
ENV_SHELL_COMPATIBLE=false
ENV_CONTAINER_TYPE=""
ENV_IS_CONTAINER=false
ENV_SELINUX_STATUS=""
ENV_HAS_SYSTEMD=false
ENV_VIRTUALIZATION=""

# Detect current shell type
detect_shell() {
    ENV_SHELL=""
    ENV_SHELL_COMPATIBLE=false

    # Check the actual shell executable
    if [[ -e /proc/$$/exe ]]; then
        local shell_exe
        shell_exe=$(readlink /proc/$$/exe 2>/dev/null)

        if echo "$shell_exe" | grep -q "bash"; then
            ENV_SHELL="bash"
            ENV_SHELL_COMPATIBLE=true
        elif echo "$shell_exe" | grep -q "dash"; then
            ENV_SHELL="dash"
            ENV_SHELL_COMPATIBLE=false
        elif echo "$shell_exe" | grep -q "zsh"; then
            ENV_SHELL="zsh"
            ENV_SHELL_COMPATIBLE=true
        elif echo "$shell_exe" | grep -q "sh"; then
            ENV_SHELL="sh"
            ENV_SHELL_COMPATIBLE=false
        fi
    fi

    # Fallback to $SHELL variable
    if [[ -z "$ENV_SHELL" ]]; then
        ENV_SHELL=$(basename "$SHELL" 2>/dev/null || echo "unknown")
        [[ "$ENV_SHELL" == "bash" || "$ENV_SHELL" == "zsh" ]] && ENV_SHELL_COMPATIBLE=true
    fi
}

# Detect container environment
detect_container() {
    ENV_CONTAINER_TYPE=""
    ENV_IS_CONTAINER=false

    # Docker detection
    if [[ -f /.dockerenv ]]; then
        ENV_CONTAINER_TYPE="docker"
        ENV_IS_CONTAINER=true
        return
    fi

    # Check cgroup for container hints
    if [[ -f /proc/1/cgroup ]]; then
        if grep -q docker /proc/1/cgroup 2>/dev/null; then
            ENV_CONTAINER_TYPE="docker"
            ENV_IS_CONTAINER=true
            return
        elif grep -q lxc /proc/1/cgroup 2>/dev/null; then
            ENV_CONTAINER_TYPE="lxc"
            ENV_IS_CONTAINER=true
            return
        fi
    fi

    # OpenVZ detection
    if [[ -d /proc/vz ]] && [[ ! -d /proc/bc ]]; then
        ENV_CONTAINER_TYPE="openvz"
        ENV_IS_CONTAINER=true
        return
    fi

    # systemd-detect-virt if available
    if command -v systemd-detect-virt &>/dev/null; then
        local virt
        virt=$(systemd-detect-virt --container 2>/dev/null)
        if [[ "$virt" != "none" && -n "$virt" ]]; then
            ENV_CONTAINER_TYPE="$virt"
            ENV_IS_CONTAINER=true
            return
        fi
    fi

    ENV_CONTAINER_TYPE="none"
}

# Detect SELinux status
detect_selinux() {
    ENV_SELINUX_STATUS="disabled"

    if command -v sestatus &>/dev/null; then
        local status
        status=$(sestatus 2>/dev/null | grep "SELinux status" | awk '{print $3}')

        if [[ "$status" == "enabled" ]]; then
            local mode
            mode=$(sestatus 2>/dev/null | grep "Current mode" | awk '{print $3}')
            ENV_SELINUX_STATUS="${mode:-enforcing}"
        fi
    elif command -v getenforce &>/dev/null; then
        local mode
        mode=$(getenforce 2>/dev/null)
        case "$mode" in
            Enforcing)  ENV_SELINUX_STATUS="enforcing" ;;
            Permissive) ENV_SELINUX_STATUS="permissive" ;;
            Disabled)   ENV_SELINUX_STATUS="disabled" ;;
        esac
    fi
}

# Detect systemd availability
detect_systemd() {
    ENV_HAS_SYSTEMD=false

    if [[ -d /run/systemd/system ]] || command -v systemctl &>/dev/null; then
        if systemctl --version &>/dev/null; then
            ENV_HAS_SYSTEMD=true
        fi
    fi
}

# Detect virtualization type
detect_virtualization() {
    ENV_VIRTUALIZATION=""

    if command -v systemd-detect-virt &>/dev/null; then
        ENV_VIRTUALIZATION=$(systemd-detect-virt 2>/dev/null || echo "none")
    elif [[ -f /sys/hypervisor/type ]]; then
        ENV_VIRTUALIZATION=$(cat /sys/hypervisor/type 2>/dev/null)
    elif grep -q "hypervisor" /proc/cpuinfo 2>/dev/null; then
        ENV_VIRTUALIZATION="unknown-hypervisor"
    else
        ENV_VIRTUALIZATION="none"
    fi
}

# Run all environment detection
detect_all_env() {
    detect_shell
    detect_container
    detect_selinux
    detect_systemd
    detect_virtualization
}

# Print environment summary
print_env_summary() {
    echo "=== Environment Summary ==="
    echo "Shell: $ENV_SHELL (compatible: $ENV_SHELL_COMPATIBLE)"
    echo "Container: $ENV_CONTAINER_TYPE (is_container: $ENV_IS_CONTAINER)"
    echo "SELinux: $ENV_SELINUX_STATUS"
    echo "Systemd: $ENV_HAS_SYSTEMD"
    echo "Virtualization: $ENV_VIRTUALIZATION"
    echo "==========================="
}
