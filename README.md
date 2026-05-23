# IDÉLLI Flow 🚀

Este é um gerenciador de projetos, leads e cronograma (Gantt) sob medida para arquitetos e designers de móveis planejados.

## Como levar este projeto para outra máquina

Para rodar este projeto em outro computador, siga os passos abaixo:

### 1. Pré-requisito
Certifique-se de que a nova máquina tenha o **Node.js** instalado (versão 18 ou superior).
- Você pode baixar em: [nodejs.org](https://nodejs.org/)

### 2. Copiar os arquivos
Copie a pasta deste projeto (`mobili-crm` ou renomeada para `idelli-flow`) para o outro computador.
> ⚠️ **Dica:** Você **não** precisa copiar a pasta `node_modules` (se ela existir), pois ela é muito pesada e será recriada no passo 3. Copie apenas os outros arquivos.

### 3. Instalar as dependências
Abra o terminal (Prompt de Comando ou PowerShell no Windows, ou Terminal no Mac/Linux) na pasta do projeto no novo computador e execute:
```bash
npm install
```
Isso fará o download de todas as bibliotecas necessárias (como React e Tailwind CSS).

### 4. Rodar o aplicativo localmente
Após a instalação, inicie o servidor de desenvolvimento executando:
```bash
npm run dev
```
O terminal exibirá um link local, geralmente:
👉 **http://localhost:5173/**

Abra este link no navegador do novo computador para usar o **IDÉLLI Flow**!

---

## Estrutura do Projeto
- `index.html` - Página principal e configurações de SEO.
- `src/App.jsx` - Todo o código e interface do sistema (Listas, Kanban, Cronograma, Drawer de Detalhes).
- `src/index.css` - Estilos globais e fontes (Outfit) com Tailwind.
