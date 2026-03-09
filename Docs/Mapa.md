# Mapa de Comboio

## Requisitos

- Renderizar markers para cada integrante/veículo.
- Calcular distância para o líder em tempo real.
- Se distância > 500 m, piscar ícone em vermelho.

## Implementação

- MapLibre GL com estilo dark e tiles offline (.mbtiles).
- Haversine para distância entre coordenadas.
- Animação de blinking controlada por timer/animation controller.

## Fonte de Tiles Offline

- .mbtiles embutidos no app; leitura via recurso nativo (Android/iOS).
- Transformação de requests do MapLibre para servir de SQLite local.

## Estados e Persistência

- Posições registradas em Realm com veiculoId e timestamp.
- Atualizações propagadas via Nearby; mapa escuta mudanças e atualiza markers.

## Alertas

- thresholds configuráveis (ex.: 500 m).
- UI high-contrast; destaque vermelho intermitente para risco de distanciamento.
