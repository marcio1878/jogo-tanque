// ==========================================
//  BATALHA DE TANQUES - lógica do jogo
//  Roda no navegador de quem acessa o site.
//
//  Modo 1 jogador: você contra tanques inimigos
//  Modo 2 jogadores: X1 entre P1 (WASD) e P2 (setas)
// ==========================================

// Pegando o canvas (a "tela" onde desenhamos o jogo)
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");

const LARGURA = tela.width;
const ALTURA = tela.height;
const TAMANHO_TANQUE = 36;

// ----- Teclas de cada jogador -----
// No modo 1 jogador dá para usar WASD ou as setas
const CONTROLE_SOLO = {
    cima: ["KeyW", "ArrowUp"],
    baixo: ["KeyS", "ArrowDown"],
    esquerda: ["KeyA", "ArrowLeft"],
    direita: ["KeyD", "ArrowRight"],
    tiro: ["Space"]
};

const CONTROLE_P1 = {
    cima: ["KeyW"],
    baixo: ["KeyS"],
    esquerda: ["KeyA"],
    direita: ["KeyD"],
    tiro: ["Space"]
};

const CONTROLE_P2 = {
    cima: ["ArrowUp"],
    baixo: ["ArrowDown"],
    esquerda: ["ArrowLeft"],
    direita: ["ArrowRight"],
    tiro: ["Enter", "NumpadEnter"]
};

// ----- Variáveis do jogo -----
let modo = 1;        // 1 ou 2 jogadores
let jogadores = [];  // lista com 1 ou 2 tanques de jogador
let inimigos = [];
let tiros = [];
let explosoes = [];
let pontos;
let nivel;
let estado = "menu"; // "menu", "jogando", "pausado" ou "fim"
let tempoProximoInimigo;

// Guarda quais teclas estão apertadas agora
let teclas = {};

// Paredes do mapa: x, y, largura, altura
const paredes = [
    { x: 120, y: 120, w: 140, h: 30 },
    { x: 540, y: 120, w: 140, h: 30 },
    { x: 370, y: 200, w: 60,  h: 140 },
    { x: 120, y: 380, w: 30,  h: 110 },
    { x: 650, y: 380, w: 30,  h: 110 },
    { x: 250, y: 300, w: 80,  h: 30 },
    { x: 470, y: 300, w: 80,  h: 30 }
];

// Lugares onde os inimigos aparecem (parte de cima do mapa)
const pontosDeEntrada = [
    { x: 40, y: 40 },
    { x: 400, y: 40 },
    { x: 760, y: 40 }
];


// ==========================================
//  Criar um tanque de jogador
// ==========================================
function criarJogador(nome, x, y, angulo, corCorpo, corEsteira, controle) {
    return {
        nome: nome,
        x: x,
        y: y,
        angulo: angulo,
        velocidade: 2.5,
        vidas: 3,
        recargaTiro: 0,     // tempo até poder atirar de novo
        invencivel: 0,      // tempo piscando depois de levar tiro
        corCorpo: corCorpo,
        corEsteira: corEsteira,
        controle: controle
    };
}


// ==========================================
//  Começar / reiniciar o jogo
// ==========================================
function iniciarJogo(modoEscolhido) {
    modo = modoEscolhido;

    if (modo === 1) {
        jogadores = [
            criarJogador("Você", 400, 510, -Math.PI / 2, "#6b8e23", "#2f3f12", CONTROLE_SOLO)
        ];
    } else {
        // P1 começa embaixo à esquerda, P2 em cima à direita
        jogadores = [
            criarJogador("P1", 60, 510, -Math.PI / 2, "#6b8e23", "#2f3f12", CONTROLE_P1),
            criarJogador("P2", 740, 50, Math.PI / 2, "#1e6fbf", "#0d2f52", CONTROLE_P2)
        ];
    }

    inimigos = [];
    tiros = [];
    explosoes = [];
    pontos = 0;
    nivel = 1;
    tempoProximoInimigo = 60;
    estado = "jogando";

    esconderCaixas();
    atualizarPainel();
}

function esconderCaixas() {
    document.getElementById("menu").classList.add("escondido");
    document.getElementById("fimDeJogo").classList.add("escondido");
    document.getElementById("fimX1").classList.add("escondido");
}

function voltarAoMenu() {
    estado = "menu";
    esconderCaixas();
    document.getElementById("menu").classList.remove("escondido");
    document.getElementById("painel").textContent = "";
}


// ==========================================
//  Teclado
// ==========================================
document.addEventListener("keydown", function (evento) {
    // Se estiver digitando o nome, não mexe no jogo
    if (document.activeElement.id === "nome") {
        return;
    }

    teclas[evento.code] = true;

    // No menu dá para escolher apertando 1 ou 2
    if (estado === "menu") {
        if (evento.code === "Digit1" || evento.code === "Numpad1") {
            iniciarJogo(1);
        }
        if (evento.code === "Digit2" || evento.code === "Numpad2") {
            iniciarJogo(2);
        }
    }

    if (evento.code === "KeyP") {
        if (estado === "jogando") {
            estado = "pausado";
        } else if (estado === "pausado") {
            estado = "jogando";
        }
    }

    // Impede a página de rolar e o Enter de apertar botões durante o jogo
    if (estado === "jogando" || estado === "pausado") {
        if (evento.code === "Space" || evento.code === "Enter" || evento.code.startsWith("Arrow")) {
            evento.preventDefault();
        }
    }
});

document.addEventListener("keyup", function (evento) {
    teclas[evento.code] = false;
});

// Verifica se alguma tecla da lista está apertada
function apertou(listaDeTeclas) {
    for (let i = 0; i < listaDeTeclas.length; i++) {
        if (teclas[listaDeTeclas[i]]) {
            return true;
        }
    }
    return false;
}


// ==========================================
//  Funções de colisão
// ==========================================

// Transforma um tanque em um retângulo (para testar colisão)
function retanguloDoTanque(tanque) {
    return {
        x: tanque.x - TAMANHO_TANQUE / 2,
        y: tanque.y - TAMANHO_TANQUE / 2,
        w: TAMANHO_TANQUE,
        h: TAMANHO_TANQUE
    };
}

// Verifica se dois retângulos estão se encostando
function colide(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

// Verifica se um tanque pode ficar na posição (x, y)
function posicaoLivre(tanque, x, y) {
    const r = {
        x: x - TAMANHO_TANQUE / 2,
        y: y - TAMANHO_TANQUE / 2,
        w: TAMANHO_TANQUE,
        h: TAMANHO_TANQUE
    };

    // Saiu da tela?
    if (r.x < 0 || r.y < 0 || r.x + r.w > LARGURA || r.y + r.h > ALTURA) {
        return false;
    }

    // Bateu em alguma parede?
    for (let i = 0; i < paredes.length; i++) {
        if (colide(r, paredes[i])) {
            return false;
        }
    }

    // Bateu em outro tanque?
    const todos = inimigos.concat(jogadores);
    for (let i = 0; i < todos.length; i++) {
        if (todos[i] !== tanque && colide(r, retanguloDoTanque(todos[i]))) {
            return false;
        }
    }

    return true;
}


// ==========================================
//  Tiros
// ==========================================
// "dono" é quem atirou: um jogador ou null (inimigo)
function atirar(tanque, dono) {
    // O tiro sai da ponta do canhão
    const ponta = TAMANHO_TANQUE / 2 + 6;
    const velocidadeTiro = dono !== null ? 7 : 4;

    tiros.push({
        x: tanque.x + Math.cos(tanque.angulo) * ponta,
        y: tanque.y + Math.sin(tanque.angulo) * ponta,
        vx: Math.cos(tanque.angulo) * velocidadeTiro,
        vy: Math.sin(tanque.angulo) * velocidadeTiro,
        dono: dono
    });
}

function criarExplosao(x, y, cor) {
    explosoes.push({ x: x, y: y, raio: 5, cor: cor });
}


// ==========================================
//  Atualizar os jogadores
// ==========================================
function atualizarJogador(jogador) {
    // Jogador sem vidas não se mexe mais
    if (jogador.vidas <= 0) {
        return;
    }

    const c = jogador.controle;
    let dx = 0;
    let dy = 0;

    // Só anda em uma direção por vez (como os jogos de tanque antigos)
    if (apertou(c.cima)) {
        dy = -1;
    } else if (apertou(c.baixo)) {
        dy = 1;
    } else if (apertou(c.esquerda)) {
        dx = -1;
    } else if (apertou(c.direita)) {
        dx = 1;
    }

    if (dx !== 0 || dy !== 0) {
        // Math.atan2 calcula o ângulo da direção em que estamos andando
        jogador.angulo = Math.atan2(dy, dx);

        const novoX = jogador.x + dx * jogador.velocidade;
        const novoY = jogador.y + dy * jogador.velocidade;

        if (posicaoLivre(jogador, novoX, novoY)) {
            jogador.x = novoX;
            jogador.y = novoY;
        }
    }

    // Atirar
    if (jogador.recargaTiro > 0) {
        jogador.recargaTiro--;
    }
    if (apertou(c.tiro) && jogador.recargaTiro === 0) {
        atirar(jogador, jogador);
        jogador.recargaTiro = 20;   // espera 20 quadros para o próximo tiro
    }

    if (jogador.invencivel > 0) {
        jogador.invencivel--;
    }
}


// ==========================================
//  Inimigos (só no modo 1 jogador)
// ==========================================
function criarInimigo() {
    // Escolhe um ponto de entrada aleatório
    const indice = Math.floor(Math.random() * pontosDeEntrada.length);
    const entrada = pontosDeEntrada[indice];

    const novo = {
        x: entrada.x,
        y: entrada.y,
        angulo: Math.PI / 2,        // virado para baixo
        velocidade: 1 + nivel * 0.2,
        tempoTrocarDirecao: 60,
        recargaTiro: 60 + Math.floor(Math.random() * 60)
    };

    // Só cria se o lugar estiver livre
    if (posicaoLivre(novo, novo.x, novo.y)) {
        inimigos.push(novo);
    }
}

// Escolhe uma nova direção para o inimigo.
// Na maioria das vezes ele vai na direção do jogador.
function escolherDirecao(inimigo) {
    const direcoes = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // direita, baixo, esquerda, cima
    const alvo = jogadores[0];

    if (Math.random() < 0.6) {
        const distX = alvo.x - inimigo.x;
        const distY = alvo.y - inimigo.y;

        if (Math.abs(distX) > Math.abs(distY)) {
            inimigo.angulo = distX > 0 ? 0 : Math.PI;
        } else {
            inimigo.angulo = distY > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
    } else {
        const sorteio = Math.floor(Math.random() * 4);
        inimigo.angulo = direcoes[sorteio];
    }

    inimigo.tempoTrocarDirecao = 60 + Math.floor(Math.random() * 90);
}

function atualizarInimigos() {
    // Aparece um inimigo novo de tempos em tempos
    const maximoInimigos = 2 + nivel;
    tempoProximoInimigo--;
    if (tempoProximoInimigo <= 0 && inimigos.length < maximoInimigos) {
        criarInimigo();
        tempoProximoInimigo = Math.max(60, 180 - nivel * 15);
    }

    for (let i = 0; i < inimigos.length; i++) {
        const inimigo = inimigos[i];

        // Anda para frente
        const novoX = inimigo.x + Math.cos(inimigo.angulo) * inimigo.velocidade;
        const novoY = inimigo.y + Math.sin(inimigo.angulo) * inimigo.velocidade;

        if (posicaoLivre(inimigo, novoX, novoY)) {
            inimigo.x = novoX;
            inimigo.y = novoY;
        } else {
            // Bateu em algo: troca de direção
            escolherDirecao(inimigo);
        }

        inimigo.tempoTrocarDirecao--;
        if (inimigo.tempoTrocarDirecao <= 0) {
            escolherDirecao(inimigo);
        }

        // Atira de tempos em tempos
        inimigo.recargaTiro--;
        if (inimigo.recargaTiro <= 0) {
            atirar(inimigo, null);
            inimigo.recargaTiro = Math.max(50, 130 - nivel * 10) + Math.floor(Math.random() * 60);
        }
    }
}


// ==========================================
//  Atualizar os tiros e ver se acertaram algo
// ==========================================
function atualizarTiros() {
    // Percorre de trás para frente porque vamos remover itens da lista
    for (let i = tiros.length - 1; i >= 0; i--) {
        const tiro = tiros[i];
        tiro.x += tiro.vx;
        tiro.y += tiro.vy;

        const retTiro = { x: tiro.x - 3, y: tiro.y - 3, w: 6, h: 6 };
        let remover = false;

        // Saiu da tela
        if (tiro.x < 0 || tiro.x > LARGURA || tiro.y < 0 || tiro.y > ALTURA) {
            remover = true;
        }

        // Bateu na parede
        for (let p = 0; p < paredes.length; p++) {
            if (!remover && colide(retTiro, paredes[p])) {
                remover = true;
                criarExplosao(tiro.x, tiro.y, "#aaaaaa");
            }
        }

        // Tiro de jogador acertou um inimigo? (modo 1)
        if (tiro.dono !== null) {
            for (let j = inimigos.length - 1; j >= 0; j--) {
                if (!remover && colide(retTiro, retanguloDoTanque(inimigos[j]))) {
                    criarExplosao(inimigos[j].x, inimigos[j].y, "#ff8800");
                    inimigos.splice(j, 1);
                    remover = true;
                    pontos += 10;
                    nivel = 1 + Math.floor(pontos / 100);
                    atualizarPainel();
                }
            }
        }

        // Tiro acertou algum jogador?
        for (let j = 0; j < jogadores.length; j++) {
            const jogador = jogadores[j];
            // O tiro não acerta quem atirou
            if (!remover && tiro.dono !== jogador && jogador.vidas > 0 &&
                colide(retTiro, retanguloDoTanque(jogador))) {
                remover = true;
                if (jogador.invencivel === 0) {
                    jogadorAtingido(jogador);
                }
            }
        }

        if (remover) {
            tiros.splice(i, 1);
        }
    }
}

function jogadorAtingido(jogador) {
    criarExplosao(jogador.x, jogador.y, "#ff3333");
    jogador.vidas--;
    atualizarPainel();

    if (jogador.vidas <= 0) {
        fimDeJogo(jogador);
    } else {
        jogador.invencivel = 120;   // 2 segundos piscando
    }
}

function atualizarExplosoes() {
    for (let i = explosoes.length - 1; i >= 0; i--) {
        explosoes[i].raio += 1.5;
        if (explosoes[i].raio > 30) {
            explosoes.splice(i, 1);
        }
    }
}


// ==========================================
//  Desenho
// ==========================================
function desenharTanque(tanque, corCorpo, corEsteira) {
    ctx.save();
    ctx.translate(tanque.x, tanque.y);
    ctx.rotate(tanque.angulo);

    const t = TAMANHO_TANQUE;

    // Esteiras (as "rodas" do tanque)
    ctx.fillStyle = corEsteira;
    ctx.fillRect(-t / 2, -t / 2, t, 8);
    ctx.fillRect(-t / 2, t / 2 - 8, t, 8);

    // Corpo
    ctx.fillStyle = corCorpo;
    ctx.fillRect(-t / 2 + 3, -t / 2 + 7, t - 6, t - 14);

    // Torre (círculo em cima)
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = corEsteira;
    ctx.fill();

    // Canhão
    ctx.fillRect(0, -3, t / 2 + 6, 6);

    ctx.restore();
}

function desenhar() {
    // Limpa a tela
    ctx.fillStyle = "#3b4a2a";
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    // Paredes
    for (let i = 0; i < paredes.length; i++) {
        const p = paredes[i];
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#5a3a1a";
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // No menu só desenha o mapa
    if (estado === "menu") {
        return;
    }

    // Jogadores (piscam quando estão invencíveis)
    for (let i = 0; i < jogadores.length; i++) {
        const j = jogadores[i];
        const piscando = j.invencivel > 0 && Math.floor(j.invencivel / 6) % 2 === 0;
        if (!piscando && j.vidas > 0) {
            desenharTanque(j, j.corCorpo, j.corEsteira);

            // No X1 escreve P1 / P2 em cima do tanque
            if (modo === 2) {
                ctx.fillStyle = "white";
                ctx.font = "bold 14px Arial";
                ctx.textAlign = "center";
                ctx.fillText(j.nome, j.x, j.y - 24);
            }
        }
    }

    // Inimigos
    for (let i = 0; i < inimigos.length; i++) {
        desenharTanque(inimigos[i], "#a52a2a", "#4a1010");
    }

    // Tiros
    for (let i = 0; i < tiros.length; i++) {
        ctx.beginPath();
        ctx.arc(tiros[i].x, tiros[i].y, 4, 0, Math.PI * 2);
        if (tiros[i].dono === null) {
            ctx.fillStyle = "#ff6666";       // tiro de inimigo
        } else if (tiros[i].dono.nome === "P2") {
            ctx.fillStyle = "#66ccff";       // tiro do P2
        } else {
            ctx.fillStyle = "#ffff66";       // tiro do P1 / solo
        }
        ctx.fill();
    }

    // Explosões
    for (let i = 0; i < explosoes.length; i++) {
        const e = explosoes[i];
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.raio, 0, Math.PI * 2);
        ctx.strokeStyle = e.cor;
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Mensagem de pausa
    if (estado === "pausado") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, LARGURA, ALTURA);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PAUSADO", LARGURA / 2, ALTURA / 2);
    }
}

function atualizarPainel() {
    const painel = document.getElementById("painel");

    if (modo === 1) {
        painel.innerHTML =
            "Pontos: <b>" + pontos + "</b> &nbsp;&nbsp; " +
            "Vidas: <b>" + jogadores[0].vidas + "</b> &nbsp;&nbsp; " +
            "Nível: <b>" + nivel + "</b>";
    } else {
        painel.innerHTML =
            "<span class='verde'>P1</span> Vidas: <b>" + jogadores[0].vidas + "</b>" +
            " &nbsp;&nbsp; X &nbsp;&nbsp; " +
            "<span class='azul'>P2</span> Vidas: <b>" + jogadores[1].vidas + "</b>";
    }
}


// ==========================================
//  Fim de jogo
// ==========================================
function fimDeJogo(perdedor) {
    estado = "fim";

    if (modo === 1) {
        document.getElementById("pontosFinal").textContent = pontos;
        document.getElementById("fimDeJogo").classList.remove("escondido");
        document.getElementById("botaoSalvar").disabled = false;
        document.getElementById("nome").focus();
        carregarRanking();
    } else {
        // Quem venceu é o outro jogador
        let vencedor = jogadores[0];
        if (perdedor === jogadores[0]) {
            vencedor = jogadores[1];
        }
        const texto = document.getElementById("textoVencedor");
        if (vencedor.nome === "P1") {
            texto.textContent = "JOGADOR 1 VENCEU!";
            texto.className = "verde";
        } else {
            texto.textContent = "JOGADOR 2 VENCEU!";
            texto.className = "azul";
        }
        document.getElementById("fimX1").classList.remove("escondido");
    }
}


// ==========================================
//  Ranking (conversa com o Flask) - só no modo 1
// ==========================================

// Pede o ranking para o servidor (rota /ranking do app.py)
function carregarRanking() {
    fetch("/ranking")
        .then(function (resposta) { return resposta.json(); })
        .then(function (lista) {
            const ol = document.getElementById("listaRanking");
            ol.innerHTML = "";
            for (let i = 0; i < lista.length; i++) {
                const li = document.createElement("li");
                li.textContent = lista[i][0] + " - " + lista[i][1] + " pontos";
                ol.appendChild(li);
            }
        });
}

// Envia o nome e os pontos para o servidor (rota /salvar do app.py)
document.getElementById("botaoSalvar").addEventListener("click", function () {
    const nome = document.getElementById("nome").value;
    this.disabled = true;   // evita salvar duas vezes

    fetch("/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome, pontos: pontos })
    }).then(function () {
        carregarRanking();
    });
});


// ==========================================
//  Botões
// ==========================================
document.getElementById("botao1Jogador").addEventListener("click", function () {
    this.blur();
    iniciarJogo(1);
});

document.getElementById("botao2Jogadores").addEventListener("click", function () {
    this.blur();
    iniciarJogo(2);
});

document.getElementById("botaoJogar").addEventListener("click", function () {
    this.blur();
    iniciarJogo(1);
});

document.getElementById("botaoRevanche").addEventListener("click", function () {
    this.blur();
    iniciarJogo(2);
});

// Os dois botões "Menu" (fim do modo 1 e fim do X1)
const botoesMenu = document.getElementsByClassName("botaoMenu");
for (let i = 0; i < botoesMenu.length; i++) {
    botoesMenu[i].addEventListener("click", function () {
        this.blur();
        voltarAoMenu();
    });
}


// ==========================================
//  Loop principal: roda umas 60 vezes por segundo
// ==========================================
function loop() {
    if (estado === "jogando") {
        for (let i = 0; i < jogadores.length; i++) {
            atualizarJogador(jogadores[i]);
        }
        if (modo === 1) {
            atualizarInimigos();
        }
        atualizarTiros();
    }
    atualizarExplosoes();
    desenhar();

    requestAnimationFrame(loop);
}

loop();
