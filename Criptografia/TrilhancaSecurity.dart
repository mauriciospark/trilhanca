import 'dart:convert';
import 'dart:math';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:nearby_connections/nearby_connections.dart';

class TrilhancaSecurity {
  final enc.Key key;
  final enc.Encrypter _encrypter;
  TrilhancaSecurity._(this.key, this._encrypter);
  factory TrilhancaSecurity.fromBase64Key(String base64Key) {
    final k = enc.Key(base64Decode(base64Key));
    final e = enc.Encrypter(enc.AES(k, mode: enc.AESMode.cbc, padding: 'PKCS7'));
    return TrilhancaSecurity._(k, e);
  }
  static String generateBase64Key() {
    final r = Random.secure();
    final b = List<int>.generate(32, (_) => r.nextInt(256));
    return base64Encode(b);
  }
  String encryptData(String plainText) {
    final iv = enc.IV.fromSecureRandom(16);
    final c = _encrypter.encrypt(plainText, iv: iv);
    final ivB64 = iv.base64;
    final ctB64 = c.base64;
    return 'v1.$ivB64.$ctB64';
  }
  String decryptData(String token) {
    final parts = token.split('.');
    if (parts.length != 3 || parts[0] != 'v1') {
      throw ArgumentError('invalid');
    }
    final iv = enc.IV.fromBase64(parts[1]);
    final ct = enc.Encrypted.fromBase64(parts[2]);
    return _encrypter.decrypt(ct, iv: iv);
  }
  static String buildSessionPayload(String base64Key) {
    final obj = {'v': '1', 'alg': 'aes-256-cbc', 'k': base64Key};
    final jsonStr = jsonEncode(obj);
    return base64Encode(utf8.encode(jsonStr));
  }
  static String? parseSessionPayload(String payloadB64) {
    try {
      final raw = utf8.decode(base64Decode(payloadB64));
      final obj = jsonDecode(raw);
      if (obj is Map && obj['v'] == '1' && obj['alg'] == 'aes-256-cbc' && obj['k'] is String) {
        return obj['k'] as String;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}

void main() {
  final keyB64 = TrilhancaSecurity.generateBase64Key();
  final sec = TrilhancaSecurity.fromBase64Key(keyB64);
  final token = sec.encryptData('teste');
  final plain = sec.decryptData(token);
  final payload = TrilhancaSecurity.buildSessionPayload(keyB64);
  final parsedKey = TrilhancaSecurity.parseSessionPayload(payload);
  if (plain != 'teste' || parsedKey != keyB64) {
    throw StateError('fail');
  }
}
