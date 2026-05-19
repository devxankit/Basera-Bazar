import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { registerFCMToken } from "../../services/pushNotificationService";
import { toast } from "../../mockToast";

export default function ExecutiveLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") {
      value = value.replace(/\s+/g, "").replace(/^\+91/, "");
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post("/executive/login", formData);

      if (response.data.success) {
        toast.success("Welcome back, Executive!");
        // Small delay before login to ensure toast is seen and state settles
        setTimeout(() => {
          const execData = response.data.executive || response.data.data;
          login(execData, response.data.token);
          // Explicitly trigger FCM registration after login
          registerFCMToken(true);
          navigate("/executive/dashboard");
        }, 800);
      }
    } catch (error) {
      // Defensive logging to avoid extension noise
      if (error.name !== "FrameDoesNotExistError") {
        console.error("Login failed:", error);
      }

      if (
        error.response?.status === 403 &&
        error.response?.data?.code === "ACCOUNT_INACTIVE"
      ) {
        setShowInactiveModal(true);
      } else if (
        error.response?.status === 404 ||
        error.response?.data?.message?.toLowerCase().includes("not found")
      ) {
        setShowNotFoundModal(true);
      } else {
        toast.error(error.response?.data?.message || "Invalid credentials");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#fa8639]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative px-6 pt-10 pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-medium text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 font-normal text-sm">
            Sign in to your executive dashboard to continue.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="grow px-6 pb-12">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Phone Input */}
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Phone Number
                </label>
                <div className="group relative transition-all duration-300">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
                    <Phone
                      className="text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                      size={16}
                    />
                    <span className="text-slate-900 font-medium text-sm sm:text-[15px] border-r border-slate-100 pr-2 sm:pr-3 leading-none">
                      +91
                    </span>
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10 digits"
                    className="w-full bg-slate-50/50 border border-slate-100 py-4 sm:py-4.5 pl-24 sm:pl-28 pr-6 rounded-xl sm:rounded-[1.25rem] text-sm sm:text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Secure Password
                </label>
                <div className="group relative transition-all duration-300">
                  <Lock
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                    size={16}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-100 py-4 sm:py-4.5 pl-12 sm:pl-14 pr-12 sm:pr-14 rounded-xl sm:rounded-[1.25rem] text-sm sm:text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 text-white font-medium rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50">
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
            <p className="text-xs sm:text-[13px] font-medium text-slate-400">
              New to Basera Bazar Executive?
            </p>
            <Link
              to="/executive/register"
              className="w-full py-3.5 sm:py-4 border-2 border-indigo-50 text-indigo-600 font-medium rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-50/50 transition-all text-sm sm:text-base uppercase tracking-widest">
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </div>

      {/* ── ACCOUNT NOT FOUND MODAL ── */}
      <AnimatePresence>
        {showNotFoundModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowNotFoundModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
              <div className="w-20 h-20 bg-indigo-50 rounded-4xl flex items-center justify-center mb-6 text-indigo-600">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">
                Account Not Found
              </h3>
              <p className="text-slate-500 font-medium text-[15px] leading-relaxed mb-10">
                We couldn't find an executive account with these details. Would
                you like to create a new one instead?
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => navigate("/executive/register")}
                  className="w-full py-4.5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all active:scale-[0.98] text-[12px] uppercase tracking-widest">
                  CREATE NEW ACCOUNT
                </button>
                <button
                  onClick={() => setShowNotFoundModal(false)}
                  className="w-full py-4 text-slate-400 font-black hover:text-slate-900 transition-all text-[11px] uppercase tracking-[0.2em]">
                  GO BACK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="mt-auto pb-8 text-center">
        <p className="text-[11px] font-medium text-slate-300 uppercase tracking-widest">
          Powered by Basera Bazar Team
        </p>
      </div>
    </div>
  );
}
