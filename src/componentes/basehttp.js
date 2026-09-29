
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = 'sua_chave_secreta';

// ==========================================
// MIDDLEWARES DE SEGURANÇA (401 e 403)
// ==========================================

// Autenticação Token Bearer (401)
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      erro: { codigo: "TOKEN_AUSENTE", mensagem: "Token não fornecido" }
    });
  }

  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(401).json({
        erro: { codigo: "TOKEN_INVALIDO", mensagem: "Token inválido ou expirado" }
      });
    }
    req.usuario = usuario;
    next();
  });
}

// Autorização por Perfil de Professor (403)
function autorizarProfessor(req, res, next) {
  if (req.usuario.perfil !== 'professor') {
    return res.status(403).json({
      erro: { codigo: "ACESSO_NEGADO", mensagem: "Acesso restrito para professores" }
    });
  }
  next();
}

// ==========================================
// ROTAS E STATUS HTTP
// ==========================================

// 1. POST /api/alunos — Cadastro (201, 400, 409)
app.post('/api/alunos', (req, res) => {
  const { nome, usuario, senha } = req.body;

  // 400 Bad Request
  if (!nome || !usuario || !senha) {
    return res.status(400).json({
      erro: { codigo: "CAMPOS_OBRIGATORIOS", mensagem: "Nome, usuário e senha são obrigatórios" }
    });
  }

  // Simulação de verificação de usuário duplicado (409 Conflict)
  if (usuario === "aluno_existente") {
    return res.status(409).json({
      erro: { codigo: "USUARIO_EXISTENTE", mensagem: "O usuário já existe" }
    });
  }

  // 201 Created
  return res.status(201).json({ id: 1, nome, usuario });
});

// 2. POST /api/login — Autenticação (200, 401)
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;

  // Simulação de validação (401 Unauthorized)
  if (usuario !== "aluno1" || senha !== "123456") {
    return res.status(401).json({
      erro: { codigo: "CREDENCIAIS_INVALIDAS", mensagem: "Usuário ou senha incorretos" }
    });
  }

  const token = jwt.sign({ id: 1, perfil: "aluno" }, JWT_SECRET);

  // 200 OK
  return res.status(200).json({
    token,
    perfil: "aluno",
    id: 1,
    nome: "Aluno Exemplo"
  });
});

// 3. GET /api/materias — Listagem protegida (200, 401)
app.get('/api/materias', autenticarToken, (req, res) => {
  // 200 OK
  return res.status(200).json([
    { id: 1, nome: "Matemática" },
    { id: 2, nome: "História" }
  ]);
});

// 4. POST /api/quiz/:id/responder — Enviar resposta (200, 404, 409)
app.post('/api/quiz/:quizId/responder', autenticarToken, (req, res) => {
  const { quizId } = req.params;
  const { questaoId } = req.body;

  // Simulação de Quiz não encontrado (404 Not Found)
  if (quizId === "999") {
    return res.status(404).json({
      erro: { codigo: "QUIZ_NAO_ENCONTRADO", mensagem: "Quiz não encontrado" }
    });
  }

  // Simulação de questão já respondida (409 Conflict)
  if (questaoId === 101) {
    return res.status(409).json({
      erro: { codigo: "QUESTAO_JA_RESPONDIDA", mensagem: "Esta questão já foi respondida" }
    });
  }

  // 200 OK
  return res.status(200).json({
    correta: true,
    alternativaCorretaId: 1,
    pontosGanhos: 10,
    quizFinalizado: false,
    proximaQuestao: null
  });
});

// 5. GET /api/professor/desempenho — Rota de Professor (200, 401, 403)
app.get('/api/professor/desempenho', autenticarToken, autorizarProfessor, (req, res) => {
  // 200 OK
  return res.status(200).json([
    { alunoId: 3, nome: "João", acertos: 8, erros: 2 }
  ]);
});

// Inicialização do servidor
app.listen(3000, () => console.log('Servidor rodando na porta 3000'));