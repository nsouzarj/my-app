# Sistema de Gestão Financeira Premium (Vite + PHP)

Um SaaS de gerenciamento financeiro moderno, rápido e altamente personalizável, construído com React 19 e PHP 8.

## 🚀 Tecnologias

- **Frontend**: React 19, Vite, Tailwind CSS 4, React Router 7.
- **Backend**: PHP 8.1+, MySQL.
- **UI/UX**: Lucide Icons, Recharts, Framer Motion (subtle animations).

## 🛠️ Como Rodar o Projeto

O projeto funciona com dois processos simultâneos: o servidor de desenvolvimento do Frontend (Vite) e o servidor da API (PHP).

### 1. Requisitos
- Node.js 18+
- PHP 8.1+
- MySQL 8.0

### 2. Configuração do Backend (API)
A API reside em `public/api`.
- Configure sua conexão com o banco de dados em `public/api/config.php` (ou similar).
- Inicie o servidor PHP (ou use Apache/Nginx apontando para `public`):
  ```bash
  php -S localhost:8000 -t public
  ```

### 3. Configuração do Frontend
Vá para a pasta raiz do projeto:
```bash
npm install
npm run dev
```
O frontend estará disponível em `http://localhost:5173/financas`.

## ✨ Destaques do Projeto

- **Skins Premium**: Sistema de temas dinâmicos (Midnight, Emerald, Ocean, Gold, Light).
- **Multi-tenancy**: Isolamento total de dados por organização.
- **Gestão de Vencimentos**: Controle inteligente de despesas fixas com alertas de atraso.
- **Dashboard Analítico**: Gráficos de rosca (Donut) para categorias e fluxo de caixa.
- **Relatórios**: Exportação e filtros avançados para acompanhamento financeiro.
- **Segurança**: Diálogos de confirmação em todas as ações críticas e feedback instantâneo via Toasts.

## 📁 Estrutura de Pastas

- `/frontend`: Aplicação React (Vite).
- `/public/api`: Endpoints PHP (Backend).
- `/public/api/lib`: Bibliotecas de conexão e utilitários.
- `ARCHITECTURE.md`: Detalhes técnicos da arquitetura do sistema.

---
*Desenvolvido por Antigravity (Google Deepmind) para [Nome do Usuário]*
