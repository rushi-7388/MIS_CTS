const hardwareEdgeService = require("../services/hardware-edge.service");

function getHardwareStatus(req, res) {
  try {
    const data = hardwareEdgeService.getHardwareStatus();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function simulateScan(req, res) {
  try {
    const { deviceId, chequeNumber, accountNumber, sortCode, opticalDpi } = req.body;
    const result = hardwareEdgeService.simulateHardwareScan({
      deviceId,
      chequeNumber,
      accountNumber,
      sortCode,
      opticalDpi,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function dispatchSatelliteHeartbeat(req, res) {
  try {
    const packet = hardwareEdgeService.dispatchSatelliteHeartbeat(req.body || {});
    return res.status(201).json(packet);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getHardwareStatus,
  simulateScan,
  dispatchSatelliteHeartbeat,
};

