import { AppDataSource } from "../config/db";
import { Submission, SubmissionStatus } from "../entities/submission.entity";
import axios from "axios";
import { runInDocker } from "../sandbox/dockerRunner";
import { generateAIAnalysis } from "../ai/feedback.service";
import { emitSubmissionUpdate, emitLeaderboardUpdate } from "../utils/socket";

const repo = () => AppDataSource.getRepository(Submission);
const USER_SERVICE = process.env.USER_CONTEST_SERVICE_URL || "http://localhost:4000";

// Difficulty to points mapping
const DIFFICULTY_POINTS: Record<string, number> = {
  EASY: 3,
  MEDIUM: 4,
  HARD: 6,
};

/* ------------------ Create Submission ------------------ */
export const createSubmission = async (
  userId: string,
  username: string,
  role: string,
  problemId: string,
  language: string,
  code: string,
  contestId: string,
  authHeader: string
) => {
  // Fetch problem details including test cases
  const problemResp = await axios.get(`${USER_SERVICE}/api/problems/${problemId}`, {
    headers: { Authorization: authHeader },
  });

  const problem = problemResp.data;
  
  console.log("🟢 [Submission] Problem fetched:", problem);

  // Fix here: use lowercase 'testcases'
  const testCases = problem.testcases || [];
  console.log(`📝 [Submission] Found ${testCases.length} test cases`);

  // Create submission
  const submission = repo().create({
    userId,
    username,
    problemId,
    contestId,
    organizerId: problem.createdBy?.id || problem.createdBy || "",
    language,
    code,
    status: SubmissionStatus.PENDING,
    points: 0,
  });

  const saved = await repo().save(submission);
  emitSubmissionUpdate(saved.id, { status: SubmissionStatus.PENDING });

  // Process in background
  processSubmission(
    saved.id,
    testCases, // ✅ now correctly passes the test cases
    problem.difficulty || "EASY",
    contestId,
    problem
  ).catch(console.error);

  return saved;
};

/* ------------------ Basic Getters ------------------ */
export const getSubmission = async (id: string) => repo().findOneBy({ id });

export const listSubmissionsByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  filters?: { language?: string; status?: string }
) => {
  const offset = (page - 1) * limit;
  const where: any = { userId };
  if (filters?.language) where.language = filters.language;
  if (filters?.status) where.status = filters.status;

  const [submissions, total] = await repo().findAndCount({
    where,
    order: { createdAt: "DESC" },
    skip: offset,
    take: limit,
  });

  return { submissions, total, page, limit };
};

export const listSubmissionsByProblem = async (
  problemId: string,
  page: number = 1,
  limit: number = 10,
  filters?: { language?: string; status?: string }
) => {
  const offset = (page - 1) * limit;
  const where: any = { problemId };
  if (filters?.language) where.language = filters.language;
  if (filters?.status) where.status = filters.status;

  const [submissions, total] = await repo().findAndCount({
    where,
    order: { createdAt: "DESC" },
    skip: offset,
    take: limit,
  });

  return { submissions, total, page, limit };
};

export const listAllSubmissions = async (
  page: number = 1,
  limit: number = 20,
  filters?: { language?: string; status?: string; username?: string }
) => {
  const offset = (page - 1) * limit;
  let query = repo()
    .createQueryBuilder("s")
    .orderBy("s.createdAt", "DESC")
    .skip(offset)
    .take(limit);

  if (filters?.language)
    query = query.andWhere("s.language = :language", { language: filters.language });
  if (filters?.status)
    query = query.andWhere("s.status = :status", { status: filters.status });
  if (filters?.username)
    query = query.andWhere("s.username ILIKE :username", {
      username: `%${filters.username}%`,
    });

  const [submissions, total] = await query.getManyAndCount();
  return { submissions, total, page, limit };
};

/* ------------------ Update Helper ------------------ */
const updateSubmission = async (id: string, patch: Partial<Submission>) => {
  const s = await repo().findOneBy({ id });
  if (!s) throw { status: 404, message: "Submission not found" };
  Object.assign(s, patch);
  return repo().save(s);
};

/* ------------------ Process Sandbox + AI ------------------ */
const processSubmission = async (
  submissionId: string,
  testCases: Array<{ input: string; expectedOutput: string }>,
  difficulty: string,
  contestId: string,
  problemDetails: any
) => {
  try {
    await updateSubmission(submissionId, { status: SubmissionStatus.RUNNING });
    emitSubmissionUpdate(submissionId, {
      status: SubmissionStatus.RUNNING,
      message: "Submission is running tests...",
    });

    const s = await repo().findOneBy({ id: submissionId });
    if (!s) throw new Error("Submission not found");

    console.log(`🟢 [Processing] Starting execution for ${s.language}`);
    
    // Run in Docker with test cases
    const execResult = await runInDocker(s.language, s.code, testCases, (progress) => {
      emitSubmissionUpdate(submissionId, {
        status: SubmissionStatus.RUNNING,
        message: progress.message,
        progress,
      });
    });
    console.log("🟢 [Processing] Execution result:", execResult);

    // Calculate points based on difficulty and success
    let points = 0;
    if (execResult.verdict === SubmissionStatus.ACCEPTED) {
      points = DIFFICULTY_POINTS[difficulty.toUpperCase()] || 3;
      console.log(`✅ All tests passed! Awarded ${points} points (${difficulty})`);
    } else {
      console.log(`❌ Tests failed: ${execResult.passedTests}/${execResult.totalTests}`);
    }

    // Generate AI feedback
    const feedback = await generateAIAnalysis({
      code: s.code,
      language: s.language,
      output: execResult.output,
      expectedOutput: testCases.map((tc) => tc.expectedOutput).join("\n"),
      problem: {
        id: problemDetails?.id,
        title: problemDetails?.title,
        description: problemDetails?.description,
        difficulty: problemDetails?.difficulty,
      },
      testCases,
      submission: {
        id: submissionId,
        verdict: execResult.verdict,
        passedTests: execResult.passedTests,
        totalTests: execResult.totalTests,
      },
    });

    // Update submission with results
    console.log(`📊 [Processing] Saving metrics - Time: ${execResult.executionTime}ms, Memory: ${execResult.memoryUsed}MB`);
    await updateSubmission(submissionId, {
      status: execResult.verdict,
      feedback,
      points,
      passedTests: execResult.passedTests,
      totalTests: execResult.totalTests,
      executionTime: execResult.executionTime,
      memoryUsed: execResult.memoryUsed,
      outputLog: execResult.output,
      testResults: execResult.testResults ?? [],
    });

    emitSubmissionUpdate(submissionId, {
      status: execResult.verdict,
      feedback,
      points,
      passedTests: execResult.passedTests,
      totalTests: execResult.totalTests,
      executionTime: execResult.executionTime,
      memoryUsed: execResult.memoryUsed,
      outputLog: execResult.output,
      testResults: execResult.testResults ?? [],
    });

    // Update leaderboard
    const leaderboard = await getLeaderboardByContest(contestId, 1, 10);
    emitLeaderboardUpdate(contestId, leaderboard);
  } catch (err: any) {
    console.error("🚨 [Processing] Error:", err.message);
    const errorOutput = err?.output || err?.stderr || err?.message || "Sandbox execution failed";
    const stackTrace = err?.stack ? `\nStack Trace:\n${err.stack}` : "";
    const combinedOutput = `${errorOutput}${stackTrace}`.trim();
    await updateSubmission(submissionId, {
      status: SubmissionStatus.RUNTIME_ERROR,
      feedback: `Error: ${err.message}`,
      outputLog: combinedOutput || undefined,
      testResults: err?.testResults ?? [],
    });
    emitSubmissionUpdate(submissionId, {
      status: SubmissionStatus.RUNTIME_ERROR,
      feedback: `Error: ${err.message}`,
      outputLog: combinedOutput || undefined,
      testResults: err?.testResults ?? [],
    });
  }
};

/* ------------------ Leaderboard Logic (Best Submission Per Problem) ------------------ */
export const getLeaderboardByContest = async (
  contestId: string,
  page: number = 1,
  limit: number = 10,
  filters?: { username?: string; minPoints?: number; maxPoints?: number }
) => {
  const offset = (page - 1) * limit;
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log(`🟢 [Leaderboard] Fetching for contestId: ${contestId}`);

    if (!contestId) {
      console.error("🚨 Contest ID missing!");
      return { leaderboard: [], page, limit };
    }

    // Query to get best submission per problem per user
    let baseQuery = `
      WITH best_submissions AS (
        SELECT 
          s.userId,
          s.problemId,
          MAX(s.points) as problemPoints,
          MIN(CASE WHEN s.status = 'ACCEPTED' THEN s.createdAt END) as firstSolveTime
        FROM submissions s
        WHERE s.contestId = ?
        GROUP BY s.userId, s.problemId
      )
      SELECT 
        bs.userId,
        (SELECT username FROM submissions WHERE userId = bs.userId LIMIT 1) as username,
        COUNT(CASE WHEN bs.problemPoints > 0 THEN 1 END) AS solved,
        COALESCE(SUM(bs.problemPoints), 0) AS points,
        MIN(bs.firstSolveTime) AS firstSolveTime
      FROM best_submissions bs
      WHERE 1=1
    `;

    const params: any[] = [contestId];

    // Apply filters
    if (filters?.username) {
      baseQuery += ` AND (SELECT username FROM submissions WHERE userId = bs.userId LIMIT 1) LIKE ?`;
      params.push(`%${filters.username}%`);
    }

    baseQuery += ` GROUP BY bs.userId HAVING 1=1 `;

    if (filters?.minPoints !== undefined) {
      baseQuery += ` AND SUM(bs.problemPoints) >= ?`;
      params.push(filters.minPoints);
    }

    if (filters?.maxPoints !== undefined) {
      baseQuery += ` AND SUM(bs.problemPoints) <= ?`;
      params.push(filters.maxPoints);
    }

    // Order by points, then solved count, then first solve time
    baseQuery += ` ORDER BY points DESC, solved DESC, firstSolveTime ASC LIMIT ? OFFSET ?; `;
    params.push(limit, offset);

    const leaderboard = await queryRunner.manager.query(baseQuery, params);
    console.log(`✅ [Leaderboard] Fetched ${leaderboard.length} entries`);

    return { leaderboard, page, limit };
  } catch (err: any) {
    console.error("🚨 [Leaderboard] Query error:", err.message);
    return { leaderboard: [], page, limit };
  } finally {
    await queryRunner.release();
  }
};

/* ------------------ Edit Leaderboard Entry (Organizer Only) ------------------ */
export const editLeaderboardEntry = async (
  contestId: string,
  userId: string,
  organizerId: string,
  updates: { pointsAdjustment?: number; reason?: string }
) => {
  // Verify organizer owns this contest
  const submissions = await repo().find({
    where: { contestId, userId },
    take: 1,
  });

  if (!submissions.length) {
    throw { status: 404, message: "User not found in this contest" };
  }

  if (submissions[0].organizerId !== organizerId) {
    throw { status: 403, message: "Not authorized to edit this contest" };
  }

  // Apply manual adjustment to latest submission
  const latestSubmission = await repo().findOne({
    where: { contestId, userId },
    order: { createdAt: "DESC" },
  });

  if (latestSubmission && updates.pointsAdjustment !== undefined) {
    latestSubmission.points += updates.pointsAdjustment;
    await repo().save(latestSubmission);
    console.log(
      `✅ Adjusted points for ${latestSubmission.username} by ${updates.pointsAdjustment}`
    );
  }

  return { success: true, message: "Leaderboard entry updated", reason: updates.reason };
};

/* ------------------ Delete Leaderboard Entry (Organizer Only) ------------------ */
export const deleteLeaderboardEntry = async (
  contestId: string,
  userId: string,
  organizerId: string
) => {
  // Verify organizer owns this contest
  const submissions = await repo().find({
    where: { contestId, userId },
    take: 1,
  });

  if (!submissions.length) {
    throw { status: 404, message: "User not found in this contest" };
  }

  if (submissions[0].organizerId !== organizerId) {
    throw { status: 403, message: "Not authorized to delete from this contest" };
  }

  // Delete all submissions for this user in this contest
  const result = await repo().delete({ contestId, userId });
  console.log(`✅ Removed ${result.affected} submissions for user ${userId}`);

  return { success: true, message: "User removed from leaderboard" };
};

/* ------------------ Organizer Dashboard Metrics ------------------ */
export const getOrganizerDashboardMetrics = async (
  organizerId: string,
  contestId?: string
) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Base conditions
    let whereClause = "WHERE s.organizerId = ?";
    const params: any[] = [organizerId];

    if (contestId) {
      whereClause += " AND s.contestId = ?";
      params.push(contestId);
    }

    // Total submissions
    const [totalResult] = await queryRunner.manager.query(
      `SELECT COUNT(*) as total FROM submissions s ${whereClause}`,
      params
    );

    // Submissions by status
    const statusBreakdown = await queryRunner.manager.query(
      `SELECT status, COUNT(*) as count FROM submissions s ${whereClause} GROUP BY status`,
      params
    );

    // Unique participants
    const [participantsResult] = await queryRunner.manager.query(
      `SELECT COUNT(DISTINCT userId) as count FROM submissions s ${whereClause}`,
      params
    );

    // Language distribution
    const languageDistribution = await queryRunner.manager.query(
      `SELECT language, COUNT(*) as count FROM submissions s ${whereClause} GROUP BY language ORDER BY count DESC`,
      params
    );

    // Average points per user
    const [avgPointsResult] = await queryRunner.manager.query(
      `SELECT AVG(total_points) as avgPoints FROM (
        SELECT userId, SUM(points) as total_points 
        FROM submissions s ${whereClause} 
        GROUP BY userId
      ) user_points`,
      params
    );

    // Top performers
    const topPerformers = await queryRunner.manager.query(
      `SELECT username, SUM(points) as totalPoints, 
              COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as solved
       FROM submissions s ${whereClause}
       GROUP BY username
       ORDER BY totalPoints DESC, solved DESC
       LIMIT 10`,
      params
    );

    // Recent activity (last 24 hours)
    const [recentActivityResult] = await queryRunner.manager.query(
      `SELECT COUNT(*) as count FROM submissions s 
       ${whereClause} AND s.createdAt >= NOW() - INTERVAL 24 HOUR`,
      params
    );

    // Success rate
    const [successRateResult] = await queryRunner.manager.query(
      `SELECT 
        COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as accepted,
        COUNT(*) as total
       FROM submissions s ${whereClause}`,
      params
    );

    const successRate =
      successRateResult.total > 0
        ? ((successRateResult.accepted / successRateResult.total) * 100).toFixed(2)
        : "0.00";

    return {
      totalSubmissions: parseInt(totalResult.total),
      statusBreakdown,
      uniqueParticipants: parseInt(participantsResult.count),
      languageDistribution,
      averagePoints: parseFloat(avgPointsResult.avgPoints || 0).toFixed(2),
      topPerformers,
      recentActivity: parseInt(recentActivityResult.count),
      successRate: `${successRate}%`,
    };
  } catch (err: any) {
    console.error("🚨 [Dashboard] Metrics error:", err.message);
    throw err;
  } finally {
    await queryRunner.release();
  }
};