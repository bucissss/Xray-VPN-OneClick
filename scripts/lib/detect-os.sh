#!/bin/bash
# detect-os.sh - Operating system detection functions
# Feature: 009-cross-platform-support

# Ensure PATH includes sbin directories
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# Supported distributions and minimum versions
declare -A SUPPORTED_DISTROS=(
    ["ubuntu"]="22.04"
    ["debian"]="11"
    ["kali"]="2023"
    ["centos"]="9"
    ["almalinux"]="9"
    ["rocky"]="9"
    ["fedora"]="39"
)

# OS family mapping
declare -A OS_FAMILY=(
    ["ubuntu"]="debian"
    ["debian"]="debian"
    ["kali"]="debian"
    ["centos"]="rhel"
    ["almalinux"]="rhel"
    ["rocky"]="rhel"
    ["fedora"]="rhel"
)

# Package manager mapping
declare -A PKG_MANAGER=(
    ["debian"]="apt"
    ["rhel"]="dnf"
)

# Global variables set by detect_os
OS_ID=""
OS_VERSION=""
OS_VERSION_ID=""
OS_FAMILY_TYPE=""
OS_PKG_MANAGER=""
OS_PRETTY_NAME=""

# Detect operating system from /etc/os-release
detect_os() {
    OS_ID=""
    OS_VERSION=""
    OS_VERSION_ID=""
    OS_FAMILY_TYPE=""
    OS_PKG_MANAGER=""
    OS_PRETTY_NAME=""

    if [[ -e /etc/os-release ]]; then
        source /etc/os-release
        OS_ID="${ID,,}"  # lowercase
        OS_VERSION="$VERSION"
        OS_VERSION_ID="$VERSION_ID"
        OS_PRETTY_NAME="$PRETTY_NAME"
    elif [[ -e /etc/almalinux-release ]]; then
        OS_ID="almalinux"
        OS_VERSION_ID=$(grep -oE '[0-9]+\.[0-9]+' /etc/almalinux-release | head -1)
    elif [[ -e /etc/rocky-release ]]; then
        OS_ID="rocky"
        OS_VERSION_ID=$(grep -oE '[0-9]+\.[0-9]+' /etc/rocky-release | head -1)
    elif [[ -e /etc/centos-release ]]; then
        OS_ID="centos"
        OS_VERSION_ID=$(grep -oE '[0-9]+' /etc/centos-release | head -1)
    elif [[ -e /etc/fedora-release ]]; then
        OS_ID="fedora"
        OS_VERSION_ID=$(grep -oE '[0-9]+' /etc/fedora-release | head -1)
    elif [[ -e /etc/debian_version ]]; then
        OS_ID="debian"
        OS_VERSION_ID=$(cat /etc/debian_version)
    fi

    # Set OS family and package manager
    if [[ -n "${OS_FAMILY[$OS_ID]}" ]]; then
        OS_FAMILY_TYPE="${OS_FAMILY[$OS_ID]}"
        OS_PKG_MANAGER="${PKG_MANAGER[$OS_FAMILY_TYPE]}"
    fi

    # Return success if OS was detected
    [[ -n "$OS_ID" ]]
}

# Check if the detected OS is supported
is_os_supported() {
    [[ -n "${SUPPORTED_DISTROS[$OS_ID]}" ]]
}

# Get minimum supported version for current OS
get_min_version() {
    echo "${SUPPORTED_DISTROS[$OS_ID]:-}"
}

# Get list of supported distributions
get_supported_distros() {
    echo "${!SUPPORTED_DISTROS[@]}"
}

# Compare version numbers (returns 0 if v1 >= v2)
version_ge() {
    local v1="$1" v2="$2"
    # Handle versions like "22.04" and "9"
    printf '%s\n%s' "$v1" "$v2" | sort -V -C
    [[ $? -eq 0 ]] && return 0
    # Alternative: direct comparison
    [[ "$(printf '%s\n%s' "$v1" "$v2" | sort -V | head -n1)" == "$v2" ]]
}

# Check if current OS version meets minimum requirement
check_version_requirement() {
    local min_version
    min_version=$(get_min_version)
    [[ -z "$min_version" ]] && return 1
    version_ge "$OS_VERSION_ID" "$min_version"
}

# Print error for unsupported OS
print_unsupported_os_error() {
    echo ""
    echo "错误: 不支持的操作系统"
    echo "========================================"
    echo "检测到: ${OS_PRETTY_NAME:-$OS_ID $OS_VERSION_ID}"
    echo ""
    echo "支持的系统:"
    echo "  - Ubuntu 22.04+"
    echo "  - Debian 11+"
    echo "  - Kali Linux 2023+"
    echo "  - CentOS Stream 9+"
    echo "  - AlmaLinux 9+"
    echo "  - Rocky Linux 9+"
    echo "  - Fedora 39+"
    echo "========================================"
    echo ""
}

# Print error for version too low
print_version_too_low_error() {
    local min_version
    min_version=$(get_min_version)
    echo ""
    echo "错误: 系统版本过低"
    echo "========================================"
    echo "检测到: ${OS_PRETTY_NAME:-$OS_ID $OS_VERSION_ID}"
    echo "最低要求: $OS_ID $min_version+"
    echo ""
    echo "请升级您的系统后重试。"
    echo "========================================"
    echo ""
}
