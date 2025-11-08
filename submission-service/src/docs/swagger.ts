import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Quantum-Judge — Submission Service",
    version: "1.1.0",
    description:
      "Handles code submissions, execution, leaderboard, pagination, and AI feedback",
  },

  servers: [{ url: "http://localhost:5000" }],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      /* ---------------------- Submission Schemas ---------------------- */
      SubmissionCreate: {
        type: "object",
        required: ["problemId", "language", "code"],
        properties: {
          problemId: { type: "string" },
          language: { type: "string", example: "python" },
          code: { type: "string" },
        },
      },

      SubmissionResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          problemId: { type: "string" },
          language: { type: "string" },
          status: { type: "string", example: "PASSED" },
          feedback: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      /* ---------------------- Leaderboard Schema ---------------------- */
      LeaderboardEntry: {
        type: "object",
        properties: {
          userId: { type: "string", example: "a1b2c3d4" },
          username: { type: "string", example: "vishal_dev" },
          solved: { type: "integer", example: 3 },
          totalAttempts: { type: "integer", example: 7 },
          firstSolveTime: {
            type: "string",
            format: "date-time",
            example: "2025-11-04T18:25:43.511Z",
          },
          points: {
            type: "integer",
            example: 270,
            description:
              "Total score based on problems solved and penalties for wrong attempts",
          },
        },
      },

      /* ---------------------- Pagination Wrapper ---------------------- */
      PaginatedResponse: {
        type: "object",
        properties: {
          total: { type: "integer", example: 120 },
          page: { type: "integer", example: 2 },
          limit: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 6 },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/SubmissionResponse" },
          },
        },
      },
    },
  },

  security: [{ bearerAuth: [] }],

  paths: {
    /* ---------------------- Create Submission ---------------------- */
    "/api/submissions": {
      post: {
        tags: ["Submissions"],
        summary: "Create a new submission",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SubmissionCreate" },
            },
          },
        },
        responses: {
          201: {
            description: "Submission created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SubmissionResponse" },
              },
            },
          },
        },
      },
    },

    /* ---------------------- Get Submission by ID ---------------------- */
    "/api/submissions/{id}": {
      get: {
        tags: ["Submissions"],
        summary: "Get submission by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Submission found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SubmissionResponse" },
              },
            },
          },
          404: { description: "Not Found" },
        },
      },
    },

    /* ---------------------- User Submissions ---------------------- */
    "/api/submissions/user/me": {
      get: {
        tags: ["Submissions"],
        summary: "List submissions for logged-in user (with pagination/filter)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 10 } },
          {
            name: "language",
            in: "query",
            schema: { type: "string", example: "python" },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", example: "PASSED" },
          },
          {
            name: "sortBy",
            in: "query",
            schema: { type: "string", example: "createdAt" },
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], example: "desc" },
          },
        ],
        responses: {
          200: {
            description: "Paginated list of user submissions",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedResponse" },
              },
            },
          },
        },
      },
    },

    /* ---------------------- Problem Submissions ---------------------- */
    "/api/submissions/problem/{problemId}": {
      get: {
        tags: ["Submissions"],
        summary: "List submissions by problem (with pagination/filter)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "problemId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 10 } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", example: "FAILED" },
          },
        ],
        responses: {
          200: {
            description: "Paginated list of submissions for the problem",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedResponse" },
              },
            },
          },
        },
      },
    },

    /* ---------------------- All Submissions (Admin/Organizer) ---------------------- */
    "/api/submissions/all": {
      get: {
        tags: ["Submissions"],
        summary:
          "List all submissions (ADMIN & ORGANIZER only, with pagination/filter)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 20 } },
          {
            name: "language",
            in: "query",
            schema: { type: "string", example: "cpp" },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", example: "PENDING" },
          },
          {
            name: "userId",
            in: "query",
            schema: { type: "string", example: "u1234" },
          },
        ],
        responses: {
          200: {
            description: "Paginated list of all submissions",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedResponse" },
              },
            },
          },
          403: { description: "Forbidden — Only ADMIN & ORGANIZER allowed" },
        },
      },
    },

    /* ---------------------- Leaderboard ---------------------- */
    "/api/submissions/leaderboard/{contestId}": {
      get: {
        tags: ["Leaderboard"],
        summary: "Get leaderboard for a contest (with pagination)",
        description:
          "Returns leaderboard with username, score, problems solved, and first solve time. Supports pagination and sorting by score/time.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "contestId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Contest ID to fetch leaderboard for",
          },
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 10 } },
          {
            name: "sortBy",
            in: "query",
            schema: { type: "string", enum: ["points", "firstSolveTime"], example: "points" },
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], example: "desc" },
          },
        ],
        responses: {
          200: {
            description: "Paginated leaderboard fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "integer", example: 50 },
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 10 },
                    totalPages: { type: "integer", example: 5 },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/LeaderboardEntry" },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Contest not found" },
        },
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
