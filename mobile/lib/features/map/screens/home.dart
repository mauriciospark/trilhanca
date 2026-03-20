import 'package:flutter/material.dart';
import 'map_view.dart';
import 'ptt.dart';
import 'fuel_calc.dart';
import 'profile.dart';
import 'profile_signup.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Super App Expedição')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton.icon(
              icon: const Icon(Icons.person_add),
              label: const Text('Cadastrar Perfil'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileSignupScreen())),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              icon: const Icon(Icons.person),
              label: const Text('Perfil'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              icon: const Icon(Icons.map),
              label: const Text('Mapas Offline'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MapView())),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              icon: const Icon(Icons.mic),
              label: const Text('Comunicação PTT'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PTTScreen())),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              icon: const Icon(Icons.local_gas_station),
              label: const Text('Calculadora de Combustível'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FuelCalcScreen())),
            ),
            const SizedBox(height: 12),
            Expanded(child: Container()),
            const Text('Modo: Direção noturna — foco em legibilidade', textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
