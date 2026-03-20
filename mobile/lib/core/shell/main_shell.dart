import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const _tabs = [
    (icon: Icons.map_outlined, label: 'Mapa', path: '/map'),
    (icon: Icons.mic_none_rounded, label: 'PTT', path: '/ptt'),
    (icon: Icons.directions_car_outlined, label: 'Comboio', path: '/convoy'),
    (icon: Icons.speed_outlined, label: 'OBD', path: '/obd'),
    (icon: Icons.person_outline, label: 'Perfil', path: '/profile'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final idx = _tabs.indexWhere((t) => location.startsWith(t.path));
    return idx < 0 ? 0 : idx;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          child,
          Positioned(
            top: 40,
            right: 16,
            child: FloatingActionButton.small(
              heroTag: 'sos',
              backgroundColor: AppTheme.danger,
              onPressed: () => context.push('/sos'),
              child: const Text('SOS',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex(context),
        onTap: (i) => context.go(_tabs[i].path),
        items: _tabs
            .map((t) => BottomNavigationBarItem(
                  icon: Icon(t.icon),
                  label: t.label,
                ))
            .toList(),
      ),
    );
  }
}
