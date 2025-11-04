import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Quantum-Judge — User Contest Service",
    version: "1.0.0",
    description: "User & Contest microservice API",
  },

  servers: [
    {
      url: "http://localhost:4000",
      description: "Local",
    },
  ],

  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          username: { type: "string" },
          role: { type: "string", enum: ["ORGANIZER", "CONTESTANT"] },
        },
      },

      Contest: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
        },
      },

      Problem: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          statement: { type: "string" },
          difficulty: { type: "string" },
        },
      },

      TestCase: {
        type: "object",
        properties: {
          id: { type: "string" },
          input: { type: "string" },
          expectedOutput: { type: "string" },
          isHidden: { type: "boolean" },
        },
      },
    },
  },

  /* Apply cookie authentication globally */
  security: [{ cookieAuth: [] }],

  paths: {
    // ---------------------------------------------------
    // AUTH
    // ---------------------------------------------------
    "/api/auth/signup/organizer": {
      post: {
        tags: ["Auth"],
        summary: "Register organizer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                required: ["email", "username", "password"],
                properties: {
                  email: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },

    "/api/auth/signup/contestant": {
      post: {
        tags: ["Auth"],
        summary: "Register contestant",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                required: ["email", "username", "password"],
                properties: {
                  email: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                required: ["identifier", "password"],
                properties: {
                  identifier: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Login success" } },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Logged out" } },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get authenticated user",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "User info" } },
      },
    },

    // ---------------------------------------------------
    // CONTESTS
    // ---------------------------------------------------
    "/api/contests": {
      post: {
        tags: ["Contests"],
        summary: "Create contest",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Contest" } },
          },
        },
        responses: { 201: { description: "Created" } },
      },
      get: {
        tags: ["Contests"],
        summary: "List contests",
        parameters: [
          { name: "skip", in: "query", schema: { type: "integer" } },
          { name: "take", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },

    "/api/contests/{id}": {
      get: {
        tags: ["Contests"],
        summary: "Get contest by ID",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
      delete: {
        tags: ["Contests"],
        summary: "Delete contest",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { 204: { description: "Deleted" } },
      },
    },

    "/api/contests/{id}/problems": {
      post: {
        tags: ["Contests"],
        summary: "Add problem to contest",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                required: ["problemId"],
                properties: {
                  problemId: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Added" } },
      },
    },

    "/api/contests/problems/{cpId}": {
      delete: {
        tags: ["Contests"],
        summary: "Remove contest problem",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "cpId", in: "path", required: true }],
        responses: { 204: { description: "Removed" } },
      },
    },

    // ---------------------------------------------------
    // PROBLEMS
    // ---------------------------------------------------
    "/api/problems": {
      post: {
        tags: ["Problems"],
        summary: "Create problem",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Problem" } },
          },
        },
        responses: { 201: { description: "Created" } },
      },
      get: {
        tags: ["Problems"],
        summary: "List problems",
        parameters: [
          { name: "skip", in: "query", schema: { type: "integer" } },
          { name: "take", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },

    "/api/problems/{id}": {
      get: {
        tags: ["Problems"],
        summary: "Get problem",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
    },

    "/api/problems/{id}/testcases": {
      post: {
        tags: ["Problems"],
        summary: "Add testcase",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                required: ["input", "expectedOutput"],
                properties: {
                  input: { type: "string" },
                  expectedOutput: { type: "string" },
                  isHidden: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },

    // ---------------------------------------------------
    // HEALTH
    // ---------------------------------------------------
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: { 200: { description: "OK" } },
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: [],
};

export default swaggerJSDoc(options);
