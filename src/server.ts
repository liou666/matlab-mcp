import * as fs from 'fs'
import * as path from 'path'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import MatlabHandler from './handler'

/**
 * Main MCP Server class
 */
class MatlabMcpServer {
  private server: Server
  private matlabHandler: MatlabHandler
  private matlabAvailable: boolean = false

  constructor() {
    this.server = new Server(
      {
        name: 'matlab-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      },
    )

    this.matlabHandler = new MatlabHandler()

    // Setup request handlers
    this.setupResourceHandlers()
    this.setupToolHandlers()

    // Error handling
    this.server.onerror = error => console.error('[MCP Error]', error)
    process.on('SIGINT', async () => {
      await this.server.close()
      process.exit(0)
    })
  }

  /**
   * Setup resource handlers
   */
  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [
        {
          uri: `matlab://documentation/getting-started`,
          name: `MATLAB Getting Started Guide`,
          mimeType: 'text/markdown',
          description: 'Basic guide for getting started with MATLAB through the MCP server',
        },
      ]

      // Add script resources
      try {
        const scriptsDir = this.matlabHandler.getTempDir()
        if (fs.existsSync(scriptsDir)) {
          const files = fs.readdirSync(scriptsDir)
          const mFiles = files.filter(file => file.endsWith('.m'))

          for (const file of mFiles) {
            const scriptName = path.basename(file, '.m')
            resources.push({
              uri: `matlab://scripts/${scriptName}`,
              name: `MATLAB Script: ${scriptName}`,
              mimeType: 'text/x-matlab',
              description: `Content of MATLAB script ${scriptName}.m`,
            })
          }
        }
      }
      catch (error) {
        console.error('Error listing MATLAB scripts:', error)
      }

      return { resources }
    })

    // Read resource content
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        // Check for script resource first
        const scriptMatch = request.params.uri.match(
          /^matlab:\/\/scripts\/(.+)$/,
        )

        if (scriptMatch) {
          const scriptName = scriptMatch[1]
          const scriptPath = path.join(this.matlabHandler.getTempDir(), `${scriptName}.m`)

          try {
            if (!fs.existsSync(scriptPath)) {
              throw new McpError(
                ErrorCode.InvalidRequest,
                `Script ${scriptName}.m not found`,
              )
            }

            const content = fs.readFileSync(scriptPath, 'utf8')

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: 'text/x-matlab',
                  text: content,
                },
              ],
            }
          }
          catch (error) {
            if (error instanceof McpError)
              throw error

            throw new McpError(
              ErrorCode.InternalError,
              `Error reading script ${scriptName}: ${error instanceof Error ? error.message : String(error)}`,
            )
          }
        }

        // Check for documentation resource
        const docMatch = request.params.uri.match(
          /^matlab:\/\/documentation\/(.+)$/,
        )

        if (!docMatch) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Invalid URI format: ${request.params.uri}`,
          )
        }

        const docType = docMatch[1]

        if (docType === 'getting-started') {
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'text/markdown',
                text: `# MATLAB MCP Server - Getting Started

This MCP server allows you to interact with MATLAB directly from your AI assistant.

## Available Tools

1. **generate_matlab_script** - Generate MATLAB script from a natural language description
2. **execute_matlab_script** - Execute a MATLAB script by name with optional arguments

## Available Resources

1. **matlab://documentation/getting-started** - This getting started guide
2. **matlab://scripts/{script_name}** - Content of MATLAB scripts in the temp directory

## Examples

### Executing MATLAB Code

You can execute MATLAB code like this:

\`\`\`
% Create a simple plot
x = 0:0.1:2*pi;
y = sin(x);
plot(x, y);
title('Sine Wave');
xlabel('x');
ylabel('sin(x)');
\`\`\`

### Generating MATLAB Code

You can ask the AI to generate MATLAB code for specific tasks, such as:

- "Create a script to calculate the Fibonacci sequence"
- "Write code to perform image processing on a sample image"
- "Generate a function to solve a system of linear equations"

### Executing MATLAB Scripts by Name

You can execute previously saved MATLAB scripts by name:

- Provide the script name (without .m extension)
- Optionally pass arguments as variables to the script
- The script must exist in the MATLAB temp directory

### Accessing Script Content

You can view the content of saved MATLAB scripts:

- Use the resource URI: \`matlab://scripts/{script_name}\`
- Returns the full content of the .m file
- Useful for reviewing previously generated scripts

## Requirements

- MATLAB must be installed on your system
- The MATLAB executable must be in your PATH or specified via the MATLAB_PATH environment variable
`,
              },
            ],
          }
        }

        throw new McpError(
          ErrorCode.InvalidRequest,
          `Documentation not found: ${docType}`,
        )
      },
    )
  }

  /**
   * Setup tool handlers
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_matlab_script',
          description: 'Generate MATLAB script from a natural language description',
          inputSchema: {
            type: 'object',
            properties: {
              scriptName: {
                type: 'string',
                description: 'Name for the script file (without .m extension, must be valid MATLAB identifier)',
              },
              code: {
                type: 'string',
                description: 'MATLAB code to execute',
              },
            },
            required: ['scriptName', 'code'],
          },
        },

        {
          name: 'execute_matlab_script',
          description: 'Execute a MATLAB script by name (script must exist in temp directory)',
          inputSchema: {
            type: 'object',
            properties: {
              script_name: {
                type: 'string',
                description: 'Name of the script file (without .m extension)',
              },
              args: {
                type: 'object',
                description: 'Optional arguments to pass to the script as variables',
              },
            },
            required: ['script_name'],
          },
        },
        // {
        //   name: 'close_matlab_windows',
        //   description: 'Close all MATLAB windows and instances',
        //   inputSchema: {
        //     type: 'object',
        //     properties: {},
        //     required: [],
        //   },
        // },
      ],
    }))

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Check MATLAB availability if not already checked
      if (!this.matlabAvailable) {
        this.matlabAvailable = await this.matlabHandler.checkMatlabAvailability()

        if (!this.matlabAvailable && request.params.name === 'execute_matlab_code') {
          return {
            content: [
              {
                type: 'text',
                text: `Error: MATLAB is not available. Please make sure MATLAB is installed and the path is correctly set in the environment variable MATLAB_PATH.`,
              },
            ],
            isError: true,
          }
        }
      }

      switch (request.params.name) {
        case 'generate_matlab_script': {
          const scriptName = String(request.params.arguments?.scriptName || '')
          const code = String(request.params.arguments?.code || '')

          if (!scriptName) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'scriptName is required',
            )
          }

          try {
            // Generate code with optional script name if saveScript is true
            const result = await this.matlabHandler.generateCode(
              scriptName,
              code,
            )

            let responseText = `Generated MATLAB script for: "${scriptName}"\n\n\`\`\`matlab\n${result.code}\n\`\`\``

            // If script was saved via generateCode, use that path
            if (result.scriptPath!)
              responseText += `\n\nGenerated MATLAB script saved to: ${result.scriptPath}`

            return {
              content: [
                {
                  type: 'text',
                  text: responseText,
                },
              ],
            }
          }
          catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error generating MATLAB code: ${error instanceof Error ? error.message : String(error)}`,
                },
              ],
              isError: true,
            }
          }
        }

        case 'execute_matlab_script': {
          const scriptName = String(request.params.arguments?.script_name || '')
          // const args = request.params.arguments?.args as Record<string, any> | undefined

          if (!scriptName) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Script name is required',
            )
          }

          try {
            const result = await this.matlabHandler.executeScript(scriptName)

            const responseText = result.error
              ? `Error executing MATLAB script "${scriptName}":\n${result.error}`
              : `MATLAB script "${scriptName}" execution result:\n${result.output}`

            return {
              content: [
                {
                  type: 'text',
                  text: responseText,
                },
              ],
              isError: !!result.error,
            }
          }
          catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error executing MATLAB script: ${error instanceof Error ? error.message : String(error)}`,
                },
              ],
              isError: true,
            }
          }
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`,
          )
      }
    })
  }

  /**
   * Start the server
   */
  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('MATLAB MCP server running on stdio')
  }
}

export default MatlabMcpServer
