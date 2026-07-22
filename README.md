# RER DSP — Documentação

Wiki da **Data Sharing Platform (DSP)** do ecossistema **RER**. Fonte de verdade para onboarding, arquitetura e padrões dos repositórios do DSP.

## Pré-requisitos

- Python 3
- pip

## Como executar

### 1. Clonar e entrar no repositório

```bash
git clone https://github.com/Rural-Environmental-Registry/rer-dsp-docs.git
cd rer-dsp-docs
```

### 2. Criar o ambiente e instalar dependências

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

No Windows (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Subir a documentação localmente

```bash
zensical serve
```

Abra no navegador: [http://localhost:8000](http://localhost:8000)

Opções úteis:

```bash
# Abrir o navegador automaticamente
zensical serve --open

# Outra porta
zensical serve --dev-addr localhost:8080
```

O `serve` reconstrói o site ao salvar arquivos em `docs/`.

### 4. Gerar o site estático (opcional)

```bash
zensical build --clean
```

A saída fica em `site/`. Essa pasta não vai para o Git; o CI gera de novo no deploy.

## Editar o conteúdo

1. Ative o ambiente: `source .venv/bin/activate`
2. Rode `zensical serve`
3. Edite os Markdown em `docs/`
4. Ajuste navegação e título em `zensical.toml`, se precisar

## Publicação

Push em `main` dispara o workflow [Documentation](.github/workflows/docs.yml), que executa `zensical build --clean` e publica no **GitHub Pages**.

## Licença

GPL-3.0 — Rural Environmental Registry
