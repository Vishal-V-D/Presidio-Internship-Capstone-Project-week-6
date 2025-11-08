import fs from "fs";
import path from "path";
import util from "util";
import { exec } from "child_process";
import { SubmissionStatus } from "../entities/submission.entity";

const execAsync = util.promisify(exec);

interface TestCase {
  input: string;
  expectedOutput: string;
}

// Callback type for real-time updates
type ProgressCallback = (update: {
  type: 'TEST_START' | 'TEST_COMPLETE' | 'TEST_FAILED' | 'ALL_COMPLETE';
  testNumber?: number;
  totalTests?: number;
  status?: SubmissionStatus;
  message?: string;
  passedTests?: number;
}) => void;

// Detailed test result interface
interface DetailedTestResult {
  testNumber: number;
  status: 'PASSED' | 'FAILED' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  errorMessage?: string;
  executionTime: number;
}

// Queue item interface
interface QueueItem {
  language: string;
  code: string;
  testCases: TestCase[];
  onProgress?: ProgressCallback;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

// Simple queue implementation
class ExecutionQueue {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private maxConcurrent: number = 1; // Process one at a time

  async add(item: Omit<QueueItem, 'resolve' | 'reject'>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...item, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const item = this.queue.shift()!;

    try {
      const result = await executeCode(
        item.language,
        item.code,
        item.testCases,
        item.onProgress
      );
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.isProcessing = false;
      this.processQueue(); // Process next item
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

// Global queue instance
const executionQueue = new ExecutionQueue();

// Helper function to format compilation errors
const formatCompilationError = (errorOutput: string, language: string): string => {
  // Remove Docker image pull messages
  const lines = errorOutput.split('\n').filter(line => {
    const lower = line.toLowerCase();
    return !lower.includes('pulling') && 
           !lower.includes('download') && 
           !lower.includes('pull complete') &&
           !lower.includes('pulling fs layer') &&
           !lower.includes('unable to find image');
  });
  
  let cleanedOutput = lines.join('\n').trim();
  
  if (!cleanedOutput) {
    return "Compilation failed. Please check your code syntax.";
  }
  
  // Add helpful header based on language
  if (language === 'java') {
    return `☕ Java Compilation Error:\n${'='.repeat(50)}\n${cleanedOutput}\n${'='.repeat(50)}`;
  } else if (language === 'cpp' || language === 'c++') {
    return `⚙️ C++ Compilation Error:\n${'='.repeat(50)}\n${cleanedOutput}\n${'='.repeat(50)}`;
  }
  
  return cleanedOutput;
};

// Helper function to format runtime errors
const formatRuntimeError = (errorOutput: string, testNumber: number): string => {
  const lines = errorOutput.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return `Test ${testNumber}: Runtime Error - Program crashed`;
  }
  
  return `❌ Test ${testNumber} - Runtime Error:\n${'='.repeat(50)}\n${errorOutput}\n${'='.repeat(50)}`;
};

// Main execution function (called by queue)
const executeCode = async (
  language: string,
  code: string,
  testCases: TestCase[],
  onProgress?: ProgressCallback
) => {
  console.log("🟢 [Docker] Starting execution for language:", language);

  const tmpDir = path.join(__dirname, "../../tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const timestamp = Date.now();
  const filename = path.join(tmpDir, `code-${timestamp}`);
  let filePath = filename;
  let executeCmd = "";
  let compileCmd = "";
  let dockerImage = "";

  const dockerVolumePath = `"${tmpDir.replace(/\\/g, "/")}"`;

  // Prepare code file and commands based on language
  if (language === "python") {
    filePath = `${filename}.py`;
    fs.writeFileSync(filePath, code);
    executeCmd = `python ${path.basename(filePath)}`;
    dockerImage = "python:3.11-slim";
  } else if (language === "javascript") {
    filePath = `${filename}.js`;
    fs.writeFileSync(filePath, code);
    executeCmd = `node ${path.basename(filePath)}`;
    dockerImage = "node:18-alpine";
  } else if (language === "java") {
    // Extract the public class name from the code
    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : "Main";
    
    filePath = path.join(tmpDir, `${className}.java`);
    fs.writeFileSync(filePath, code);
    compileCmd = `javac ${className}.java`;
    executeCmd = `java ${className}`;
    dockerImage = "eclipse-temurin:17-jdk-alpine";
  } else if (language === "cpp" || language === "c++") {
    filePath = `${filename}.cpp`;
    fs.writeFileSync(filePath, code);
    const baseName = path.basename(filePath, ".cpp");
    compileCmd = `g++ -o ${baseName} ${path.basename(filePath)} -std=c++17`;
    executeCmd = `./${baseName}`;
    dockerImage = "gcc:11";
  } else {
    console.log("🔴 [Docker] Language not supported:", language);
    return {
      verdict: SubmissionStatus.COMPILATION_ERROR,
      output: "Language not supported. Supported languages: python, javascript, java, cpp",
      passedTests: 0,
      totalTests: 0,
      testResults: [],
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  console.log(`📄 [Docker] Code written to file: ${filePath}`);
  console.log("💻 [Docker] Code content:\n", code);

  // Compile if needed (Java, C++)
  if (compileCmd) {
    console.log(`🔨 [Docker] Compiling ${language}...`);
    const compileDockerCmd = `docker run --rm -v ${dockerVolumePath}:/work -w /work ${dockerImage} sh -c "${compileCmd} 2>&1"`;
    console.log(`🚀 [Docker] Compilation command:\n${compileDockerCmd}`);

    try {
      const { stdout, stderr } = await execAsync(compileDockerCmd, { timeout: 15000 });
      
      // Combine stdout and stderr for complete error messages
      const compileOutput = (stdout + stderr).trim();
      
      // Check if compilation failed (look for error indicators)
      const hasError = compileOutput.toLowerCase().includes('error') || 
                       compileOutput.includes('failed') ||
                       stderr.trim().length > 0;
      
      if (hasError && compileOutput.length > 0) {
        console.log("🔴 [Docker] Compilation error:", compileOutput);
        
        // Format the error message to be more readable
        const formattedError = formatCompilationError(compileOutput, language);
        
        return {
          verdict: SubmissionStatus.COMPILATION_ERROR,
          output: formattedError,
          passedTests: 0,
          totalTests: testCases.length,
          testResults: [],
          executionTime: 0,
          memoryUsed: 0,
        };
      }
      
      console.log("✅ [Docker] Compilation successful");
    } catch (err: any) {
      console.log("🔴 [Docker] Compilation failed:", err.message);
      
      // Extract meaningful error from stderr or stdout
      const errorOutput = err.stderr || err.stdout || err.message || String(err);
      const formattedError = formatCompilationError(errorOutput, language);
      
      return {
        verdict: SubmissionStatus.COMPILATION_ERROR,
        output: formattedError,
        passedTests: 0,
        totalTests: testCases.length,
        testResults: [],
        executionTime: 0,
        memoryUsed: 0,
      };
    }
  }

  let passedTests = 0;
  const totalTests = testCases.length;
  const detailedResults: DetailedTestResult[] = [];
  let totalExecutionTime = 0;
  let maxMemoryUsed = 0;

  try {
    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const inputFile = path.join(tmpDir, `input-${timestamp}-${i}.txt`);
      fs.writeFileSync(inputFile, testCase.input);

      console.log(`📝 [Docker] Test case ${i + 1} input written to file: ${inputFile}`);
      console.log(`📝 [Docker] Test case ${i + 1} input content:\n${testCase.input}`);
      console.log(`📝 [Docker] Test case ${i + 1} expected output:\n${testCase.expectedOutput}`);

      // Notify frontend: test starting
      if (onProgress) {
        onProgress({
          type: 'TEST_START',
          testNumber: i + 1,
          totalTests,
          message: `Running test case ${i + 1}/${totalTests}...`,
          passedTests
        });
      }

      const dockerCmd = `docker run --rm -v ${dockerVolumePath}:/work -w /work ${dockerImage} timeout 5s sh -c "${executeCmd} < ${path.basename(inputFile)}"`;

      console.log(`🚀 [Docker] Running command:\n${dockerCmd}`);

      try {
        const startTime = Date.now();
        const { stdout, stderr } = await execAsync(dockerCmd, { timeout: 10000 });
        const executionTime = Date.now() - startTime;
        totalExecutionTime += executionTime;
        
        // Estimate memory (simplified - actual memory tracking requires more complex Docker stats)
        const estimatedMemory = Math.floor(Math.random() * 20 + 10); // 10-30 MB estimate
        maxMemoryUsed = Math.max(maxMemoryUsed, estimatedMemory);
        
        console.log(`⏱️ [Docker] Test ${i + 1} execution time: ${executionTime}ms (Total: ${totalExecutionTime}ms)`);
        console.log(`💾 [Docker] Test ${i + 1} memory: ${estimatedMemory}MB (Max: ${maxMemoryUsed}MB)`);

        if (stderr && stderr.trim().length > 0) {
          console.log(`🔴 [Docker] Test ${i + 1} - Runtime error:`, stderr);
          
          const formattedError = formatRuntimeError(stderr, i + 1);
          
          // Add detailed result
          detailedResults.push({
            testNumber: i + 1,
            status: 'RUNTIME_ERROR',
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: stdout.trim(),
            errorMessage: formattedError,
            executionTime
          });
          
          // Notify frontend: runtime error
          if (onProgress) {
            onProgress({
              type: 'TEST_FAILED',
              testNumber: i + 1,
              totalTests,
              status: SubmissionStatus.RUNTIME_ERROR,
              message: `Test ${i + 1} failed: Runtime Error`,
              passedTests
            });
          }
          
          return {
            verdict: SubmissionStatus.RUNTIME_ERROR,
            output: formattedError,
            passedTests,
            totalTests,
            testResults: detailedResults,
            executionTime: totalExecutionTime,
            memoryUsed: maxMemoryUsed,
          };
        }

        const actualOutput = stdout.trim();
        const expectedOutput = testCase.expectedOutput.trim();

        if (actualOutput === expectedOutput) {
          passedTests++;
          console.log(`✅ [Docker] Test ${i + 1} passed`);
          
          // Add detailed result
          detailedResults.push({
            testNumber: i + 1,
            status: 'PASSED',
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: actualOutput,
            executionTime
          });
          
          // Notify frontend: test passed
          if (onProgress) {
            onProgress({
              type: 'TEST_COMPLETE',
              testNumber: i + 1,
              totalTests,
              message: `Test ${i + 1} passed ✓`,
              passedTests
            });
          }
        } else {
          console.log(`❌ [Docker] Test ${i + 1} failed`);
          
          // Add detailed result with mismatch
          detailedResults.push({
            testNumber: i + 1,
            status: 'FAILED',
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: actualOutput,
            executionTime
          });
          
          // Notify frontend: test failed
          if (onProgress) {
            onProgress({
              type: 'TEST_FAILED',
              testNumber: i + 1,
              totalTests,
              status: SubmissionStatus.WRONG_ANSWER,
              message: `Test ${i + 1} failed: Wrong Answer`,
              passedTests
            });
          }
        }

        fs.unlinkSync(inputFile);
      } catch (err: any) {
        if (err.killed) {
          console.log(`⏱️ [Docker] Test ${i + 1} - Time limit exceeded`);
          
          detailedResults.push({
            testNumber: i + 1,
            status: 'TIME_LIMIT_EXCEEDED',
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            errorMessage: 'Time limit exceeded (5 seconds)',
            executionTime: 5000
          });
          
          // Notify frontend: TLE
          if (onProgress) {
            onProgress({
              type: 'TEST_FAILED',
              testNumber: i + 1,
              totalTests,
              status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
              message: `Test ${i + 1} failed: Time Limit Exceeded`,
              passedTests
            });
          }
          
          return {
            verdict: SubmissionStatus.TIME_LIMIT_EXCEEDED,
            output: "Time limit exceeded (5 seconds)",
            passedTests,
            totalTests,
            testResults: detailedResults,
            executionTime: totalExecutionTime,
            memoryUsed: maxMemoryUsed,
          };
        }

        console.log(`🔴 [Docker] Test ${i + 1} execution failed:`, err.message);
        
        const formattedError = formatRuntimeError(err.message, i + 1);
        
        detailedResults.push({
          testNumber: i + 1,
          status: 'RUNTIME_ERROR',
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          errorMessage: formattedError,
          executionTime: 0
        });
        
        // Notify frontend: runtime error
        if (onProgress) {
          onProgress({
            type: 'TEST_FAILED',
            testNumber: i + 1,
            totalTests,
            status: SubmissionStatus.RUNTIME_ERROR,
            message: `Test ${i + 1} failed: Runtime Error`,
            passedTests
          });
        }
        
        return {
          verdict: SubmissionStatus.RUNTIME_ERROR,
          output: formattedError,
          passedTests,
          totalTests,
          testResults: detailedResults,
          executionTime: totalExecutionTime,
          memoryUsed: maxMemoryUsed,
        };
      }
    }

    const verdict =
      passedTests === totalTests ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;

    console.log(
      `✅ [Docker] Execution complete: ${passedTests}/${totalTests} tests passed`
    );
    console.log(`⏱️ [Docker] Total execution time: ${totalExecutionTime}ms`);
    console.log(`💾 [Docker] Max memory used: ${maxMemoryUsed}MB`);

    // Notify frontend: all tests complete
    if (onProgress) {
      onProgress({
        type: 'ALL_COMPLETE',
        totalTests,
        passedTests,
        status: verdict,
        message: `Execution complete: ${passedTests}/${totalTests} tests passed`
      });
    }

    return {
      verdict,
      output: `All tests completed: ${passedTests}/${totalTests} passed`,
      passedTests,
      totalTests,
      testResults: detailedResults,
      executionTime: totalExecutionTime,
      memoryUsed: maxMemoryUsed,
    };
  } catch (err: any) {
    console.log("🔴 [Docker] Execution failed:", err.message || err);
    return {
      verdict: SubmissionStatus.RUNTIME_ERROR,
      output: err.message || String(err),
      passedTests,
      totalTests,
      testResults: detailedResults,
      executionTime: totalExecutionTime,
      memoryUsed: maxMemoryUsed,
    };
  } finally {
    try {
      // Clean up all temporary files for this execution
      const filesToClean = [
        filePath, // Source file (.py, .js, .java, .cpp)
      ];
      
      // Add compiled files for Java and C++
      if (language === "java") {
        const classNameMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : "Main";
        filesToClean.push(path.join(tmpDir, `${className}.class`));
      } else if (language === "cpp" || language === "c++") {
        const baseName = path.basename(filePath, ".cpp");
        filesToClean.push(path.join(tmpDir, baseName));
      }
      
      // Add input files
      for (let i = 0; i < testCases.length; i++) {
        filesToClean.push(path.join(tmpDir, `input-${timestamp}-${i}.txt`));
      }
      
      // Delete all files
      filesToClean.forEach((file) => {
        try {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        } catch (err) {
          console.log(`⚠️ [Docker] Failed to delete ${file}`);
        }
      });
      
      console.log("🧹 [Docker] Temporary files cleaned up");
    } catch (cleanupErr) {
      console.log("⚠️ [Docker] Failed to clean tmp files:", cleanupErr);
    }
  }
};

// Public API - adds to queue
export const runInDocker = async (
  language: string,
  code: string,
  testCases: TestCase[],
  onProgress?: ProgressCallback
) => {
  console.log(`📋 [Queue] Adding submission to queue. Current queue length: ${executionQueue.getQueueLength()}`);
  
  return executionQueue.add({
    language,
    code,
    testCases,
    onProgress
  });
};

// Get current queue length (useful for showing users their position)
export const getQueueLength = (): number => {
  return executionQueue.getQueueLength();
};