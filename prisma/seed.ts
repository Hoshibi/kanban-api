// prisma/seed.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não configurada");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const stages = [
  {
    slug: "lead",
    title: "1. Prospecção & Lead",
    description: "Captação inicial, indicação e mapeamento de patrimônio potencial",
    position: 1,
    colorBorder: "border-slate-800",
    colorAccent: "text-slate-400",
    badgeBg: "bg-slate-800 text-slate-300",
  },
  {
    slug: "suitability",
    title: "2. Análise de Perfil",
    description: "Questionário estruturado e diagnóstico técnico exploratório",
    position: 2,
    colorBorder: "border-indigo-900/60",
    colorAccent: "text-indigo-400",
    badgeBg: "bg-indigo-950/80 text-indigo-300",
  },
  {
    slug: "proposal",
    title: "3. Proposta de Alocação",
    description: "Elaboração e revisão humana de carteira recomendada",
    position: 3,
    colorBorder: "border-cyan-900/60",
    colorAccent: "text-cyan-400",
    badgeBg: "bg-cyan-950/80 text-cyan-300",
  },
  {
    slug: "negotiation",
    title: "4. Em Negociação",
    description: "Abertura de conta, documentação e transferência de custódia (STVM)",
    position: 4,
    colorBorder: "border-amber-900/60",
    colorAccent: "text-amber-400",
    badgeBg: "bg-amber-950/80 text-amber-300",
  },
  {
    slug: "active",
    title: "5. Carteira Ativa",
    description: "AUM sob custódia efetiva e acompanhamento de proventos",
    position: 5,
    colorBorder: "border-emerald-900/60",
    colorAccent: "text-emerald-400",
    badgeBg: "bg-emerald-950/80 text-emerald-300",
  },
] as const;

async function main() {
  console.log("🌱 Iniciando seed de KanbanStage...");

  for (const stage of stages) {
    const existing = await prisma.kanbanStage.findUnique({
      where: { slug: stage.slug },
    });

    if (existing) {
      console.log(`⏭  Stage "${stage.slug}" já existe, pulando...`);
      continue;
    }

    await prisma.kanbanStage.create({
      data: stage,
    });

    console.log(`✅ Stage "${stage.slug}" criado (position: ${stage.position})`);
  }

  console.log("🎉 Seed concluído!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });