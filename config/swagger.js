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
