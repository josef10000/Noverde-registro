<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/764c464a-6ef4-407d-8079-cfe6869a3634

# RNV Gestão - Dashboard Operacional

Este é um dashboard avançado para gestão de acordos, desenvolvido com React, Tailwind CSS e Firebase.

## 🚀 Novidades na Versão Atual

- **Refatoração Completa**: Código modularizado em componentes reutilizáveis (`src/components`).
- **Reset Mensal e Histórico**: O dashboard agora "reseta" automaticamente ao início de cada mês, com um seletor de histórico para visualizar e exportar dados de meses anteriores.
- **Gráficos Dinâmicos**: Visualização de performance meta vs. realizado usando `Recharts`.
- **Máscaras Inteligentes**: Formatação automática de CPF e Telefone para melhor UX.
- **CI/CD Integrado**: Validação automática de tipos e build via GitHub Actions.

## 📂 Estrutura do Projeto

- `src/components/auth`: Lógica e interface de login/cadastro.
- `src/components/dashboard`: Componentes do painel principal e gráficos.
- `src/components/modals`: Modais de cadastro, metas e histórico.
- `src/utils`: Funções utilitárias e máscaras.

## 🛠️ Como Executar Localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   `npm install`
2. Configure as variáveis de ambiente no arquivo `.env.local`.
3. Inicie o servidor de desenvolvimento:
   `npm run dev`

## 🛡️ CI/CD

O projeto conta com GitHub Actions que valida automaticamente:
- Verificação de tipos TypeScript (`tsc`).
- Sucesso do Build de produção.

