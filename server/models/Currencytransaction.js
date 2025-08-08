const mongoose = require("mongoose");

const CurrencyTransactionSchema = new mongoose.Schema({
 user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ارجاع به کاربر
 amount: { type: Number, required: true }, // مقدار ارز
 type: { type: String, enum: ["reward", "purchase"], required: true }, // نوع تراکنش (پاداش یا خرید)
 description: { type: String }, // توضیحات تراکنش
 date: { type: Date, default: Date.now }, // تاریخ تراکنش
},
{ timestamps: true }
);

module.exports = mongoose.model("Currencytransaction", CurrencyTransactionSchema);
