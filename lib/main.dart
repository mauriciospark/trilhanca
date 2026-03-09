import 'package:flutter/material.dart';
import 'screens/home.dart';

void main() {
  runApp(const SuperAppExpedicao());
}

class SuperAppExpedicao extends StatelessWidget {
  const SuperAppExpedicao({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Super App Expedição',
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
        colorScheme: ColorScheme.dark(primary: Colors.orangeAccent),
      ),
      themeMode: ThemeMode.dark,
      home: const HomeScreen(),
    );
  }
}
