# Sistema de registro de manutenções

## Objetivo
Criar uma aplicação direta e otimizada para celular, permitindo registrar manutenções com fotos e consultar rapidamente o histórico.

## O que será construído
- Cabeçalho compacto com resumo do histórico e ação principal “Nova manutenção”.
- Formulário com título, equipamento/máquina, data, descrição detalhada e seleção de múltiplas fotos.
- Pré-visualização das fotos antes do envio, com opção de remover cada imagem.
- Validação clara dos campos, estado de envio e confirmação após salvar.
- Histórico em cards elegantes, ordenado do mais recente para o mais antigo.
- Busca instantânea por equipamento, título ou palavras da descrição.
- Galeria de fotos em cada registro e visualização em tela cheia com navegação entre imagens.
- Estados de carregamento, histórico vazio, busca sem resultados e falha de conexão.
- Layout responsivo com controles confortáveis para uso durante a manutenção em campo.

## Direção visual
- Visual técnico e contemporâneo, com superfícies claras, contraste forte e destaque em verde-sinalização.
- Tipografia objetiva, ícones funcionais e hierarquia visual que prioriza equipamento, data e serviço executado.
- Formulário aberto em painel sobreposto para manter o histórico sempre acessível.

## Dados e armazenamento
- Registros persistidos no Lovable Cloud.
- Fotos armazenadas no espaço de arquivos do projeto e vinculadas ao respectivo registro.
- Limites de tamanho e tipo de imagem, com validação antes do envio.
- Acesso direto sem conta, conforme o pedido de uma ferramenta simples; os registros serão compartilhados entre todos que acessarem o app.

## Verificação
- Testar criação de registro, envio e remoção de fotos, busca e visualização ampliada.
- Conferir o resultado em telas de celular e desktop.
- Validar carregamento, mensagens de erro e ausência de sobreposição visual.
