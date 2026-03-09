# Rádio PTT (Push-to-Talk)

## Objetivo

- Comunicação de voz de baixa latência entre integrantes do comboio sem internet.

## Conexões P2P

- Google Nearby Connections API (Bluetooth/Wi‑Fi Direct).
- Estratégia: P2P_CLUSTER para alcance em malha local.

## Captura e Streaming

- Captura de áudio com baixa taxa (ex.: 8 kHz, mono) priorizando estabilidade.
- Chunking em pacotes pequenos (~40–80 ms) para reduzir lag.
- Envio de bytes via Nearby, reprodução imediata no destino.

## Tolerância a Falhas

- Tentativas de reconexão; buffers mínimos; queda de qualidade se necessário.

## Persistência

- Log de mensagens em Realm com metadados (de/para/ts).
- Opcional: retenção limitada para economia de espaço.

## UI/UX

- FAB de microfone acessível no mapa; onLongPress para gravar; onPanEnd para enviar/parar.
- Indicadores de transmissão/recepção em alto contraste.
