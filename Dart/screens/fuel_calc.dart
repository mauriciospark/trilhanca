import 'package:flutter/material.dart';

class FuelCalcScreen extends StatefulWidget {
  const FuelCalcScreen({super.key});

  @override
  State<FuelCalcScreen> createState() => _FuelCalcScreenState();
}

class _FuelCalcScreenState extends State<FuelCalcScreen> {
  final TextEditingController _distanceCtl = TextEditingController();
  final TextEditingController _consumptionCtl = TextEditingController();
  double? _litersNeeded;

  void _calculate() {
    final double? distance = double.tryParse(_distanceCtl.text.replaceAll(',', '.'));
    final double? cons = double.tryParse(_consumptionCtl.text.replaceAll(',', '.'));
    if (distance == null || cons == null || cons == 0) return;
    setState(() {
      _litersNeeded = (distance / 100) * cons;
    });
  }

  @override
  void dispose() {
    _distanceCtl.dispose();
    _consumptionCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Calculadora de Combustível')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(controller: _distanceCtl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Distância (km)')),
            TextField(controller: _consumptionCtl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Consumo (L/100km)')),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _calculate, child: const Text('Calcular')),
            const SizedBox(height: 12),
            if (_litersNeeded != null) Text('Litros necessários: ${_litersNeeded!.toStringAsFixed(2)} L'),
          ],
        ),
      ),
    );
  }
}
