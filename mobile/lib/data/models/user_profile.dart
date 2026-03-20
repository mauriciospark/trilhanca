class UserProfile {
  final String name;
  final String email;
  final String phone;
  final String emergencyName;
  final String emergencyPhone;
  final String vehicle;
  final String bloodType;
  final String notes;
  final String? photoBase64;

  const UserProfile({
    required this.name,
    required this.email,
    required this.phone,
    required this.emergencyName,
    required this.emergencyPhone,
    required this.vehicle,
    required this.bloodType,
    required this.notes,
    this.photoBase64,
  });

  factory UserProfile.empty() {
    return const UserProfile(
      name: '',
      email: '',
      phone: '',
      emergencyName: '',
      emergencyPhone: '',
      vehicle: '',
      bloodType: '',
      notes: '',
      photoBase64: null,
    );
  }

  UserProfile copyWith({
    String? name,
    String? email,
    String? phone,
    String? emergencyName,
    String? emergencyPhone,
    String? vehicle,
    String? bloodType,
    String? notes,
    String? photoBase64,
  }) {
    return UserProfile(
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      emergencyName: emergencyName ?? this.emergencyName,
      emergencyPhone: emergencyPhone ?? this.emergencyPhone,
      vehicle: vehicle ?? this.vehicle,
      bloodType: bloodType ?? this.bloodType,
      notes: notes ?? this.notes,
      photoBase64: photoBase64 ?? this.photoBase64,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'email': email,
      'phone': phone,
      'emergencyName': emergencyName,
      'emergencyPhone': emergencyPhone,
      'vehicle': vehicle,
      'bloodType': bloodType,
      'notes': notes,
      'photoBase64': photoBase64,
    };
  }

  factory UserProfile.fromMap(Map<String, dynamic> map) {
    return UserProfile(
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      phone: map['phone'] ?? '',
      emergencyName: map['emergencyName'] ?? '',
      emergencyPhone: map['emergencyPhone'] ?? '',
      vehicle: map['vehicle'] ?? '',
      bloodType: map['bloodType'] ?? '',
      notes: map['notes'] ?? '',
      photoBase64: map['photoBase64'],
    );
  }
}
