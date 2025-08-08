const { default: mongoose } = require("mongoose");

const SiteFinanceSchema = new mongoose.Schema({
    totalRevenue: { type: Number, default: 0 }, // درآمد کل سایت
    transactions: [
        {
            type: { type: String, enum: ["credit", "debit"], required: true },
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            description: { type: String },
        },
    ],
});

const SiteFinance = mongoose.model("SiteFinance", SiteFinanceSchema);

module.exports = SiteFinance