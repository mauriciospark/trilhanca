Super App Expedição (OFF-ROAD SYNC)

Projeto inicial (scaffold) do MVP do Super App para expedições off-road.

Características implementadas nesta entrega inicial:

- Estrutura Flutter básica com Modo Escuro.
- Telas: Home, Mapas (placeholder), PTT (UI), Calculadora de combustível.
- Serviços stubs: MeshService, DiaryService, SOS via `url_launcher` placeholder.

Como rodar (requer Flutter instalado):

```bash
flutter pub get
flutter run
```

Próximos passos:

- Integrar MapLibre/Mapbox para mapas offline.
- Implementar comunicação mesh (Bridgefy/nearby/ble mesh).
- Adicionar persistência offline (Realm/Hive) e integração OBD-II.
