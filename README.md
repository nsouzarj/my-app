# Sistema de Gestão Financeira Premium (Vite + PHP)

Um sistema SaaS de gerenciamento financeiro moderno, rápido e altamente personalizável, construído com React 19 e PHP 8.

## 🚀 Tecnologias

- **Frontend**: React 19, Vite, Tailwind CSS 4, React Router 7.
- **Backend**: PHP 8.1+, MySQL.
- **UI/UX**: Lucide Icons, Recharts, Animações Framer Motion.

## 🏗️ Arquitetura do Sistema

```mermaid
graph TD
    User((Usuário))
    
    subgraph "Frontend (React 19 + Vite)"
        UI[Componentes React / Tailwind 4]
        Router[React Router 7]
        ThemeCont[ThemeContext - Temas Dinâmicos]
        AuthCont[AuthContext - Autenticação]
    end
    
    subgraph "Backend (PHP 8.x + MySQL)"
        API[Endpoints PHP - public/api]
        AuthServ[Serviço de Autenticação]
        Mailer[Serviço de E-mail - SMTP Direto]
        TransServ[Serviço de Transações]
        DB[(Banco de Dados - MySQL)]
    end
    
    User --> UI
    UI --> Router
    UI --> ThemeCont
    UI --> AuthCont
    AuthCont --> AuthServ
    AuthServ --> Mailer
    UI --> API
    API --> DB
    AuthServ --> DB
```

## 📊 Modelo de Dados

```mermaid
erDiagram
    USERS ||--o{ ORGANIZATIONS : dono_de
    ORGANIZATIONS ||--o{ ACCOUNTS : possui
    ORGANIZATIONS ||--o{ CATEGORIES : define
    ORGANIZATIONS ||--o{ TRANSACTIONS : contem
    ACCOUNTS ||--o{ TRANSACTIONS : registra
    CATEGORIES ||--o{ TRANSACTIONS : classifica
    
    USERS {
        string id PK "Identificador Único"
        string email "E-mail do Usuário"
        string password_hash "Senha Criptografada"
        string fullName "Nome Completo"
        string reset_token "Token de Recuperação"
        datetime reset_expiry "Expiração do Token"
    }
    
    ORGANIZATIONS {
        string organizationId PK "ID da Organização"
        string name "Nome da Empresa/Conta"
        string ownerId FK "ID do Dono"
    }
    
    ACCOUNTS {
        string id PK "ID da Conta"
        string organizationId FK "ID da Organização"
        string name "Nome da Conta (ex: Banco XYZ)"
        string type "Tipo (Corrente, Poupança, etc)"
        decimal balance "Saldo Atual"
    }
    
    TRANSACTIONS {
        string id PK "ID da Transação"
        string organizationId FK "ID da Organização"
        string accountId FK "ID da Conta"
        string categoryId FK "ID da Categoria"
        decimal amount "Valor"
        string description "Descrição"
        date date "Data do Lançamento"
        string type "Tipo (Receita ou Despesa)"
        date due_date "Vencimento"
        date payment_date "Data de Pagamento"
        string status "Status (pago ou pendente)"
        boolean is_fixed "É Despesa Fixa?"
    }
    
    CATEGORIES {
        string id PK "ID da Categoria"
        string organizationId FK "ID da Organização"
        string name "Nome da Categoria"
        string color "Cor do Ícone"
        string type "Tipo (Receita, Despesa ou Ambos)"
    }
```

## 🛠️ Como Rodar o Projeto

O projeto funciona com dois processos simultâneos: o servidor de desenvolvimento do Frontend (Vite) e o servidor da API (PHP).

### 1. Requisitos
- Node.js 18+
- PHP 8.1+
- MySQL 8.0

### 2. Configuração do Backend (API)
A API reside em `public/api`.
- Configure sua conexão com o banco de dados em `public/api/db.php`.
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
- **Multi-tenancy**: Isolamento total de dados por organização via backend PHP.
- **Recuperação de Senha**: Sistema seguro de "Esqueci minha senha" com SMTP direto e tokens de segurança.
- **Gestão de Vencimentos**: Controle inteligente de despesas fixas com alertas de atraso.
- **Filtros Avançados**: Visualização segmentada por Receitas, Despesas ou Ambos nas transações.
- **Dashboard Analítico**: Gráficos analíticos para categorias e fluxo de caixa.
- **Segurança**: Proteção contra Host Header Injection, diálogos de confirmação em ações críticas e feedback instantâneo via Toasts.
- **Internacionalização (PT-BR)**: Formatação automática de moeda e decimais para o padrão brasileiro.

## 📁 Estrutura de Pastas

- `/frontend`: Aplicação React (Vite).
- `/public/api`: Endpoints PHP (Backend).
- `/public/api/auth`: Módulos de autenticação e segurança.
- `ARCHITECTURE.md`: Documentação técnica completa.

---
*Desenvolvido por Antigravity (Google Deepmind) para o usuário*
