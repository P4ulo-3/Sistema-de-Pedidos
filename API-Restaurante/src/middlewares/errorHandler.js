function errorHandler(error, req, res, next) {
  console.error(error);

  // Prisma unique constraint
  if (error.code === "P2002") {
    return res.status(409).json({ message: "Registro duplicado" });
  }

  // Prisma record not found
  if (error.code === "P2025") {
    return res.status(404).json({ message: "Registro não encontrado" });
  }

  // Multer errors (file size, unexpected file, etc.)
  if (error instanceof Error && error.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Arquivo muito grande" });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({ message: "Arquivo inválido. Envie uma imagem JPG ou PNG" });
    }
    return res.status(400).json({ message: error.message });
  }

  // Always return a generic error body in production
  if (process.env.NODE_ENV !== "production") {
    return res
      .status(500)
      .json({
        message: "Erro interno do servidor",
        error: error.message,
        stack: error.stack,
      });
  }

  return res.status(500).json({ message: "Erro interno do servidor" });
}

export default errorHandler;
