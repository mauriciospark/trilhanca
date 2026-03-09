import 'package:flutter/material.dart';

class MapView extends StatelessWidget {
  const MapView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mapas Offline')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.map, size: 80, color: Colors.orangeAccent),
              SizedBox(height: 12),
              Text('MapLibre / Mapbox placeholder\nConfigurar mapas offline em: lib/services/map_service.dart', textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}
