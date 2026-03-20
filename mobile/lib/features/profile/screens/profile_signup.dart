import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/user_profile.dart';
import '../services/profile_service.dart';

class ProfileSignupScreen extends StatefulWidget {
  const ProfileSignupScreen({super.key});
  @override
  State<ProfileSignupScreen> createState() => _ProfileSignupScreenState();
}

class _ProfileSignupScreenState extends State<ProfileSignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtl = TextEditingController();
  final _emailCtl = TextEditingController();
  final _phoneCtl = TextEditingController();
  final _emNameCtl = TextEditingController();
  final _emPhoneCtl = TextEditingController();
  final _vehicleCtl = TextEditingController();
  final _bloodCtl = TextEditingController();
  final _notesCtl = TextEditingController();
  Uint8List? _photoBytes;
  bool _submitting = false;

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1080, imageQuality: 85);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() {
      _photoBytes = bytes;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
    });
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
    setState(() {
      _submitting = false;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cadastro concluído')));
      Navigator.pop(context);
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
    return Scaffold(
      appBar: AppBar(title: const Text('Cadastrar Perfil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
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
                    IconButton(onPressed: _pickPhoto, icon: const Icon(Icons.camera_alt)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameCtl,
                decoration: const InputDecoration(labelText: 'Nome'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o nome' : null,
              ),
              TextFormField(
                controller: _emailCtl,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
              ),
              TextFormField(
                controller: _phoneCtl,
                decoration: const InputDecoration(labelText: 'Telefone'),
                keyboardType: TextInputType.phone,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o telefone' : null,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emNameCtl,
                decoration: const InputDecoration(labelText: 'Contato de emergência'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o contato de emergência' : null,
              ),
              TextFormField(
                controller: _emPhoneCtl,
                decoration: const InputDecoration(labelText: 'Telefone emergência'),
                keyboardType: TextInputType.phone,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o telefone de emergência' : null,
              ),
              const SizedBox(height: 8),
              TextFormField(controller: _vehicleCtl, decoration: const InputDecoration(labelText: 'Veículo')),
              TextFormField(controller: _bloodCtl, decoration: const InputDecoration(labelText: 'Tipo sanguíneo')),
              TextFormField(controller: _notesCtl, decoration: const InputDecoration(labelText: 'Observações')),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: Text(_submitting ? 'Salvando...' : 'Cadastrar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
