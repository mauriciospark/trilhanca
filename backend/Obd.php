<?php
/**
 * Sistema OBD - Backend API
 * Trilhança Project
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

class OBDAPI {
    private $dbFile = 'obd_data.json';
    private $logsFile = 'obd_logs.json';
    private $errorCodesFile = 'obd_errors.json';
    
    public function __construct() {
        $this->initializeDataFiles();
    }
    
    /**
     * Initialize data files if they don't exist
     */
    private function initializeDataFiles() {
        if (!file_exists($this->dbFile)) {
            file_put_contents($this->dbFile, json_encode([
                'vehicles' => [],
                'sessions' => [],
                'last_update' => date('Y-m-d H:i:s')
            ]));
        }
        
        if (!file_exists($this->logsFile)) {
            file_put_contents($this->logsFile, json_encode([]));
        }
        
        if (!file_exists($this->errorCodesFile)) {
            file_put_contents($this->errorCodesFile, json_encode([
                'P0000' => 'No fault detected',
                'P0101' => 'Mass Air Flow (MAF) Circuit Range/Performance Problem',
                'P0102' => 'Mass Air Flow (MAF) Circuit Low Input',
                'P0103' => 'Mass Air Flow (MAF) Circuit High Input',
                'P0171' => 'System Too Lean (Bank 1)',
                'P0172' => 'System Too Rich (Bank 1)',
                'P0300' => 'Random/Multiple Cylinder Misfire Detected',
                'P0401' => 'Exhaust Gas Recirculation (EGR) Flow Insufficient',
                'P0440' => 'Evaporative Emission Control System Malfunction',
                'P0442' => 'Evaporative Emission Control System Leak Detected (Small Leak)',
                'P0506' => 'Idle Air Control System RPM Lower Than Expected',
                'P0562' => 'Idle Air Control System Circuit High',
                'P0601' => 'Internal Control Module Memory Check Sum Error',
                'P0700' => 'Transmission Control System (MIL) Request'
            ]));
        }
    }
    
    /**
     * Handle API requests
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $endpoint = $_GET['action'] ?? '';
        
        try {
            switch ($method) {
                case 'GET':
                    return $this->handleGet($endpoint);
                case 'POST':
                    return $this->handlePost($endpoint);
                case 'PUT':
                    return $this->handlePut($endpoint);
                case 'DELETE':
                    return $this->handleDelete($endpoint);
                case 'OPTIONS':
                    return $this->handleOptions();
                default:
                    return $this->error('Method not allowed', 405);
            }
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
    
    /**
     * Handle GET requests
     */
    private function handleGet($endpoint) {
        switch ($endpoint) {
            case 'status':
                return $this->getStatus();
            case 'data':
                return $this->getRealtimeData();
            case 'vehicles':
                return $this->getVehicles();
            case 'sessions':
                return $this->getSessions();
            case 'logs':
                return $this->getLogs();
            case 'error_codes':
                return $this->getErrorCodes();
            case 'diagnostics':
                return $this->getDiagnostics();
            default:
                return $this->error('Endpoint not found', 404);
        }
    }
    
    /**
     * Handle POST requests
     */
    private function handlePost($endpoint) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        switch ($endpoint) {
            case 'connect':
                return $this->connect($input);
            case 'disconnect':
                return $this->disconnect($input);
            case 'scan_bluetooth':
                return $this->scanBluetooth();
            case 'scan_serial':
                return $this->scanSerial();
            case 'read_codes':
                return $this->readErrorCodes($input);
            case 'clear_codes':
                return $this->clearErrorCodes($input);
            case 'save_session':
                return $this->saveSession($input);
            case 'add_vehicle':
                return $this->addVehicle($input);
            case 'log_data':
                return $this->logData($input);
            default:
                return $this->error('Endpoint not found', 404);
        }
    }
    
    /**
     * Handle PUT requests
     */
    private function handlePut($endpoint) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        switch ($endpoint) {
            case 'update_vehicle':
                return $this->updateVehicle($input);
            case 'update_session':
                return $this->updateSession($input);
            default:
                return $this->error('Endpoint not found', 404);
        }
    }
    
    /**
     * Handle DELETE requests
     */
    private function handleDelete($endpoint) {
        switch ($endpoint) {
            case 'delete_vehicle':
                return $this->deleteVehicle($_GET['id'] ?? '');
            case 'delete_session':
                return $this->deleteSession($_GET['id'] ?? '');
            case 'clear_logs':
                return $this->clearLogs();
            default:
                return $this->error('Endpoint not found', 404);
        }
    }
    
    /**
     * Handle OPTIONS requests (CORS)
     */
    private function handleOptions() {
        return $this->success(['message' => 'CORS preflight']);
    }
    
    /**
     * Get system status
     */
    private function getStatus() {
        $data = json_decode(file_get_contents($this->dbFile), true);
        
        return $this->success([
            'connected' => $data['connected'] ?? false,
            'connection_type' => $data['connection_type'] ?? null,
            'last_update' => $data['last_update'] ?? date('Y-m-d H:i:s'),
            'ecu_status' => $data['connected'] ?? false ? 'Online' : 'Offline'
        ]);
    }
    
    /**
     * Get real-time data
     */
    private function getRealtimeData() {
        // Simulate real-time data (in production, this would come from OBD device)
        $data = [
            'speed' => rand(0, 120),
            'rpm' => rand(800, 6000),
            'temperature' => rand(70, 110),
            'fuel' => rand(0, 100),
            'oil_pressure' => rand(1.5, 4.5),
            'battery_voltage' => rand(11.5, 14.5),
            'maf' => rand(5, 30),
            'throttle_position' => rand(0, 100),
            'o2_sensor' => rand(0.1, 0.9),
            'map_sensor' => rand(90, 110),
            'tps_sensor' => rand(0, 100),
            'iat_sensor' => rand(15, 35),
            'injector_time' => rand(1, 8),
            'ignition_timing' => rand(-10, 35),
            'engine_load' => rand(10, 80),
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        return $this->success($data);
    }
    
    /**
     * Get vehicles list
     */
    private function getVehicles() {
        $data = json_decode(file_get_contents($this->dbFile), true);
        return $this->success($data['vehicles'] ?? []);
    }
    
    /**
     * Get sessions list
     */
    private function getSessions() {
        $data = json_decode(file_get_contents($this->dbFile), true);
        return $this->success($data['sessions'] ?? []);
    }
    
    /**
     * Get logs
     */
    private function getLogs() {
        $logs = json_decode(file_get_contents($this->logsFile), true);
        $limit = $_GET['limit'] ?? 100;
        $offset = $_GET['offset'] ?? 0;
        
        $paginatedLogs = array_slice($logs, $offset, $limit);
        
        return $this->success([
            'logs' => $paginatedLogs,
            'total' => count($logs),
            'limit' => $limit,
            'offset' => $offset
        ]);
    }
    
    /**
     * Get error codes
     */
    private function getErrorCodes() {
        $codes = json_decode(file_get_contents($this->errorCodesFile), true);
        return $this->success($codes);
    }
    
    /**
     * Get diagnostics
     */
    private function getDiagnostics() {
        $diagnostics = [
            'sensors' => [
                'o2_sensor' => ['status' => 'OK', 'value' => 0.45, 'unit' => 'V'],
                'map_sensor' => ['status' => 'OK', 'value' => 101, 'unit' => 'kPa'],
                'tps_sensor' => ['status' => 'OK', 'value' => 15, 'unit' => '%'],
                'iat_sensor' => ['status' => 'OK', 'value' => 25, 'unit' => '°C']
            ],
            'performance' => [
                'injector_time' => ['status' => 'OK', 'value' => 2.5, 'unit' => 'ms'],
                'ignition_timing' => ['status' => 'OK', 'value' => 15, 'unit' => '°'],
                'engine_load' => ['status' => 'OK', 'value' => 25, 'unit' => '%']
            ],
            'last_check' => date('Y-m-d H:i:s')
        ];
        
        return $this->success($diagnostics);
    }
    
    /**
     * Connect to OBD
     */
    private function connect($input) {
        $type = $input['type'] ?? 'bluetooth';
        $device = $input['device'] ?? null;
        $ip = $input['ip'] ?? null;
        $port = $input['port'] ?? null;
        
        // Validate connection parameters
        switch ($type) {
            case 'bluetooth':
                if (!$device) {
                    return $this->error('Bluetooth device is required');
                }
                break;
            case 'serial':
                if (!$device) {
                    return $this->error('Serial port is required');
                }
                break;
            case 'wifi':
                if (!$ip || !$port) {
                    return $this->error('IP and port are required for WiFi connection');
                }
                break;
        }
        
        // Update connection status
        $data = json_decode(file_get_contents($this->dbFile), true);
        $data['connected'] = true;
        $data['connection_type'] = $type;
        $data['connection_device'] = $device;
        $data['connection_ip'] = $ip;
        $data['connection_port'] = $port;
        $data['connected_at'] = date('Y-m-d H:i:s');
        $data['last_update'] = date('Y-m-d H:i:s');
        
        file_put_contents($this->dbFile, json_encode($data));
        
        return $this->success([
            'message' => 'Connected successfully',
            'type' => $type,
            'device' => $device,
            'connected_at' => $data['connected_at']
        ]);
    }
    
    /**
     * Disconnect from OBD
     */
    private function disconnect($input) {
        $data = json_decode(file_get_contents($this->dbFile), true);
        $data['connected'] = false;
        $data['connection_type'] = null;
        $data['disconnected_at'] = date('Y-m-d H:i:s');
        $data['last_update'] = date('Y-m-d H:i:s');
        
        file_put_contents($this->dbFile, json_encode($data));
        
        return $this->success([
            'message' => 'Disconnected successfully',
            'disconnected_at' => $data['disconnected_at']
        ]);
    }
    
    /**
     * Scan for Bluetooth devices
     */
    private function scanBluetooth() {
        // Simulate Bluetooth scanning
        $devices = [
            ['id' => 'bt_001', 'name' => 'OBD Adapter v2.1', 'address' => '00:1A:7D:DA:71:13'],
            ['id' => 'bt_002', 'name' => 'ELM327 WiFi', 'address' => '00:1B:7D:DA:71:14'],
            ['id' => 'bt_003', 'name' => 'VeePeak OBD', 'address' => '00:1C:7D:DA:71:15']
        ];
        
        return $this->success($devices);
    }
    
    /**
     * Scan for serial ports
     */
    private function scanSerial() {
        // Simulate serial port scanning
        $ports = [
            ['id' => 'com3', 'name' => 'COM3', 'description' => 'Communications Port'],
            ['id' => 'com4', 'name' => 'COM4', 'description' => 'Communications Port'],
            ['id' => 'com5', 'name' => 'COM5', 'description' => 'Communications Port']
        ];
        
        return $this->success($ports);
    }
    
    /**
     * Read error codes
     */
    private function readErrorCodes($input) {
        // Simulate reading error codes
        $detectedCodes = [
            ['code' => 'P0171', 'description' => 'System Too Lean (Bank 1)', 'severity' => 'warning'],
            ['code' => 'P0442', 'description' => 'Evaporative Emission Control System Leak Detected', 'severity' => 'info']
        ];
        
        return $this->success([
            'codes' => $detectedCodes,
            'count' => count($detectedCodes),
            'read_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Clear error codes
     */
    private function clearErrorCodes($input) {
        return $this->success([
            'message' => 'Error codes cleared successfully',
            'cleared_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Save session
     */
    private function saveSession($input) {
        $data = json_decode(file_get_contents($this->dbFile), true);
        
        $session = [
            'id' => uniqid(),
            'vehicle_id' => $input['vehicle_id'] ?? null,
            'start_time' => date('Y-m-d H:i:s'),
            'end_time' => null,
            'duration' => null,
            'max_speed' => $input['max_speed'] ?? 0,
            'avg_speed' => $input['avg_speed'] ?? 0,
            'distance' => $input['distance'] ?? 0,
            'fuel_consumed' => $input['fuel_consumed'] ?? 0,
            'data_points' => $input['data_points'] ?? []
        ];
        
        $data['sessions'][] = $session;
        $data['last_update'] = date('Y-m-d H:i:s');
        
        file_put_contents($this->dbFile, json_encode($data));
        
        return $this->success([
            'message' => 'Session saved successfully',
            'session_id' => $session['id']
        ]);
    }
    
    /**
     * Add vehicle
     */
    private function addVehicle($input) {
        $data = json_decode(file_get_contents($this->dbFile), true);
        
        $vehicle = [
            'id' => uniqid(),
            'name' => $input['name'] ?? 'Unknown Vehicle',
            'make' => $input['make'] ?? '',
            'model' => $input['model'] ?? '',
            'year' => $input['year'] ?? '',
            'vin' => $input['vin'] ?? '',
            'license_plate' => $input['license_plate'] ?? '',
            'engine_type' => $input['engine_type'] ?? '',
            'fuel_type' => $input['fuel_type'] ?? '',
            'odometer' => $input['odometer'] ?? 0,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $data['vehicles'][] = $vehicle;
        $data['last_update'] = date('Y-m-d H:i:s');
        
        file_put_contents($this->dbFile, json_encode($data));
        
        return $this->success([
            'message' => 'Vehicle added successfully',
            'vehicle_id' => $vehicle['id']
        ]);
    }
    
    /**
     * Update vehicle
     */
    private function updateVehicle($input) {
        $data = json_decode(file_get_contents($this->dbFile), true);
        $vehicleId = $input['id'] ?? null;
        
        if (!$vehicleId) {
            return $this->error('Vehicle ID is required');
        }
        
        $updated = false;
        foreach ($data['vehicles'] as &$vehicle) {
            if ($vehicle['id'] === $vehicleId) {
                $vehicle = array_merge($vehicle, $input);
                $vehicle['updated_at'] = date('Y-m-d H:i:s');
                $updated = true;
                break;
            }
        }
        
        if ($updated) {
            $data['last_update'] = date('Y-m-d H:i:s');
            file_put_contents($this->dbFile, json_encode($data));
            return $this->success(['message' => 'Vehicle updated successfully']);
        } else {
            return $this->error('Vehicle not found', 404);
        }
    }
    
    /**
     * Delete vehicle
     */
    private function deleteVehicle($id) {
        $data = json_decode(file_get_contents($this->dbFile), true);
        
        $data['vehicles'] = array_filter($data['vehicles'], function($vehicle) use ($id) {
            return $vehicle['id'] !== $id;
        });
        
        $data['last_update'] = date('Y-m-d H:i:s');
        file_put_contents($this->dbFile, json_encode($data));
        
        return $this->success(['message' => 'Vehicle deleted successfully']);
    }
    
    /**
     * Log data
     */
    private function logData($input) {
        $logs = json_decode(file_get_contents($this->logsFile), true);
        
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'type' => $input['type'] ?? 'info',
            'message' => $input['message'] ?? '',
            'data' => $input['data'] ?? []
        ];
        
        $logs[] = $logEntry;
        
        // Keep only last 1000 log entries
        if (count($logs) > 1000) {
            $logs = array_slice($logs, -1000);
        }
        
        file_put_contents($this->logsFile, json_encode($logs));
        
        return $this->success(['message' => 'Log entry added successfully']);
    }
    
    /**
     * Clear logs
     */
    private function clearLogs() {
        file_put_contents($this->logsFile, json_encode([]));
        return $this->success(['message' => 'Logs cleared successfully']);
    }
    
    /**
     * Return success response
     */
    private function success($data = []) {
        return json_encode([
            'success' => true,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Return error response
     */
    private function error($message, $code = 400) {
        http_response_code($code);
        return json_encode([
            'success' => false,
            'error' => $message,
            'code' => $code,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

// Handle the request
$api = new OBDAPI();
echo $api->handleRequest();
?>