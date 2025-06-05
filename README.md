# Matlab MCP Server

Node.js server implementing Model Context Protocol (MCP) for Matlab base operations.

**Usage**: `matlab-mcp [pauseTime]`

- `pauseTime` (optional): Default pause time in milliseconds for Matlab script execution (default: 1s)

## Features

- Execute Matlab code and scripts
- Generate MATLAB scripts from descriptions
- Access Matlab documentation
- Manage Matlab script files in temp directory
- Real-time execution with output

**Note**: Matlab must be installed on your system and accessible via PATH or `MATLAB_PATH` environment variable. Generated scripts are stored in the user's temp directory by default.

## API

### Resources

- `matlab://documentation/getting-started`: Getting started guide for Matlab MCP server
- `matlab://scripts/{script_name}`: Access content of saved MATLAB scripts

### Tools

- **generate_matlab_script**
  - Generate MATLAB script from natural language description
  - Inputs:
    - `scriptName` (string): Name for the script file (without .m extension, must be valid Matlab identifier)
    - `code` (string): Matlab code to execute
  - Creates and saves Matlab script file

- **execute_matlab_script**
  - Execute a Matlab script by name (script must exist in temp directory)
  - Inputs:
    - `script_name` (string): Name of the script file (without .m extension)
    - `args` (object, optional): Optional arguments to pass to the script as variables
  - Returns execution output or error messages

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "matlab": {
      "command": "npx",
      "args": [
        "-y",
        "matlab-mcp"
      ]
    }
  }
}
```

### With Custom Pause Time (s)

```json
{
  "mcpServers": {
    "matlab": {
      "command": "npx",
      "args": [
        "-y",
        "matlab-mcp",
        "10"
      ]
    }
  }
}
```

### Environment Variables

Set these environment variables as needed:

- `MATLAB_PATH`: Path to Matlab executable if not in system PATH
- `MATLAB_TEMP_DIR`: Custom directory for storing generated Matlab scripts (defaults to system temp directory)

```json
{
  "mcpServers": {
    "matlab": {
      "command": "npx",
      "args": [
        "-y",
        "matlab-mcp"
      ],
      "env": {
        "MATLAB_PATH": "/path/to/your/matlab/bin/matlab",
        "MATLAB_TEMP_DIR": "/path/to/custom/temp/directory"
      }
    }
  }
}
```

## Build

From source:

```bash
git clone https://github.com/liou666/matlab-mcp.git
cd matlab-mcp
pnpm install
pnpm build
```

## Requirements

- **Node.js**: Version >= 18.0.0
- **MATLAB**: Must be installed and accessible
- **Operating System**: Windows, macOS with Matlab support
