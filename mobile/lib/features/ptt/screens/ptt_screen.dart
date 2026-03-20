import 'package:flutter/material.dart';

class PTTScreen extends StatefulWidget {
  const PTTScreen({super.key});

  @override
  State<PTTScreen> createState() => _PTTScreenState();
}

class _PTTScreenState extends State<PTTScreen> {
  bool _talking = false;

  void _onPressStart() {
    setState(() => _talking = true);
    // TODO: iniciar stream de áudio e enviar via MeshService
  }

  void _onPressEnd() {
    setState(() => _talking = false);
    // TODO: parar envio de áudio
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('PTT — Push To Talk')),
      body: Center(
        child: GestureDetector(
          onLongPressStart: (_) => _onPressStart(),
          onLongPressEnd: (_) => _onPressEnd(),
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              color: _talking ? Colors.redAccent : Colors.grey[800],
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(_talking ? 'Falando' : 'Pressione e segure', textAlign: TextAlign.center),
          ),
        ),
      ),
    );
  }
}
