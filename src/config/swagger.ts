import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Kanban Assessor API",
      version: "1.0.0",
      description: "Documentação da API do Kanban Assessor",
    },
    servers: [
      {
        url: "http://localhost:3333",
        description: "Ambiente de desenvolvimento",
      },
    ],
  },
  apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
