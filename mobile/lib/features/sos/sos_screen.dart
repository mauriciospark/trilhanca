import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class SosScreen extends StatelessWidget {
  const SosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.danger,
      appBar: AppBar(
        backgroundColor: AppTheme.danger,
        title: const Text('SOS'),
      ),
      body: const Center(
        child: Text(
          'Enviar coordenadas GPS\nvia SMS / Satélite',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
