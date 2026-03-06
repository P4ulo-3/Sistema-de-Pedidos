import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

if (!process.env.JWT_SECRET) {
  console.warn(
    "Warning: JWT_SECRET not set. Using insecure default secret for development.",
  );
}

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "1d" });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export { signToken, verifyToken };
