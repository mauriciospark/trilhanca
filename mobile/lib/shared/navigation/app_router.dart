import 'package:go_router/go_router.dart';
import '../../features/map/screens/map_view.dart';
import '../../features/ptt/screens/ptt_screen.dart';
import '../../features/convoy/screens/convoy_screen.dart';
import '../../features/obd/screens/obd_screen.dart';
import '../../features/sos/sos_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/profile_signup.dart';
import '../../features/fuel/screens/fuel_calc.dart';
import '../../core/shell/main_shell.dart';

class AppRouter {
  AppRouter._();

  static final router = GoRouter(
    initialLocation: '/map',
    routes: [
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/map', builder: (c, s) => const MapViewScreen()),
          GoRoute(path: '/ptt', builder: (c, s) => const PttScreen()),
          GoRoute(path: '/convoy', builder: (c, s) => const ConvoyScreen()),
          GoRoute(path: '/obd', builder: (c, s) => const ObdScreen()),
          GoRoute(path: '/profile', builder: (c, s) => const ProfileScreen()),
        ],
      ),
      GoRoute(path: '/sos', builder: (c, s) => const SosScreen()),
      GoRoute(path: '/signup', builder: (c, s) => const ProfileSignupScreen()),
      GoRoute(path: '/fuel', builder: (c, s) => const FuelCalcScreen()),
    ],
  );
}
