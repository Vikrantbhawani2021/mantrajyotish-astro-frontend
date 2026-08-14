import { useState, useEffect } from "react";
import { 
  Wallet, ArrowUpRight, ArrowLeft, X, CheckCircle2, 
  Clock, Landmark, QrCode, AlertCircle, Sparkles, ChevronRight, Loader2, ShieldCheck 
} from "lucide-react";

export default function WalletModal({ isOpen, onClose, initialWithdrawOpen = false }) {
  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);

  // Form State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(initialWithdrawOpen);

  useEffect(() => {
    if (isOpen) {
      setIsWithdrawOpen(initialWithdrawOpen);
    }
  }, [isOpen, initialWithdrawOpen]);

  // Fetch real wallet balance and transactions from API
  useEffect(() => {
    if (!isOpen) return;

    const fetchWalletData = async () => {
      try {
        const storedUser = localStorage.getItem("astrologer");
        let astroId = null;
        let phone = null;

        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            astroId = parsed._id || parsed.id || parsed.astrologerId;
            phone = parsed.phone || parsed.mobile;
          } catch (e) {}
        }

        const queryParams = new URLSearchParams();
        if (astroId) queryParams.append("userId", astroId);
        if (phone) queryParams.append("phone", phone);

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch Balance
        const balRes = await fetch(`/api/wallet/balance?${queryParams.toString()}`, { headers });
        if (balRes.ok) {
          const balData = await balRes.json();
          if (balData.success && balData.data) {
            setBalance(balData.data.walletBalance || 0);
          }
        }

        // Fetch Transactions
        const txRes = await fetch(`/api/wallet/transactions?${queryParams.toString()}`, { headers });
        if (txRes.ok) {
          const txData = await txRes.json();
          if (txData.success && Array.isArray(txData.data)) {
            const formatted = txData.data.map((tx) => ({
              id: tx.transactionId || tx._id || `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
              amount: tx.amount || 0,
              date: tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Recent",
              method: tx.description || tx.paymentMethod || "Wallet Payout",
              status: tx.status || "Completed"
            }));
            setTransactions(formatted);
          }
        }
      } catch (err) {
        console.error("Error fetching wallet data:", err);
      }
    };

    fetchWalletData();
  }, [isOpen]);

  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("upi"); // "upi" | "bank"
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Real Withdrawal Transactions list state
  const [transactions, setTransactions] = useState([]);

  if (!isOpen) return null;

  const handleQuickAmount = (val) => {
    if (val === "all") {
      setAmount(balance.toString());
    } else {
      setAmount(val.toString());
    }
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid withdrawal amount.");
      return;
    }

    if (numAmount < 100) {
      setErrorMsg("Minimum withdrawal amount is ₹100.");
      return;
    }

    if (numAmount > balance) {
      setErrorMsg("Insufficient wallet balance.");
      return;
    }

    if (payoutMethod === "upi" && !upiId.trim()) {
      setErrorMsg("Please enter a valid UPI ID.");
      return;
    }

    if (payoutMethod === "bank" && (!accountNumber.trim() || !ifscCode.trim() || !accountHolder.trim())) {
      setErrorMsg("Please fill in all bank account details.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      
      const newTx = {
        id: `WDR-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: numAmount,
        date: "Just now",
        method: payoutMethod === "upi" ? `UPI: ${upiId.trim()}` : `Bank: ${accountNumber.trim().slice(-4)}`,
        status: "Pending"
      };

      setTransactions([newTx, ...transactions]);
      setBalance((prev) => prev - numAmount);
      setPendingPayout((prev) => prev + numAmount);
      setSuccessMsg(`Withdrawal request for ₹${numAmount.toLocaleString("en-IN")} submitted successfully!`);
      setAmount("");
      setIsWithdrawOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-[430px] h-screen sm:h-[90vh] bg-[#FAF6F2] sm:rounded-[32px] overflow-hidden flex flex-col relative shadow-2xl border border-gray-100/50">
        
        {/* Top Navigation Header */}
        <div className="bg-gradient-to-r from-[#ff8f6c] via-[#ff7448] to-[#ff5c33] px-5 py-4 text-white flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            {isWithdrawOpen ? (
              <button 
                onClick={() => { setIsWithdrawOpen(false); setErrorMsg(""); }}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-[17px] font-bold leading-tight">
                {isWithdrawOpen ? "Withdraw Money" : "Astrologer Wallet"}
              </h2>
              <p className="text-[11px] text-white/80 font-medium">
                {isWithdrawOpen ? "Request instant payout to account" : "Manage earnings & payouts"}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          
          {/* Global Toast Messages */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-sm animate-slide-down">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-[13px] text-emerald-800 font-medium leading-snug">
                {successMsg}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm animate-slide-down">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-[13px] text-rose-800 font-medium leading-snug">
                {errorMsg}
              </div>
            </div>
          )}

          {/* SCREEN 1: Wallet Overview */}
          {!isWithdrawOpen ? (
            <>
              {/* Balance Card */}
              <div className="bg-gradient-to-tr from-[#1E1B4B] via-[#312E81] to-[#4338CA] rounded-[24px] p-5 text-white shadow-xl relative overflow-hidden flex flex-col gap-4">
                {/* Decorative background glow */}
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[#ff7448]/20 blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[12px] font-semibold text-indigo-200/90 tracking-wide uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Available Balance
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                    Verified
                  </span>
                </div>

                <div className="relative z-10">
                  <h1 className="text-[34px] font-extrabold tracking-tight text-white leading-none">
                    ₹ {balance.toLocaleString("en-IN")}
                    <span className="text-[18px] text-indigo-200 font-medium ml-1">.00</span>
                  </h1>
                </div>

                {/* Sub Stats Row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 relative z-10 text-[12px]">
                  <div>
                    <span className="text-indigo-200/70 block text-[10.5px]">Total Earned</span>
                    <span className="font-bold text-white text-[13.5px]">₹ {totalEarnings.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-indigo-200/70 block text-[10.5px]">Pending Payout</span>
                    <span className="font-bold text-amber-300 text-[13.5px]">₹ {pendingPayout.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Action Buttons (Strictly ONLY Withdraw - NO Add Money) */}
                <div className="pt-2 relative z-10">
                  <button
                    onClick={() => { setIsWithdrawOpen(true); setErrorMsg(""); setSuccessMsg(""); }}
                    className="w-full bg-gradient-to-r from-[#ff7448] to-[#ff5c33] hover:from-[#e6633b] hover:to-[#e64c24] text-white py-3.5 rounded-2xl font-bold text-[14.5px] shadow-lg shadow-[#ff7448]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    Withdraw Money
                  </button>
                </div>
              </div>

              {/* Security Banner */}
              <div className="bg-white rounded-2xl p-3.5 border border-gray-200/60 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-[12px]">
                  <span className="font-bold text-gray-800 block">Direct Bank & UPI Transfer</span>
                  <span className="text-gray-500">Withdrawals are processed securely within 24 hours.</span>
                </div>
              </div>

              {/* Transactions History Header */}
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-[15px] font-bold text-gray-800">Withdrawal History</h3>
                <span className="text-[12px] text-[#ff7448] font-semibold">Recent Payouts</span>
              </div>

              {/* Transactions List */}
              <div className="flex flex-col gap-2.5 pb-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center justify-between hover:border-gray-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        tx.status === "Completed" 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}>
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-bold text-gray-800">{tx.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            tx.status === "Completed" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 block mt-0.5">{tx.method} • {tx.date}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[14.5px] font-bold text-gray-900 block">- ₹ {tx.amount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* SCREEN 2: Withdraw Form (Strictly Withdraw - NO Add Money) */
            <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4 pb-4 animate-fade-in">
              
              {/* Available Balance Summary */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11.5px] text-gray-500 font-medium block">Available Balance</span>
                  <span className="text-[20px] font-extrabold text-gray-900">₹ {balance.toLocaleString("en-IN")}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#FFF0E6] text-[#ff7448] flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>

              {/* Amount Input */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex flex-col gap-3">
                <label className="text-[13px] font-bold text-gray-700">Enter Withdrawal Amount</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 text-[20px] font-bold">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-[#FAF6F2] border border-gray-200 rounded-xl py-3 pl-9 pr-4 text-[20px] font-extrabold text-gray-900 focus:outline-none focus:border-[#ff7448] transition-all"
                  />
                </div>

                {/* Quick Selection Chips */}
                <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                  {[500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all cursor-pointer flex-shrink-0 ${
                        amount === val.toString()
                          ? "bg-[#ff7448] text-white border-[#ff7448]"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      +₹{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleQuickAmount("all")}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all cursor-pointer flex-shrink-0 ${
                      amount === balance.toString()
                        ? "bg-[#ff7448] text-white border-[#ff7448]"
                        : "bg-[#FFF0E6] text-[#ff7448] border-[#ff7448]/30 hover:bg-[#FFE6D6]"
                    }`}
                  >
                    Withdraw All
                  </button>
                </div>
              </div>

              {/* Payout Method Selection */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex flex-col gap-3">
                <label className="text-[13px] font-bold text-gray-700">Select Payout Method</label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("upi")}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      payoutMethod === "upi"
                        ? "border-[#ff7448] bg-[#FFF0E6]/50 text-[#ff7448] shadow-sm"
                        : "border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100/50"
                    }`}
                  >
                    <QrCode className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[13px] font-bold">UPI Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMethod("bank")}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      payoutMethod === "bank"
                        ? "border-[#ff7448] bg-[#FFF0E6]/50 text-[#ff7448] shadow-sm"
                        : "border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100/50"
                    }`}
                  >
                    <Landmark className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[13px] font-bold">Bank Transfer</span>
                  </button>
                </div>

                {/* UPI Fields */}
                {payoutMethod === "upi" && (
                  <div className="flex flex-col gap-1.5 pt-2">
                    <label className="text-[12px] font-bold text-gray-600">Enter UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. astrologer@upi / googlepay"
                      className="w-full bg-[#FAF6F2] border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold text-gray-800 focus:outline-none focus:border-[#ff7448]"
                    />
                  </div>
                )}

                {/* Bank Fields */}
                {payoutMethod === "bank" && (
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-bold text-gray-600">Account Holder Name</label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="e.g. Astrologer Name"
                        className="w-full bg-[#FAF6F2] border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold text-gray-800 focus:outline-none focus:border-[#ff7448]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-bold text-gray-600">Bank Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 987654321098"
                        className="w-full bg-[#FAF6F2] border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold text-gray-800 focus:outline-none focus:border-[#ff7448]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-bold text-gray-600">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                        className="w-full bg-[#FAF6F2] border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold text-gray-800 focus:outline-none focus:border-[#ff7448]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Withdrawal Request Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#ff7448] to-[#ff5c33] hover:from-[#e6633b] hover:to-[#e64c24] text-white py-3.5 rounded-2xl font-bold text-[15px] shadow-lg shadow-[#ff7448]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    Processing Request...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5" />
                    Confirm & Request Payout
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
