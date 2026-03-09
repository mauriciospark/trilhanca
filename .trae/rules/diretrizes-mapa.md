# Regras de Projeto: Trilhença (OFF‑ROAD SYNC)
# Versão: 2.0 - Foco em Rastreamento e Comboio

## 1. Pilares Técnicos & Conectividade
- **Offline-First:** Funcionamento 100% sem internet. Banco local Realm; comunicação Mesh (Bridgefy/Nearby).
- **Navegação:** MapLibre/Mapbox com tiles offline (.mbtiles) e OpenStreetMap.
- **OBD-II (ELM327):** Monitoramento via Bluetooth Classic.
  - Coolant Temp: $A - 40$
  - Fuel Level: $(A \times 100) / 255$
  - Battery Voltage: $((A \times 256) + B) / 1000$

## 2. Gestão de Mapa e Rastros (Breadcrumbs)
- **Rastro Individual (Personal Track):** - Persistir pontos no Realm. Renderizar linha fina em cor neutra (ex: Cinza).
  - Aplicar algoritmo Ramer-Douglas-Peucker para simplificar a geometria e manter a performance.
- **Rastro do Comboio (Convoy Breadcrumbs):**
  - Cada veículo transmite via Mesh seus últimos 5-10 pontos de GPS.
  - Renderizar rastros dos membros com cores distintas ou opacidade reduzida para identificar desvios de rota.
- **Interpolação:** Animar marcadores entre fixes (~1 Hz). Fundir GPS + Magnetômetro para o Bearing (direção), evitando jitter com o carro parado.
- **Hierarquia de Camadas (Z-Index):**
  1. Offline Tiles (Base)
  2. Rastro Individual (Histórico)
  3. Rastro dos Membros do Comboio
  4. Rota Ativa (Linha de navegação à frente)
  5. Marcadores em tempo real e POIs

## 3. UI/UX "Modo Condução"
- **Dark Mode Obrigatório.**
- **Acessibilidade de Trepidação:** Alvos de toque (botões) ≥ 48dp. Alto contraste.
- **Feedback Semáforo:** Cores Verde/Amarelo/Vermelho para alertas de motor e distância do comboio.
- **SOS:** Botão nativo para disparo de SMS com Coordenadas + Status do Veículo.

## 4. Diretrizes de Código
- **Idioma:** Comentários em Português (PT-BR).
- **Tratamento de Erros:** Rigoroso para permissões de GPS e Bluetooth.
- **Performance:** Payload Mesh mínimo (JSON compactado ou Protobuf).
- **Segurança:** Nunca expor chaves de API ou logar dados sensíveis.