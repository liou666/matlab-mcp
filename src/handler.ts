import { exec } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Configuration for MATLAB
interface MatlabConfig {
  executablePath: string
  tempDir: string
  pauseTime?: number

}

// Default configuration
const defaultConfig: MatlabConfig = {
  executablePath: process.env.MATLAB_PATH || 'matlab', // Default to 'matlab' command if MATLAB_PATH not set
  tempDir: process.env.MATLAB_TEMP_DIR || path.join(os.tmpdir(), 'matlab-mcp'),
  pauseTime: process.argv[2] ? parseInt(process.argv[2], 10) : 1,
}

// Ensure temp directory exists
if (!fs.existsSync(defaultConfig.tempDir))
  fs.mkdirSync(defaultConfig.tempDir, { recursive: true })

/**
 * Class to handle MATLAB operations
 */
class MatlabHandler {
  private config: MatlabConfig

  constructor(config: MatlabConfig = defaultConfig) {
    this.config = config
  }

  /**
   * Get the temp directory path
   * @returns The path to the temp directory
   */
  getTempDir(): string {
    return this.config.tempDir
  }

  /**
   * Generate MATLAB code from natural language description and optionally save it
   * @param scriptName Natural language description of what the code should do
   * @param code MATLAB code to execute
   * @returns Object containing generated code and file path if saved
   */
  async generateCode(scriptName: string, code: string): Promise<{ code: string, scriptPath?: string }> {
    // Validate script name (similar to Python's isidentifier check)
    if (!this.isValidMatlabIdentifier(scriptName))
      throw new Error('Script name must be a valid MATLAB identifier')

    // Create script path
    const scriptPath = path.join(this.config.tempDir, `${scriptName}.m`)

    try {
      // Save the code to file
      await fs.writeFileSync(scriptPath, code)

      return {
        code,
        scriptPath,
      }
    }
    catch (error) {
      throw new Error(`Failed to create MATLAB script: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Execute MATLAB code
   * @param code MATLAB code to execute
   * @returns Result of execution
   */
  async executeCode(
    code: string,
  ): Promise<{
      output: string
      error?: string
    }> {
    try {
      // Ensure directories exist
      if (!fs.existsSync(this.config.tempDir))
        fs.mkdirSync(this.config.tempDir, { recursive: true })

      const scriptPath = path.join(this.config.tempDir, `temp_script_${Date.now()}.m`)
      fs.writeFileSync(scriptPath, code)

      // Execute the enhanced MATLAB script with timeout
      const timeoutMs = 30000 // 30 seconds timeout
      const command = `"${this.config.executablePath}" -nosplash  -batch "run('${scriptPath.replace(/\\/g, '/')}');"`

      const { stdout, stderr } = await Promise.race([
        execAsync(command, { timeout: timeoutMs }),
        new Promise<{ stdout: string, stderr: string }>((_, reject) =>
          setTimeout(() => reject(new Error('MATLAB execution timed out')), timeoutMs),
        ),
      ])

      return {
        output: stdout || 'Execution completed (no output captured)',
        error: stderr || undefined,
      }
    }
    catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Execute a MATLAB script by name
   * @param scriptName Name of the script (without .m extension)
   * @param args Optional arguments to pass to the script
   * @returns Result of execution
   */
  async executeScript(
    scriptName: string,
  ): Promise<{
      output: string
      error?: string
    }> {
    try {
      const scriptPath = path.join(this.config.tempDir, `${scriptName}.m`)

      if (!fs.existsSync(scriptPath))
        throw new Error(`Script ${scriptName}.m not found in ${this.config.tempDir}`)

      const command = `"${this.config.executablePath}" -nosplash  -batch "run('${scriptPath.replace(/\\/g, '/')}'); pause(${this.config.pauseTime}); exit;"`

      const { stdout, stderr } = await execAsync(command)

      return {
        output: stdout,
        error: stderr || undefined,
      }
    }
    catch (error) {
      console.error('Error executing MATLAB script:', error)
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Validate if a string is a valid MATLAB identifier
   * @param name String to validate
   * @returns True if valid MATLAB identifier
   */
  private isValidMatlabIdentifier(name: string): boolean {
    // MATLAB identifier rules:
    // - Must start with a letter
    // - Can contain letters, digits, and underscores
    // - Maximum 63 characters
    const matlabIdentifierRegex = /^[a-zA-Z][a-zA-Z0-9_]{0,62}$/
    return matlabIdentifierRegex.test(name)
  }

  /**
   * Check if MATLAB is available
   * @returns True if MATLAB is available, false otherwise
   */
  async checkMatlabAvailability(): Promise<boolean> {
    try {
      await execAsync(`"${this.config.executablePath}" -nosplash -nodesktop -r "disp('MATLAB is available'); exit;"`)
      return true
    }
    catch (error) {
      console.error('MATLAB is not available:', error)
      return false
    }
  }

  /**
   * Close MATLAB windows
   * @returns Result of closing MATLAB windows
   */
  async closeMatlabWindows(): Promise<{ success: boolean, error?: string }> {
    try {
      // Close all MATLAB instances by sending quit command
      const command = `"${this.config.executablePath}" -nosplash -nodesktop -r "quit force; exit;"`

      await execAsync(command)

      return {
        success: true,
      }
    }
    catch (error) {
      // Even if there's an error, it might be because MATLAB was already closed
      // or there were no MATLAB instances running. We'll consider this a success
      // unless it's a critical error like MATLAB not being found.
      const errorMessage = error instanceof Error ? error.message : String(error)

      // If the error suggests MATLAB is not found, that's a real error
      if (errorMessage.toLowerCase().includes('not found')
        || errorMessage.toLowerCase().includes('not recognized')) {
        return {
          success: false,
          error: `MATLAB executable not found: ${errorMessage}`,
        }
      }

      // For other errors (like no MATLAB instances to close), consider it success
      return {
        success: true,
      }
    }
  }
}

export default MatlabHandler
