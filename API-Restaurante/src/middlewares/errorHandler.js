function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.code === "P2002") {
    return res.status(409).json({ message: "Registro duplicado" });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ message: "Registro não encontrado" });
  }

  return res.status(500).json({ message: "Erro interno do servidor" });
}

export default errorHandler;
