// Diário de bordo automático (stub)
class DiaryService {
  DiaryService._();
  static final DiaryService instance = DiaryService._();

  Future<void> logEvent(String event) async {
    // TODO: persistir em DB offline e anexar metadados (gps, timestamp)
  }
}
