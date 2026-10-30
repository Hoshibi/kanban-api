#!/usr/bin/env node
// @ts-nocheck
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const moduleName = process.argv[2];
if (!moduleName) {
  console.error("Uso: pnpm module:create <nome>");
  console.error("Exemplo: pnpm module:create auth");
  process.exit(1);
}

// Validação básica: apenas letras minúsculas, números, hífen
if (!/^[a-z][a-z0-9-]*$/.test(moduleName)) {
  console.error("Nome inválido. Use apenas letras minúsculas, números e hífen (ex: auth, user-profile)");
  process.exit(1);
}

const base = join("src", "modules", moduleName);
const pascalName = moduleName
  .split("-")
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join("");

if (existsSync(base)) {
  console.error(`❌ Módulo "${moduleName}" já existe em ${base}`);
  process.exit(1);
}

mkdirSync(base, { recursive: true });

const files = [
  {
    name: "routes.ts",
    content: routesTemplate(moduleName, pascalName),
  },
  {
    name: "controller.ts",
    content: controllerTemplate(moduleName, pascalName),
  },
  {
    name: "service.ts",
    content: serviceTemplate(moduleName, pascalName),
  },
  {
    name: "schemas.ts",
    content: schemasTemplate(moduleName, pascalName),
  },
  {
    name: "middleware.ts",
    content: middlewareTemplate(moduleName, pascalName),
  },
  {
    name: "index.ts",
    content: indexTemplate(moduleName, pascalName),
  },
];

files.forEach((f) => writeFileSync(join(base, f.name), f.content));

console.log(`✅ Módulo "${moduleName}" criado em ${base}`);
console.log("");
console.log("Arquivos criados:");
files.forEach((f) => console.log(`  - ${base}/${f.name}`));
console.log("");
console.log("Próximos passos:");
console.log(`  1. Edite ${base}/schemas.ts com seus schemas Zod`);
console.log(`  2. Implemente ${base}/service.ts`);
console.log(`  3. Implemente ${base}/controller.ts`);
console.log(`  4. Defina rotas em ${base}/routes.ts`);
console.log(`  5. Exporte no ${base}/index.ts`);
console.log(`  6. Registre no app.ts: import { ${pascalName}Routes } from "@modules/${moduleName}"; app.use("/${moduleName}", ${pascalName}Routes);`);

// --- Templates ---

function routesTemplate(name: string, pascalName: string): string {
  return `import { Router } from "express";
import { ${pascalName}Controller } from "./controller.ts";
import { ${pascalName}Schemas } from "./schemas.ts";
import { validate } from "@shared/middleware/validate.ts";

export const ${pascalName}Routes = Router();

// TODO: adicione suas rotas
// ${pascalName}Routes.post("/", validate(${pascalName}Schemas.create), ${pascalName}Controller.create);
// ${pascalName}Routes.get("/", ${pascalName}Controller.list);
// ${pascalName}Routes.get("/:id", ${pascalName}Controller.getById);
// ${pascalName}Routes.patch("/:id", validate(${pascalName}Schemas.update), ${pascalName}Controller.update);
// ${pascalName}Routes.delete("/:id", ${pascalName}Controller.delete);
`;
}

function controllerTemplate(name: string, pascalName: string): string {
  return `import type { Request, Response } from "express";
import { ${pascalName}Service } from "./service.ts";

export const ${pascalName}Controller = {
  // async create(req: Request, res: Response) {
  //   try {
  //     const data = req.body; // já validado pelo middleware validate()
  //     const result = await ${pascalName}Service.create(data);
  //     res.status(201).json(result);
  //   } catch (err) {
  //     // Erros são tratados pelo errorHandler global
  //     throw err;
  //   }
  // },

  // async list(req: Request, res: Response) {
  //   const result = await ${pascalName}Service.list();
  //   res.json(result);
  // },

  // async getById(req: Request, res: Response) {
  //   const { id } = req.params;
  //   const result = await ${pascalName}Service.getById(Number(id));
  //   res.json(result);
  // },

  // async update(req: Request, res: Response) {
  //   const { id } = req.params;
  //   const data = req.body;
  //   const result = await ${pascalName}Service.update(Number(id), data);
  //   res.json(result);
  // },

  // async delete(req: Request, res: Response) {
  //   const { id } = req.params;
  //   await ${pascalName}Service.delete(Number(id));
  //   res.status(204).send();
  // },
};
`;
}

function serviceTemplate(name: string, pascalName: string): string {
  return `import { prisma } from "@config/prisma.js";

export const ${pascalName}Service = {
  // async create(data: ${pascalName}CreateInput) {
  //   return prisma.${pascalName.toLowerCase()}.create({ data });
  // },

  // async list() {
  //   return prisma.${pascalName.toLowerCase()}.findMany({ orderBy: { createdAt: "desc" } });
  // },

  // async getById(id: number) {
  //   const item = await prisma.${pascalName.toLowerCase()}.findUnique({ where: { id } });
  //   if (!item) throw new Error("NotFound");
  //   return item;
  // },

  // async update(id: number, data: Partial<${pascalName}CreateInput>) {
  //   return prisma.${pascalName.toLowerCase()}.update({ where: { id }, data });
  // },

  // async delete(id: number) {
  //   await prisma.${pascalName.toLowerCase()}.delete({ where: { id } });
  // },
};
`;
}

function schemasTemplate(name: string, pascalName: string): string {
  return `import { z } from "zod";

export const ${pascalName}Schemas = {
  // create: z.object({
  //   body: z.object({
  //     name: z.string().min(2).max(150),
  //     email: z.string().email().max(150),
  //     // adicione seus campos
  //   }),
  // }),

  // update: z.object({
  //   params: z.object({ id: z.coerce.number().int().positive() }),
  //   body: z.object({
  //     name: z.string().min(2).max(150).optional(),
  //     email: z.string().email().max(150).optional(),
  //   }).partial(),
  // }),

  // getById: z.object({
  //   params: z.object({ id: z.coerce.number().int().positive() }),
  // }),

  // delete: z.object({
  //   params: z.object({ id: z.coerce.number().int().positive() }),
  // }),
};

// Types inferidos automaticamente
export type ${pascalName}CreateInput = z.infer<typeof ${pascalName}Schemas.create>["body"];
export type ${pascalName}UpdateInput = z.infer<typeof ${pascalName}Schemas.update>["body"];
`;
}

function middlewareTemplate(name: string, pascalName: string): string {
  return `import type { NextFunction, Request, Response } from "express";

// export const ${pascalName}Guard = (req: Request, _res: Response, next: NextFunction) => {
//   // Exemplo: verifica permissão específica do módulo
//   if (!req.user?.permissions?.includes("${name}:write")) {
//     return res.status(403).json({ error: "Forbidden" });
//   }
//   next();
// };
`;
}

function indexTemplate(name: string, pascalName: string): string {
  return `export { ${pascalName}Routes } from "./routes.ts";
// export { ${pascalName}Guard } from "./middleware.ts";
export type { ${pascalName}CreateInput, ${pascalName}UpdateInput } from "./schemas.ts";
// Service e Controller são uso interno do módulo
`;
}