import 'package:realm/realm.dart';

part 'models.g.dart';

@RealmModel()
class _Veiculo {
  @PrimaryKey()
  late String id;
  late String nome;
}

@RealmModel()
class _Posicao {
  @PrimaryKey()
  late String id;
  late String veiculoId;
  late double lat;
  late double lon;
  late int ts;
}

@RealmModel()
class _Mensagem {
  @PrimaryKey()
  late String id;
  late String deId;
  late String paraId;
  late String tipo;
  late String payload;
  late int ts;
}