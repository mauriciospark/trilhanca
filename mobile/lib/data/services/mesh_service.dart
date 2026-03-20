// Serviço stub para comunicação mesh (Bridgefy/Nearby/BLE)
class MeshService {
  MeshService._privateConstructor();
  static final MeshService instance = MeshService._privateConstructor();

  // TODO: implementar inicialização da rede mesh
  Future<void> init() async {}

  // TODO: enviar/receber mensagens e áudio PTT
  void sendMessage(String message) {}
}
