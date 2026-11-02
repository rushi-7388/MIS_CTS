const crypto = require("crypto");

/**
 * Enterprise CFO & Institutional Treasury Terminal
 * ("Bloomberg for National Clearing & Liquidity")
 * 
 * Provides corporate treasurers at top conglomerates (Reliance, Tata, L&T, Aditya Birla)
 * with real-time liquidity forecasting, intraday float arbitrage, dynamic vendor discounting,
 * and automated statutory tax escrow routing (18% GSTN + 1% TDS).
 */

class CorporateTreasuryService {
  constructor() {
    this.conglomeratePortfolios = {
      "RELIANCE_TREASURY": {
        entityName: "Reliance Industries Central Treasury",
        primaryBank: "HDFC BANK",
        totalIntradayLiquidityInr: 12500000000.0, // ₹1,250 Cr
        inwardFloatInr: 845000000.0,
        outwardObligationsInr: 610000000.0,
        netIntradayHeadroomInr: 235000000.0,
        projectedOvernightYieldBps: 64,
        statutoryTaxEscrowVault: {
          gstnAccumulatedInr: 152100000.0,
          tdsAccumulatedInr: 8450000.0,
          vaultStatus: "LOCKED_IN_FAVOUR_OF_GOI",
        },
      },
      "TATA_STEEL_TREASURY": {
        entityName: "Tata Steel Group Intraday Liquidity",
        primaryBank: "STATE BANK OF INDIA",
        totalIntradayLiquidityInr: 8800000000.0,
        inwardFloatInr: 420000000.0,
        outwardObligationsInr: 390000000.0,
        netIntradayHeadroomInr: 30000000.0,
        projectedOvernightYieldBps: 61,
        statutoryTaxEscrowVault: {
          gstnAccumulatedInr: 75600000.0,
          tdsAccumulatedInr: 4200000.0,
          vaultStatus: "LOCKED_IN_FAVOUR_OF_GOI",
        },
      },
    };

    this.dynamicDiscountingInvoices = [
      {
        invoiceId: "INV-2026-LT-8812",
        supplierName: "BHARAT HEAVY VALVES LTD",
        grossAmount: 4800000.0,
        dueDateDays: 30,
        earlyPaymentDays: 3,
        discountOfferedPercent: 1.8,
        cashSavedInr: 86400.0,
        effectiveAnnualizedApr: 24.3,
        status: "APPROVED_FOR_ACCELERATED_CLEARING",
      },
      {
        invoiceId: "INV-2026-REL-4401",
        supplierName: "GUJARAT PETROCHEM LOGISTICS",
        grossAmount: 12500000.0,
        dueDateDays: 45,
        earlyPaymentDays: 5,
        discountOfferedPercent: 2.2,
        cashSavedInr: 275000.0,
        effectiveAnnualizedApr: 20.1,
        status: "OFFER_ACTIVE",
      },
    ];
  }

  getTreasuryOverview(entityKey = "RELIANCE_TREASURY") {
    const portfolio = this.conglomeratePortfolios[entityKey] || this.conglomeratePortfolios["RELIANCE_TREASURY"];

    // Monte Carlo 7-day liquidity simulation
    const simulationDays = [];
    let currentBalance = portfolio.totalIntradayLiquidityInr;
    for (let day = 1; day <= 7; day++) {
      const dailyInflow = Math.round(500000000 + (Math.random() * 200000000 - 100000000));
      const dailyOutflow = Math.round(480000000 + (Math.random() * 180000000 - 90000000));
      currentBalance += dailyInflow - dailyOutflow;
      simulationDays.push({
        day: `T+${day}`,
        inflowInr: dailyInflow,
        outflowInr: dailyOutflow,
        projectedClosingInr: currentBalance,
        liquidityStressScore: Math.round(12 + Math.random() * 10),
      });
    }

    return {
      portfolio,
      monteCarloProjection: simulationDays,
      dynamicDiscounting: this.dynamicDiscountingInvoices,
      floatArbitrageOpportunity: {
        intradayFloatInr: portfolio.inwardFloatInr,
        repoRatePercent: 6.5,
        dailyArbitrageYieldInr: Math.round(portfolio.inwardFloatInr * (0.065 / 365)),
        automatedAction: "SWEEP_SURPLUS_TO_RBI_SDF",
      },
    };
  }

  executeEarlyDiscountSettlement(invoiceId) {
    const invoice = this.dynamicDiscountingInvoices.find((i) => i.invoiceId === invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    invoice.status = "SETTLED_WITH_DISCOUNT";
    const netPaid = invoice.grossAmount - invoice.cashSavedInr;

    return {
      success: true,
      invoiceId,
      grossAmount: invoice.grossAmount,
      cashSavedInr: invoice.cashSavedInr,
      netPaidInr: netPaid,
      settlementUtr: `RBIR520261102${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      statutoryTaxEscrowDeducted: {
        gstn_18pct: Math.round(invoice.grossAmount * 0.18),
        tds_1pct: Math.round(invoice.grossAmount * 0.01),
      },
    };
  }
}

module.exports = new CorporateTreasuryService();

