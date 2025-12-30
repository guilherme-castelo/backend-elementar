const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Elementar Backend API",
      version: "1.0.0",
      description: "API documentation for Elementar Backend MVP",
      contact: {
        name: "API Support",
        email: "support@elementar.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Local Verification Server",
      },
    ],
    components: {
      securitySchemes: {
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
            id: { type: "integer" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "object", properties: { name: { type: "string" } } },
            companyId: { type: "integer" },
            isActive: { type: "boolean" }
          }
        },
        Company: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            isActive: { type: "boolean" }
          }
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "DONE"] },
            assigneeId: { type: "integer" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Employee: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            position: { type: "string" },
            matricula: { type: "string" },
            dataAdmissao: { type: "string", format: "date-time" }
          }
        },
        Meal: {
          type: "object",
          properties: {
            id: { type: "integer" },
            date: { type: "string", format: "date-time" },
            employeeId: { type: "integer" },
            type: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER"] }
          }
        },
        Conversation: {
          type: "object",
          properties: {
            id: { type: "integer" },
            participantIds: { type: "array", items: { type: "integer" } },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "integer" },
            content: { type: "string" },
            senderId: { type: "integer" },
            conversationId: { type: "integer" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" }
          }
        }
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
