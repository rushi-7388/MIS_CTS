const crypto = require("crypto");

/**
 * Interbank Liquidity & Secondary Receivables Marketplace
 * 
 * Commercial Engine:
 * Converts idle uncleared instruments and delayed clearing queues into
 * tradeable intraday yield assets. Banks with surplus liquidity bid on
 * high-assurance instruments, providing instant cash to presenting banks
 * while earning algorithmic basis point yields (BPS).
 */

class LiquidityMarketplaceService {
  constructor() {
    this.orderBook = [
      {
        assetId: "REC-2026-90412",
        chequeNumber: "000412",
        presentingBank: "SURAT PEOPLES CO OP BANK",
        draweeBank: "HDFC BANK",
        faceValue: 1850000.0,
        hoursToClearing: 3.5,
        riskScore: 8,
        riskTier: "AAA_SOVEREIGN",
        ppsVerified: true,
        baseDiscountYieldBps: 42, // 0.42% annualized intraday
        currentDiscountPrice: 1848520.0,
        intradayYieldInr: 1480.0,
        status: "LISTED",
        collateralPledgeType: "GSEC_7_18_2033",
        createdTime: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        assetId: "REC-2026-90889",
        chequeNumber: "000889",
        presentingBank: "STATE BANK OF INDIA",
        draweeBank: "ICICI BANK",
        faceValue: 14500000.0,
        hoursToClearing: 5.0,
        riskScore: 14,
        riskTier: "AA_PRIME",
        ppsVerified: true,
        baseDiscountYieldBps: 58,
        currentDiscountPrice: 14488400.0,
        intradayYieldInr: 11600.0,
        status: "LISTED",
        collateralPledgeType: "TREASURY_BILL_91D",
        createdTime: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        assetId: "REC-2026-90771",
        chequeNumber: "000771",
        presentingBank: "PUNJAB NATIONAL BANK",
        draweeBank: "KOTAK MAHINDRA BANK",
        faceValue: 6200000.0,
        hoursToClearing: 2.0,
        riskScore: 19,
        riskTier: "AA_PRIME",
        ppsVerified: true,
        baseDiscountYieldBps: 64,
        currentDiscountPrice: 6195660.0,
        intradayYieldInr: 4340.0,
        status: "BID_RECEIVED",
        activeBidder: "BANK OF BARODA",
        activeBidAmount: 6196200.0,
        collateralPledgeType: "RBI_SDF_DEPOSIT",
        createdTime: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ];

    this.tradeHistory = [
      {
        tradeId: "TRD-8829104",
        assetId: "REC-2026-89104",
        chequeNumber: "000104",
        sellerBank: "SURAT PEOPLES CO OP BANK",
        buyerBank: "STATE BANK OF INDIA",
        faceValue: 8400000.0,
        settledPrice: 8393500.0,
        realizedYieldBps: 52,
        clearedAt: new Date(Date.now() - 120 * 60000).toISOString(),
        settlementRef: "DVP-MKT-991823-INR",
      },
    ];

    this.liquidityPools = {
      SBI_TREASURY: { balanceInr: 500000000.0, allocated: 45000000.0, targetYieldBps: 48 },
      HDFC_TREASURY: { balanceInr: 350000000.0, allocated: 38000000.0, targetYieldBps: 50 },
      ICICI_TREASURY: { balanceInr: 280000000.0, allocated: 22000000.0, targetYieldBps: 55 },
    };
  }

  calculateDynamicYield(faceValue, hoursToClearing, riskScore) {
    const baseRbiRepoRate = 6.5; // 6.50% annual
    const riskPremiumBps = Math.round((riskScore / 100) * 35);
    const durationPremiumBps = Math.round((hoursToClearing / 24) * 20);
    const totalYieldBps = 35 + riskPremiumBps + durationPremiumBps;
    
    // Intraday discount = faceValue * (annualized rate / 365) * (hours / 24)
    const annualizedRate = (baseRbiRepoRate + (totalYieldBps / 100)) / 100;
    const discountAmount = Math.round(faceValue * annualizedRate * (hoursToClearing / (365 * 24)));
    const discountPrice = faceValue - discountAmount;

    return {
      yieldBps: totalYieldBps,
      annualizedYieldPercent: +(baseRbiRepoRate + (totalYieldBps / 100)).toFixed(2),
      discountAmount,
      discountPrice,
    };
  }

  getMarketplaceOverview() {
    const activeListings = this.orderBook.filter((o) => o.status === "LISTED" || o.status === "BID_RECEIVED");
    const totalVolume = activeListings.reduce((sum, item) => sum + item.faceValue, 0);
    const avgYield = activeListings.length
      ? Math.round(activeListings.reduce((sum, item) => sum + item.baseDiscountYieldBps, 0) / activeListings.length)
      : 0;

    return {
      activeListingsCount: activeListings.length,
      totalListedVolumeInr: totalVolume,
      averageYieldBps: avgYield,
      dailyTradedVolumeInr: this.tradeHistory.reduce((s, t) => s + t.faceValue, 0),
      orderBook: this.orderBook,
      tradeHistory: this.tradeHistory,
      liquidityPools: this.liquidityPools,
      marketStatus: "OPEN_CONTINUOUS_TRADING",
    };
  }

  listReceivable({ chequeNumber, presentingBank, draweeBank, faceValue, hoursToClearing = 4.0, riskScore = 10, collateralType = "GSEC_7_18_2033" }) {
    const assetId = `REC-2026-${Date.now().toString().slice(-5)}`;
    const yieldCalc = this.calculateDynamicYield(faceValue, hoursToClearing, riskScore);

    const listing = {
      assetId,
      chequeNumber,
      presentingBank,
      draweeBank,
      faceValue: parseFloat(faceValue),
      hoursToClearing,
      riskScore,
      riskTier: riskScore < 15 ? "AAA_SOVEREIGN" : riskScore < 40 ? "AA_PRIME" : "A_STANDARD",
      ppsVerified: true,
      baseDiscountYieldBps: yieldCalc.yieldBps,
      currentDiscountPrice: yieldCalc.discountPrice,
      intradayYieldInr: yieldCalc.discountAmount,
      status: "LISTED",
      collateralPledgeType: collateralType,
      createdTime: new Date().toISOString(),
    };

    this.orderBook.unshift(listing);
    return listing;
  }

  executeInstantBuyout({ assetId, buyerBank = "STATE BANK OF INDIA" }) {
    const itemIndex = this.orderBook.findIndex((item) => item.assetId === assetId);
    if (itemIndex === -1) {
      throw new Error(`Asset ${assetId} not found on marketplace`);
    }

    const item = this.orderBook[itemIndex];
    if (item.status === "SETTLED") {
      throw new Error(`Asset ${assetId} already bought out`);
    }

    item.status = "SETTLED";
    item.buyerBank = buyerBank;

    const tradeId = `TRD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const trade = {
      tradeId,
      assetId: item.assetId,
      chequeNumber: item.chequeNumber,
      sellerBank: item.presentingBank,
      buyerBank,
      faceValue: item.faceValue,
      settledPrice: item.currentDiscountPrice,
      realizedYieldBps: item.baseDiscountYieldBps,
      clearedAt: new Date().toISOString(),
      settlementRef: `DVP-MKT-${crypto.randomBytes(3).toString("hex").toUpperCase()}-INR`,
      smartLienHash: crypto.createHash("sha256").update(`${tradeId}:${item.assetId}:${item.faceValue}`).digest("hex"),
    };

    this.tradeHistory.unshift(trade);
    return {
      message: `Receivable successfully bought out by ${buyerBank}. Instant liquidity credited to ${item.presentingBank}.`,
      trade,
    };
  }
}

module.exports = new LiquidityMarketplaceService();

