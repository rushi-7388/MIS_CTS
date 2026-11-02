const express = require("express");
const router = express.Router();
const controller = require("../controllers/hardware-edge.controller");

router.get("/status", controller.getHardwareStatus);
router.post("/scan", controller.simulateScan);
router.post("/satellite-heartbeat", controller.dispatchSatelliteHeartbeat);

module.exports = router;

