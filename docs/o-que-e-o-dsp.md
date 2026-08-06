# O que é o DSP

## O que é o DSP?

O **DSP (Data Sharing Platform)** é uma plataforma de aplicabilidade **genérica** para sincronizar, publicar e compartilhar dados geoespaciais a partir de qualquer fonte JDBC — ela não exige um schema ou domínio de dados específico. Na prática, o DSP nasceu e é mantido como um **complemento ao ecossistema RER** (*Rural Environmental Registry*, um bem público digital / DPG), e é nesse contexto que a documentação usa exemplos de dados ambientais rurais.

O objetivo é compartilhar dados geoespaciais de forma confiável, com base sincronizada a partir da fonte JDBC do adotante — no ecossistema RER, esses dados são tipicamente ambientais rurais, mas o mecanismo é o mesmo para qualquer outro domínio. Na prática, o DSP pega dados geoespaciais que já existem em um banco de dados de uma organização (por exemplo, um cadastro ambiental rural) e os expõe de três formas:

- **API REST** para consulta programática (busca por hierarquia territorial, totalizadores, downloads);
- **Interface web** com mapa interativo, busca e KPIs;
- **Camadas WMS** publicadas em GeoServer, para uso em outros mapas e sistemas.

## Qual problema ele resolve?

Organizações que possuem uma base de dados geoespacial (propriedades rurais, territórios, unidades administrativas) frequentemente enfrentam três problemas ao tentar compartilhar esses dados:

1. **Expor a base de origem diretamente é arriscado** — schema interno, performance e segurança do banco de produção ficam vulneráveis a consultas externas.
2. **Construir do zero uma API + frontend + publicação de mapas é caro** e repetitivo — toda organização acaba resolvendo o mesmo problema de forma isolada.
3. **Geometrias completas nem sempre devem ser expostas** publicamente por padrão — o DSP separa dados de negócio (com bounding box/centroide) de geometria completa (reservada à camada de exibição/mapas).

O DSP resolve isso com um pipeline de sincronização (ETL) que lê da fonte do adotante e grava, de forma controlada, em dois bancos de destino próprios do DSP — um para a API, outro para os mapas — sem tocar diretamente na base de origem em tempo de consulta.

## Em quais cenários deve ser utilizado?

- A organização já mantém um banco PostgreSQL/PostGIS com dados de territórios, imóveis rurais ou unidades administrativas.
- Existe a necessidade de **compartilhar esses dados com parceiros externos ou com publico geral** via mapa web ou download de arquivos.
- A organização quer uma solução **pronta para orquestrar via Docker**, sem construir API, frontend e publicação de mapas do zero.

## Este sistema é útil para minha organização?

Provavelmente sim, se:

- [x] Você já tem uma fonte de dados geoespaciais (banco JDBC) com propriedades (ou outras áreas de interesse) ou territórios.
- [x] Você precisa compartilhar esses dados com terceiros ou com publico geral — não apenas uso interno.
- [x] Você quer separar o que é exposto publicamente (negócio + bbox) do que é geometria completa (mapas).
- [X] Você não deseja utilizar o banco de dados de produção da sua aplicação para consultas externas, evitando sobrecarregá-lo, nem precisar desenvolver uma API, um frontend e toda a infraestrutura de publicação de mapas do zero.
- [x] Você tem capacidade de rodar Docker (Docker 24+ com Compose v2) na infraestrutura de destino.

Provavelmente não é o caso certo, se:

- [ ] Você não tem nenhuma base geoespacial estruturada para migrar — o DSP não cria dados, ele sincroniza e publica dados existentes.
- [ ] Sua necessidade é só uso interno, sem exposição via API, mapa ou download — nesse caso o esforço de operar 3 bancos + GeoServer + módulos pode não compensar.
- [ ] Você precisa de uma solução sem Docker (embora isso seja possível, exigirá alterações manuais nos módulos e um processo mais longo de compreensão do código) ou possui requisitos de infraestrutura significativamente diferentes dos documentados neste guia.

!!! tip "Próximo passo"
    Se o cenário faz sentido, veja os [módulos do DSP](modulos.md) para entender as peças, ou vá direto para uma [demo local](getting-started.md).
