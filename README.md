# MATLAB MCP Server

Node.js server implementing Model Context Protocol (MCP) for MATLAB operations.

**Usage**: `matlab-mcp [pauseTime]`

- `pauseTime` (optional): Default pause time in milliseconds for MATLAB script execution (default: 1s)

## Features

- Execute MATLAB code and scripts
- Generate MATLAB scripts from descriptions
- Access MATLAB documentation
- Manage MATLAB script files in temp directory
- Real-time execution with output

**Note**: MATLAB must be installed on your system and accessible via PATH or `MATLAB_PATH` environment variable. Generated scripts are stored in the user's temp directory by default.

## API

### Resources

- `matlab://documentation/getting-started`: Getting started guide for MATLAB MCP server
- `matlab://scripts/{script_name}`: Access content of saved MATLAB scripts

### Tools

- **generate_matlab_script**
  - Generate MATLAB script from natural language description
  - Inputs:
    - `scriptName` (string): Name for the script file (without .m extension, must be valid MATLAB identifier)
    - `code` (string): MATLAB code to execute
  - Creates and saves MATLAB script file

- **execute_matlab_script**
  - Execute a MATLAB script by name (script must exist in temp directory)
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

- `MATLAB_PATH`: Path to MATLAB executable if not in system PATH
- `MATLAB_TEMP_DIR`: Custom directory for storing generated MATLAB scripts (defaults to system temp directory)

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
git clone <repository-url>
cd matlab-mcp
npm install
npm run build
```

## Requirements

- **Node.js**: Version >= 18.0.0
- **MATLAB**: Must be installed and accessible
- **Operating System**: Windows, macOS with MATLAB support
