/**
 * MATLAB MCP Server
 *
 * This MCP server provides tools to:
 * 1. Execute MATLAB code
 * 2. Generate MATLAB code from natural language descriptions
 * 3. Access MATLAB documentation
 */

import MatlabMcpServer from './server'

// Create and run the server
const server = new MatlabMcpServer()
server.run().catch(console.error)
