import bcrypt from "bcryptjs";
import prisma from "../db.js";

async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, password: true, role: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email e password são obrigatórios" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email já cadastrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: passwordHash, role: role || "waiter" },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { password } = req.body; // optional - admin can provide a new password

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Usuário não encontrado" });

    // generate a random password if none provided
    const newPassword = password || Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });

    // return the plain password once so admin can copy it (cannot be recovered later)
    return res.json({ password: newPassword });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Usuário não encontrado" });

    // Prevent deleting yourself
    if (req.user && req.user.id === id) {
      return res
        .status(400)
        .json({ message: "Não é possível excluir a si mesmo" });
    }

    await prisma.user.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export { listUsers, createUser, resetPassword, deleteUser };
