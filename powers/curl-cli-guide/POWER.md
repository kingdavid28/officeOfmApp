---
name: "curl-cli-guide"
displayName: "cURL CLI Guide"
description: "Complete guide for using cURL command-line tool for HTTP requests, file transfers, and API testing with common examples and troubleshooting."
keywords: ["curl", "http", "api", "cli", "requests", "download"]
author: "Kiro Demo"
---

# cURL CLI Guide

## Overview

cURL is a powerful command-line tool for transferring data with URLs. It supports numerous protocols including HTTP, HTTPS, FTP, and more. This guide covers installation, common usage patterns, and troubleshooting for everyday HTTP requests and API interactions.

Whether you're testing APIs, downloading files, or debugging web services, cURL provides a reliable and flexible solution for data transfer operations from the command line.

## Onboarding

### Installation

#### Via Package Manager (Recommended)

**macOS (Homebrew):**
```bash
brew install curl
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install curl
```

**Windows (Chocolatey):**
```bash
choco install curl
```

**Windows (Built-in):**
Windows 10+ includes curl by default.

### Prerequisites
- No special prerequisites required
- Works on macOS, Linux, and Windows
- Basic command-line knowledge helpful

### Verification
```bash
# Verify installation
curl --version

# Expected output:
curl 7.x.x (platform) libcurl/7.x.x ...
```

## Common Workflows

### Workflow: Basic HTTP Requests

**Goal:** Make simple HTTP requests to APIs or websites

**Commands:**
```bash
# GET request
curl https://api.example.com/users

# GET with headers
curl -H "Accept: application/json" https://api.example.com/users

# POST request with data
curl -X POST -H "Content-Type: application/json" \
     -d '{"name":"John","email":"john@example.com"}' \
     https://api.example.com/users
```

**Complete Example:**
```bash
# Test a REST API
curl -X GET \
     -H "Authorization: Bearer your-token" \
     -H "Accept: application/json" \
     https://jsonplaceholder.typicode.com/posts/1
```

### Workflow: File Downloads

**Goal:** Download files from URLs

**Commands:**
```bash
# Download file (keeps original name)
curl -O https://example.com/file.zip

# Download with custom name
curl -o myfile.zip https://example.com/file.zip

# Download with progress bar
curl -# -O https://example.com/largefile.zip
```

**Complete Example:**
```bash
# Download a file with progress and resume capability
curl -C - -# -O https://releases.ubuntu.com/20.04/ubuntu-20.04.6-desktop-amd64.iso
```

### Workflow: API Testing

**Goal:** Test REST APIs with different HTTP methods

**Commands:**
```bash
# GET request
curl -X GET https://api.example.com/users

# POST request
curl -X POST -H "Content-Type: application/json" \
     -d '{"key":"value"}' https://api.example.com/users

# PUT request
curl -X PUT -H "Content-Type: application/json" \
     -d '{"id":1,"key":"updated"}' https://api.example.com/users/1

# DELETE request
curl -X DELETE https://api.example.com/users/1
```

## Command Reference

### Basic Syntax
```bash
curl [options] [URL]
```

### Common Options
| Flag | Description | Example |
|------|-------------|---------|
| `-X` | HTTP method | `-X POST` |
| `-H` | Add header | `-H "Content-Type: application/json"` |
| `-d` | Send data | `-d '{"key":"value"}'` |
| `-o` | Output to file | `-o output.txt` |
| `-O` | Save with original filename | `-O` |
| `-v` | Verbose output | `-v` |
| `-s` | Silent mode | `-s` |
| `-i` | Include headers in output | `-i` |
| `-L` | Follow redirects | `-L` |

### Authentication Options
| Flag | Description | Example |
|------|-------------|---------|
| `-u` | Basic auth | `-u username:password` |
| `-H` | Bearer token | `-H "Authorization: Bearer token"` |
| `-k` | Ignore SSL errors | `-k` |

## Troubleshooting

### Error: "curl: command not found"
**Cause:** cURL is not installed or not in PATH
**Solution:**
1. Install cURL using your package manager (see Installation section)
2. Verify installation: `which curl`
3. Restart terminal after installation

### Error: "SSL certificate problem"
**Cause:** SSL certificate verification failed
**Solution:**
1. **Recommended:** Fix the certificate issue on the server
2. **For testing only:** Use `-k` flag to ignore SSL errors:
   ```bash
   curl -k https://example.com
   ```
3. Update CA certificates:
   ```bash
   # macOS
   brew install ca-certificates
   
   # Ubuntu
   sudo apt-get update && sudo apt-get install ca-certificates
   ```

### Error: "Connection refused" or "Connection timeout"
**Cause:** Server is not responding or URL is incorrect
**Solution:**
1. Verify the URL is correct
2. Check if the server is running
3. Test with a simple request:
   ```bash
   curl -v https://httpbin.org/get
   ```
4. Check network connectivity

### Error: "HTTP 401 Unauthorized"
**Cause:** Authentication required or credentials invalid
**Solution:**
1. Add authentication headers:
   ```bash
   curl -H "Authorization: Bearer your-token" https://api.example.com
   ```
2. Use basic auth:
   ```bash
   curl -u username:password https://api.example.com
   ```
3. Verify credentials are correct

## Best Practices

- **Use verbose mode (-v) for debugging** - Shows request/response headers and connection details
- **Always specify Content-Type** when sending data with POST/PUT requests
- **Use proper authentication** - Avoid hardcoding credentials in scripts
- **Handle redirects with -L** - Many APIs redirect HTTP to HTTPS
- **Save responses to files** for large responses or when processing data
- **Use environment variables** for sensitive data like API keys
- **Test with simple requests first** before complex API calls

## Additional Resources

- Official Documentation: https://curl.se/docs/
- Manual Page: `man curl`
- HTTP Status Codes: https://httpstatuses.com/
- JSON Testing API: https://jsonplaceholder.typicode.com/

---

**CLI Tool:** `curl`
**Installation:** Available via package managers or built-in on modern systems