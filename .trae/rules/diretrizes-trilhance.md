# Regras Trae — Trilhença (OFF‑ROAD SYNC)

Projeto: Trilhença — Super App de Expedição Off‑Road.

## 1) Pilares Técnicos
- Conectividade zero: funcionamento pleno sem internet; banco local Realm; comunicação Mesh (Bridgefy/Nearby).
- Navegação offline: MapLibre/Mapbox com tiles offline (.mbtiles) e OSM.
- OBD‑II (ELM327): monitoramento de temperatura, combustível e bateria via Bluetooth.
- PTT local: Push‑to‑Talk via Bluetooth/Wi‑Fi Direct.

## 2) Modo Condução — UI/UX
- Dark Mode obrigatório.
- Acessibilidade crítica: alvos ≥ 48dp, alto contraste, legibilidade sob trepidação.
- Feedback visual: semáforo (Verde/Amarelo/Vermelho) para telemetria e alertas de comboio.

## 3) Regras de Implementação
- Offline‑first: nunca depender de serviços online sem fallback robusto.
- Mesh: payload mínimo (JSON compactado/Protobuf) para SOS e mensagens.
- SOS: botão capaz de enviar SMS nativo com coordenadas atuais.
- OBD2 Parser (fórmulas):
  - Coolant Temp = (A − 40)
  - Fuel Level = (A × 100 / 255)
  - Battery = ((A × 256) + B) / 1000

## 4) Mapa e Navegação
- Polyline dinâmica: ao receber GPS, encontrar ponto mais próximo na rota e “trimmar” o histórico; exibir somente o trecho à frente.
- Interpolação de movimento: nunca mover o marcador instantaneamente; usar animação (linear/Bezier) entre fixes (≈1 Hz).
- Bearing: fundir heading do GPS com magnetômetro (quando disponível) e aplicar limiar de distância para evitar jitter parado.

## 5) Comboio (Mesh)
- API mínima: updateConvoyMember({id, lat, lng, speed, fuel_status}) para atualizar marcadores locais; integrar a Nearby/Bridgefy.
- Renderizar membros em tempo real em camada própria; tooltips com velocidade e combustível.

## 6) Diretrizes de Código
- Comentários em PT‑BR; tratamento rigoroso de exceções de GPS e Bluetooth.
- Não expor chaves/segredos; não logar credenciais.
- Antes de concluir tarefas, executar lint/typecheck e testes quando existirem scripts.

## 7) Preferência de Bibliotecas
- Priorizar libs compatíveis com Flutter/React Native com bindings nativos (Bluetooth Classic p/ OBD2; BLE p/ Mesh).
- Considerar “Modo Transamazônica”: POIs e alertas sazonais persistidos em Realm.
