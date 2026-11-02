const express = require("express");
const router = express.Router();
const controller = require("../controllers/agora.controller");

router.get("/corridors", controller.getCorridorNetwork);
router.post("/swap", controller.executeAtomicDvpSwap);

module.exports = router;

