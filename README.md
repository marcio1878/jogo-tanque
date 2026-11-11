# Batalha de Tanques

Jogo de tanque single-player feito em **Python (Flask)** + **HTML/JavaScript**,
hospedado em uma máquina virtual Ubuntu e publicado na internet com o **ngrok**.

Projeto do case mod em formato de tanque (impresso em 3D).

## Como jogar
Ao abrir o jogo aparece um menu para escolher o modo (clique ou aperte 1 / 2).

**1 jogador:** você contra os tanques inimigos.
- Mover: setas ou W A S D | Atirar: ESPAÇO

Cada tanque inimigo destruído vale 10 pontos. A cada 100 pontos o nível sobe
e os inimigos ficam mais rápidos. São 3 vidas. No fim da partida dá para
salvar o nome no ranking (guardado no servidor, no arquivo `ranking.txt`).

**2 jogadores (X1):** um contra o outro no mesmo teclado.
- P1 (verde): W A S D + ESPAÇO
- P2 (azul): setas + ENTER

Cada um tem 3 vidas. Quem perder todas primeiro perde a partida.

**Pausar:** P

## Estrutura do projeto
```
jogo-tanque/
├── app.py              -> servidor Flask (rotas /, /ranking e /salvar)
├── requirements.txt    -> bibliotecas Python necessárias
├── templates/
│   └── index.html      -> página do jogo
└── static/
    ├── jogo.js         -> lógica do jogo (movimento, tiros, inimigos)
    └── estilo.css      -> visual da página
```

---

## Passo a passo para rodar na VM (Windows)

### 1. Instalar o Python e o Git
- Python: https://www.python.org/downloads/
  **IMPORTANTE:** na primeira tela do instalador marque **"Add python.exe to PATH"**.
- Git: https://git-scm.com/download/win (só ir clicando em Next)

Depois de instalar, feche e abra o terminal de novo.

### 2. Baixar o projeto e instalar o Flask (no PowerShell ou Prompt de Comando)
```
git clone https://github.com/marcio1878/jogo-tanque.git
cd jogo-tanque
pip install -r requirements.txt
```

### 3. Ligar o servidor
```
python app.py
```
Se o Windows mostrar um aviso do **Firewall**, clique em **Permitir acesso**.
Teste no navegador da VM: `http://localhost:5000`

### 4. ngrok no Windows
- Baixe em https://ngrok.com/download (versão Windows), extraia o `ngrok.exe`
  e coloque dentro da pasta `jogo-tanque`.
- Em **outro** terminal, dentro da pasta `jogo-tanque`:
```
.\ngrok config add-authtoken COLE_SEU_TOKEN_AQUI
.\ngrok http 5000
```

---

## Passo a passo para rodar na VM (Ubuntu)

### 1. Instalar o que precisa
```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git
```

### 2. Baixar o projeto do GitHub
```bash
git clone https://github.com/SEU_USUARIO/jogo-tanque.git
cd jogo-tanque
```

### 3. Criar o ambiente virtual e instalar o Flask
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Ligar o servidor
```bash
python3 app.py
```
Teste no navegador da própria VM: `http://localhost:5000`

Deixe esse terminal aberto. Para desligar: `Ctrl + C`.

---

## Publicar na internet com o ngrok

### 1. Criar a conta
Crie uma conta grátis em https://ngrok.com e copie o seu **Authtoken**
(fica em *Your Authtoken* no painel).

### 2. Instalar o ngrok na VM (em outro terminal)
```bash
sudo snap install ngrok
ngrok config add-authtoken COLE_SEU_TOKEN_AQUI
```

### 3. Abrir o túnel para a porta 5000
```bash
ngrok http 5000
```

Vai aparecer uma linha assim:
```
Forwarding   https://xxxx-xxxx.ngrok-free.app -> http://localhost:5000
```
Esse link `https://...ngrok-free.app` é o que vocês abrem em qualquer
computador ou celular para mostrar o jogo.

> Na conta grátis, a primeira vez que alguém abre o link aparece uma página
> de aviso do ngrok. É só clicar em **Visit Site**.

> Os **dois terminais** precisam ficar abertos durante a apresentação:
> um com `python3 app.py` e outro com `ngrok http 5000`.

---

## Como funciona (para explicar na apresentação)
1. A **VM** roda o servidor **Flask** na porta 5000.
2. O **ngrok** cria um túnel seguro (HTTPS) da internet até essa porta,
   sem precisar mexer no roteador.
3. Quem acessa o link recebe o `index.html`, o `jogo.js` e o `estilo.css`.
4. O jogo roda no navegador do jogador. Quando a partida acaba, o JavaScript
   manda o nome e os pontos para a rota `/salvar` do Flask, que grava no
   arquivo `ranking.txt`.
