class AppConstants {
  AppConstants._();

  static const String appName = 'Trilhança';
  static const String appVersion = '0.1.0';

  static const double convoyAlertDistanceMeters = 500;
  static const double dangerousSlopeDegreees = 30;
  static const int meshRelayIntervalSeconds = 5;
  static const int obdPollIntervalSeconds = 2;
  static const int crowdsourceMinConsensus = 3;

  static const String osmTileUrl =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  static const int e2eeKeyBits = 256;
}
