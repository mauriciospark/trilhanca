import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/user_profile.dart';
import '../services/profile_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameCtl = TextEditingController();
  final _emailCtl = TextEditingController();
  final _phoneCtl = TextEditingController();
  final _emNameCtl = TextEditingController();
  final _emPhoneCtl = TextEditingController();
  final _vehicleCtl = TextEditingController();
  final _bloodCtl = TextEditingController();
  final _notesCtl = TextEditingController();
  Uint8List? _photoBytes;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final profile = await ProfileService.instance.load();
    setState(() {
      _nameCtl.text = profile.name;
      _emailCtl.text = profile.email;
      _phoneCtl.text = profile.phone;
      _emNameCtl.text = profile.emergencyName;
      _emPhoneCtl.text = profile.emergencyPhone;
      _vehicleCtl.text = profile.vehicle;
      _bloodCtl.text = profile.bloodType;
      _notesCtl.text = profile.notes;
      _photoBytes = profile.photoBase64 != null && profile.photoBase64!.isNotEmpty
          ? base64Decode(profile.photoBase64!)
          : null;
      _loading = false;
    });
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1080, imageQuality: 85);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() {
      _photoBytes = bytes;
    });
  }

  Future<void> _save() async {
    final photo64 = _photoBytes != null ? base64Encode(_photoBytes!) : null;
    final profile = UserProfile(
      name: _nameCtl.text.trim(),
      email: _emailCtl.text.trim(),
      phone: _phoneCtl.text.trim(),
      emergencyName: _emNameCtl.text.trim(),
      emergencyPhone: _emPhoneCtl.text.trim(),
      vehicle: _vehicleCtl.text.trim(),
      bloodType: _bloodCtl.text.trim(),
      notes: _notesCtl.text.trim(),
      photoBase64: photo64,
    );
    await ProfileService.instance.save(profile);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Perfil salvo')));
    }
  }

  @override
  void dispose() {
    _nameCtl.dispose();
    _emailCtl.dispose();
    _phoneCtl.dispose();
    _emNameCtl.dispose();
    _emPhoneCtl.dispose();
    _vehicleCtl.dispose();
    _bloodCtl.dispose();
    _notesCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        appBar: AppBar(title: Text('Perfil')),
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Stack(
                alignment: Alignment.bottomRight,
                children: [
                  CircleAvatar(
                    radius: 56,
                    backgroundColor: Colors.grey[800],
                    backgroundImage: _photoBytes != null ? MemoryImage(_photoBytes!) : null,
                    child: _photoBytes == null ? const Icon(Icons.person, size: 56) : null,
                  ),
                  IconButton(
                    onPressed: _pickPhoto,
                    icon: const Icon(Icons.camera_alt),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(controller: _nameCtl, decoration: const InputDecoration(labelText: 'Nome')),
            TextField(controller: _emailCtl, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
            TextField(controller: _phoneCtl, decoration: const InputDecoration(labelText: 'Telefone'), keyboardType: TextInputType.phone),
            const SizedBox(height: 8),
            TextField(controller: _emNameCtl, decoration: const InputDecoration(labelText: 'Contato de emergência')),
            TextField(controller: _emPhoneCtl, decoration: const InputDecoration(labelText: 'Telefone emergência'), keyboardType: TextInputType.phone),
            const SizedBox(height: 8),
            TextField(controller: _vehicleCtl, decoration: const InputDecoration(labelText: 'Veículo')),
            TextField(controller: _bloodCtl, decoration: const InputDecoration(labelText: 'Tipo sanguíneo')),
            TextField(controller: _notesCtl, decoration: const InputDecoration(labelText: 'Observações')),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _save, child: const Text('Salvar')),
          ],
        ),
      ),
    );
  }
}
