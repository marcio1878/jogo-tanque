# ==========================================
#  BATALHA DE TANQUES - Servidor em Flask
#  Este arquivo roda na VM e entrega o jogo
#  para quem acessar pelo navegador.
# ==========================================

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

ARQUIVO_RANKING = "ranking.txt"


# Lê o arquivo ranking.txt e devolve uma lista com [nome, pontos]
def ler_ranking():
    ranking = []
    try:
        arquivo = open(ARQUIVO_RANKING, "r", encoding="utf-8")
        for linha in arquivo:
            partes = linha.strip().split(";")
            if len(partes) == 2:
                nome = partes[0]
                pontos = int(partes[1])
                ranking.append([nome, pontos])
        arquivo.close()
    except FileNotFoundError:
        # Se o arquivo ainda não existe, o ranking começa vazio
        pass

    # Ordena do maior para o menor número de pontos
    ranking.sort(key=lambda item: item[1], reverse=True)
    return ranking


# Salva um novo resultado no final do arquivo
def salvar_resultado(nome, pontos):
    arquivo = open(ARQUIVO_RANKING, "a", encoding="utf-8")
    arquivo.write(nome + ";" + str(pontos) + "\n")
    arquivo.close()


# Página principal: mostra o jogo
@app.route("/")
def inicio():
    return render_template("index.html")


# Devolve os 5 melhores do ranking (o jogo usa isso no fim da partida)
@app.route("/ranking")
def ranking():
    top5 = ler_ranking()[:5]
    return jsonify(top5)


# Recebe o nome e os pontos do jogador quando a partida acaba
@app.route("/salvar", methods=["POST"])
def salvar():
    dados = request.get_json()
    nome = str(dados["nome"]).strip()[:15]   # no máximo 15 letras
    pontos = int(dados["pontos"])

    if nome == "":
        nome = "Anônimo"

    nome = nome.replace(";", "")  # o ; é usado como separador no arquivo
    salvar_resultado(nome, pontos)
    return jsonify({"ok": True})


# host="0.0.0.0" deixa outros computadores da rede acessarem a VM
# port=5000 é a porta que o ngrok vai usar
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
