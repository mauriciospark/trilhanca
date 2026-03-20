import 'package:url_launcher/url_launcher.dart';

class SOSService {
  SOSService._();
  static final SOSService instance = SOSService._();

  // Envia SMS com localização — placeholder usando url_launcher
  Future<void> sendSOS(String phone, String message) async {
    final uri = Uri.parse('sms:$phone?body=${Uri.encodeComponent(message)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}
