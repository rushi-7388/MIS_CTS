const agoraService = require("../services/agora-mbridge.service");

function getCorridorNetwork(req, res) {
  try {
    const data = agoraService.getCorridorNetwork();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function executeAtomicDvpSwap(req, res) {
  try {
    const { corridor, sourceAmountInr, initiatorBank, counterpartyBank, beneficiaryAccount, purposeCode } = req.body;
    if (!sourceAmountInr) {
      return res.status(400).json({ error: "Missing required field: sourceAmountInr" });
    }
    const result = agoraService.executeAtomicDvpSwap({
      corridor,
      sourceAmountInr,
      initiatorBank,
      counterpartyBank,
      beneficiaryAccount,
      purposeCode,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getCorridorNetwork,
  executeAtomicDvpSwap,
};

