import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_profile.dart';

class ProfileService {
  ProfileService._();
  static final ProfileService instance = ProfileService._();
  static const _key = 'user_profile';

  Future<UserProfile> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return UserProfile.empty();
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return UserProfile.fromMap(map);
    } catch (_) {
      return UserProfile.empty();
    }
  }

  Future<void> save(UserProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = jsonEncode(profile.toMap());
    await prefs.setString(_key, raw);
  }
}
