import bcrypt from "bcryptjs";
import prisma from "../db.js";
import { signToken } from "../services/jwtService.js";

const allowedRoles = ["waiter", "kitchen", "admin"];

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email e password são obrigatórios" });
    }

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Role inválida" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email já cadastrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: role || "waiter",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });
    return res.status(201).json({ user, token });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    console.log(`Auth login attempt: ${email}`);
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email e password são obrigatórios" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });
    console.log(`Auth login success: ${email}`);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return next(error);
  }
}

export { register, login };
