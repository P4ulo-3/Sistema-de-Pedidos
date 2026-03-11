import prisma from "../db.js";

async function listTables(req, res, next) {
  try {
    if (!prisma.table || typeof prisma.table.findMany !== "function") {
      return res
        .status(501)
        .json({
          message:
            "Table model not available in Prisma Client. Regenerate client and redeploy.",
        });
    }

    const tables = await prisma.table.findMany({ orderBy: { number: "asc" } });
    return res.json(tables);
  } catch (error) {
    return next(error);
  }
}

async function createTable(req, res, next) {
  try {
    if (!prisma.table || typeof prisma.table.create !== "function") {
      return res
        .status(501)
        .json({
          message:
            "Table model not available in Prisma Client. Regenerate client and redeploy.",
        });
    }
    const { number } = req.body;
    if (number == null || Number.isNaN(Number(number))) {
      return res.status(400).json({ message: "Número da mesa inválido" });
    }
    const created = await prisma.table.create({
      data: { number: Number(number) },
    });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
}

async function updateTable(req, res, next) {
  try {
    if (!prisma.table || typeof prisma.table.update !== "function") {
      return res
        .status(501)
        .json({
          message:
            "Table model not available in Prisma Client. Regenerate client and redeploy.",
        });
    }
    const { id } = req.params;
    const { status, number } = req.body;
    const data = {};
    if (status) data.status = status;
    if (number != null && !Number.isNaN(Number(number)))
      data.number = Number(number);

    const updated = await prisma.table.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function deleteTable(req, res, next) {
  try {
    if (!prisma.table || typeof prisma.table.delete !== "function") {
      return res
        .status(501)
        .json({
          message:
            "Table model not available in Prisma Client. Regenerate client and redeploy.",
        });
    }
    const { id } = req.params;
    await prisma.table.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export { listTables, createTable, updateTable, deleteTable };
