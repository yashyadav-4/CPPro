import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, Copy, ExternalLink,
  ChevronRight, RefreshCw, Fingerprint, Terminal,
  ArrowRight, Unlink, AlertTriangle, User, Link2
} from 'lucide-react';

const STATE = {
  LOADING: 'LOADING',
  LINKED: 'LINKED',
  IDLE: 'IDLE',
  GENERATING_CODE: 'GENERATING_CODE',
  WAITING_FOR_USER: 'WAITING_FOR_USER',
  VERIFYING: 'VERIFYING',
};

const CF_STEPS = [
  { step: '1', title: 'Enter Handle', desc: 'Input your Codeforces username in the field above' },
  { step: '2', title: 'Generate Code', desc: 'Click the button to get a unique verification code' },
  { step: '3', title: 'Update Codeforces', desc: 'Set your First Name (English) to the code on Codeforces' },
  { step: '4', title: 'Verify', desc: "Click verify and we'll confirm the link automatically" },
];

/* ═══════════════════════════════════════════════════════════════
   LeetCode Section — full step-by-step code verification flow
   (mirrors the Codeforces flow exactly)
   ═══════════════════════════════════════════════════════════════ */
const LC_STATE = {
  LOADING: 'LOADING', LINKED: 'LINKED', IDLE: 'IDLE',
  GENERATING_CODE: 'GENERATING_CODE', WAITING_FOR_USER: 'WAITING_FOR_USER', VERIFYING: 'VERIFYING',
};

const LC_STEPS = [
  { step: '1', title: 'Enter Username', desc: 'Input your LeetCode username in the field above' },
  { step: '2', title: 'Generate Code', desc: 'Click the button to get a unique verification code' },
  { step: '3', title: 'Update LeetCode', desc: 'Set your "Display Name" to the code on LeetCode' },
  { step: '4', title: 'Verify', desc: "Click verify and we'll confirm the link automatically" },
];

function LeetCodeSection() {
  const [handle, setHandle] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [lcState, setLcState] = useState(LC_STATE.LOADING);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkedHandle, setLinkedHandle] = useState('');
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/auth/verify', { withCredentials: true });
        const lc = res.data?.user?.linkedAccounts?.leetcode;
        if (lc) { setLinkedHandle(lc); setLcState(LC_STATE.LINKED); }
        else setLcState(LC_STATE.IDLE);
      } catch { setLcState(LC_STATE.IDLE); }
    })();
  }, []);

  const getLcStepStatus = (index) => {
    const order = [LC_STATE.IDLE, LC_STATE.GENERATING_CODE, LC_STATE.WAITING_FOR_USER, LC_STATE.VERIFYING];
    const cur = order.indexOf(lcState);
    if (success && lcState === LC_STATE.VERIFYING) return 'done';
    if (index < cur) return 'done';
    if (index === cur) return 'active';
    return 'pending';
  };

  const handleGenerateCode = async () => {
    if (!handle.trim()) { setError('Please enter your LeetCode username'); return; }
    setError(''); setSuccess(''); setLcState(LC_STATE.GENERATING_CODE);
    try {
      const res = await axios.get('/api/settings/generate-cf-code', { withCredentials: true });
      if (res.data.success) { setSecretCode(res.data.code); setLcState(LC_STATE.WAITING_FOR_USER); }
      else throw new Error('Failed to generate code');
    } catch (err) {
      setLcState(LC_STATE.IDLE);
      setError(err.response?.data?.message || err.message || 'Failed to generate code');
    }
  };

  const handleVerify = async () => {
    setError(''); setSuccess(''); setLcState(LC_STATE.VERIFYING);
    try {
      const res = await axios.post('/api/settings/verify-lc', { handle: handle.trim() }, { withCredentials: true });
      if (res.data.success) {
        setSuccess(res.data.message || 'LeetCode account linked successfully!');
        setLinkedHandle(handle.trim());
      } else throw new Error(res.data.message || 'Verification failed');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
      setLcState(LC_STATE.WAITING_FOR_USER);
    }
  };

  const handleUnlink = async () => {
    setError(''); setShowUnlinkConfirm(false);
    try {
      const res = await axios.delete('/api/settings/unlink-lc', { withCredentials: true });
      if (res.data.success) {
        setLinkedHandle(''); setLcState(LC_STATE.IDLE); setSecretCode(''); setHandle('');
        setSuccess('LeetCode unlinked'); setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to unlink'); }
  };

  const handleReset = () => { setHandle(''); setSecretCode(''); setLcState(LC_STATE.IDLE); setError(''); setSuccess(''); setCopied(false); };
  const copyCode = () => { navigator.clipboard.writeText(secretCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const isVerified = success && lcState === LC_STATE.VERIFYING;
  const isLcLoading = lcState === LC_STATE.GENERATING_CODE || lcState === LC_STATE.VERIFYING;

  if (lcState === LC_STATE.LOADING) return (
    <div className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm flex justify-center">
      <RefreshCw size={20} className="animate-spin text-amber-500" />
    </div>
  );

  /* LINKED STATE */
  if (lcState === LC_STATE.LINKED) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/30 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-0.5">Linked Account</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{linkedHandle}</h3>
            <a href={`https://leetcode.com/u/${linkedHandle}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline mt-1">
              View on LeetCode <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-white/[0.08]">
        {!showUnlinkConfirm ? (
          <button onClick={() => setShowUnlinkConfirm(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            <Unlink size={14} /> Remove linked account
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={14} /> Remove LeetCode link?</span>
            <button onClick={handleUnlink} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">Yes, unlink</button>
            <button onClick={() => setShowUnlinkConfirm(false)} className="px-4 py-1.5 border border-gray-200 dark:border-white/[0.15] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
          </div>
        )}
      </div>
    </motion.div>
  );

  /* VERIFICATION FLOW */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        {/* Handle Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
          className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm">
          <label htmlFor="lc-handle-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LeetCode Username</label>
          <input id="lc-handle-input" type="text" value={handle} onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lcState === LC_STATE.IDLE && handleGenerateCode()}
            placeholder="e.g. your_leetcode_id" disabled={lcState !== LC_STATE.IDLE}
            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white text-sm rounded-lg py-3 px-4 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex items-center gap-2 text-red-600 text-sm"><XCircle size={14} /> <span>{error}</span></motion.div>}
            {success && lcState === LC_STATE.IDLE && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex items-center gap-2 text-green-600 text-sm"><CheckCircle size={14} /> <span>{success}</span></motion.div>}
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap gap-3">
            {lcState === LC_STATE.IDLE && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerateCode}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <Fingerprint size={16} /> Generate Code
              </motion.button>
            )}
            {lcState === LC_STATE.WAITING_FOR_USER && !isVerified && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleVerify}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <Shield size={16} /> Verify Account
              </motion.button>
            )}
            {lcState === LC_STATE.GENERATING_CODE && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg">
                <RefreshCw size={14} className="animate-spin" /> Generating...
              </div>
            )}
            {lcState === LC_STATE.VERIFYING && !isVerified && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                <RefreshCw size={14} className="animate-spin" /> Verifying...
              </div>
            )}
            {lcState !== LC_STATE.IDLE && (
              <button onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-white/[0.15] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-medium rounded-lg transition-colors">
                Start Over
              </button>
            )}
          </div>
        </motion.div>

        {/* Secret Code Display */}
        <AnimatePresence>
          {secretCode && (
            <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.4 }}
              className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal size={16} className="text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Verification Code</h3>
                </div>
                <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/[0.08] rounded-lg p-4 mb-5">
                  <code className="font-mono text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-wider select-all">{secretCode}</code>
                  <button onClick={copyCode}
                    className={`shrink-0 p-2 rounded-lg border transition-all duration-200 ${copied ? 'border-green-300 text-green-600 bg-green-50 dark:bg-green-500/15' : 'border-gray-200 dark:border-white/[0.15] text-gray-400 hover:text-amber-600 hover:border-amber-200'}`}>
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructions</p>
                  <ol className="space-y-2.5">
                    {[
                      'Go to leetcode.com and click your avatar → "Edit Profile"',
                      'Find the "Basic Info" section',
                      'Change the "Display Name" field to the verification code above',
                      'Click "Save", then come back here and click "Verify Account"',
                    ].map((txt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <a href="https://leetcode.com/profile/" target="_blank" rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline group">
                  <ExternalLink size={14} /> Open LeetCode Profile <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Banner */}
        <AnimatePresence>
          {isVerified && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-1">Account Verified!</h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Your LeetCode username <span className="font-semibold">{handle}</span> has been linked to CPPro.
                    You can now restore your Name on LeetCode.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Steps Sidebar */}
      <div className="lg:col-span-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm sticky top-24">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">How it works</h3>
          <div className="space-y-1">
            {LC_STEPS.map((s, i) => {
              const status = getLcStepStatus(i);
              return (
                <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                  status === 'active' ? 'bg-amber-50 dark:bg-amber-500/10' : status === 'done' ? 'bg-green-50/60 dark:bg-green-500/5' : ''
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    status === 'done' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                    : status === 'active' ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-400'
                  }`}>
                    {status === 'done' ? '✓' : s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${status === 'active' ? 'text-amber-700 dark:text-amber-400' : status === 'done' ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{s.title}</p>
                    <p className={`text-xs mt-0.5 ${status === 'active' ? 'text-amber-500 dark:text-amber-300' : status === 'done' ? 'text-green-500 dark:text-green-300' : 'text-gray-400 dark:text-gray-500'}`}>{s.desc}</p>
                  </div>
                  {status === 'active' && <ChevronRight size={14} className="text-amber-400 mt-1 shrink-0" />}
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : isLcLoading ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {lcState === LC_STATE.IDLE && 'Ready'}
                {lcState === LC_STATE.GENERATING_CODE && 'Generating code...'}
                {lcState === LC_STATE.WAITING_FOR_USER && 'Waiting for you'}
                {lcState === LC_STATE.VERIFYING && (isVerified ? 'Verified ✓' : 'Checking...')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Verification Page
   ═══════════════════════════════════════════════════════════════ */
export default function VerifyCodeforces() {
  const [handle, setHandle] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [state, setState] = useState(STATE.LOADING);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkedHandle, setLinkedHandle] = useState('');
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get('/api/auth/verify', { withCredentials: true });
        const user = res.data?.user;
        if (user?.linkedAccounts?.codeforces) {
          setLinkedHandle(user.linkedAccounts.codeforces);
          setState(STATE.LINKED);
        } else {
          setState(STATE.IDLE);
        }
      } catch {
        setState(STATE.IDLE);
      }
    };
    fetchStatus();
  }, []);

  const getStepStatus = (index) => {
    const stateOrder = [STATE.IDLE, STATE.GENERATING_CODE, STATE.WAITING_FOR_USER, STATE.VERIFYING];
    const currentIndex = stateOrder.indexOf(state);
    if (success && state === STATE.VERIFYING) return 'done';
    if (index < currentIndex) return 'done';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  const handleGenerateCode = async () => {
    if (!handle.trim()) { setError('Please enter your Codeforces handle'); return; }
    setError(''); setSuccess(''); setState(STATE.GENERATING_CODE);
    try {
      const res = await axios.get('/api/settings/generate-cf-code', { withCredentials: true });
      if (res.data.success) { setSecretCode(res.data.code); setState(STATE.WAITING_FOR_USER); }
      else throw new Error('Failed to generate code');
    } catch (err) {
      setState(STATE.IDLE);
      setError(err.response?.data?.message || err.message || 'Failed to generate code');
    }
  };

  const handleVerify = async () => {
    setError(''); setSuccess(''); setState(STATE.VERIFYING);
    try {
      const res = await axios.post('/api/settings/verify-cf', { handle: handle.trim() }, { withCredentials: true });
      if (res.data.success) {
        setSuccess(res.data.message || 'Account linked successfully!');
        setLinkedHandle(handle.trim());
      } else throw new Error(res.data.message || 'Verification failed');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
      setState(STATE.WAITING_FOR_USER);
    }
  };

  const handleUnlink = async () => {
    setError(''); setShowUnlinkConfirm(false);
    try {
      const res = await axios.delete('/api/settings/unlink-cf', { withCredentials: true });
      if (res.data.success) {
        setLinkedHandle(''); setState(STATE.IDLE); setSecretCode(''); setHandle('');
        setSuccess('Account unlinked successfully'); setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to unlink account');
    }
  };

  const handleReset = () => { setHandle(''); setSecretCode(''); setState(STATE.IDLE); setError(''); setSuccess(''); setCopied(false); };
  const copyCode = () => { navigator.clipboard.writeText(secretCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const isVerified = success && state === STATE.VERIFYING;
  const isLoading = state === STATE.GENERATING_CODE || state === STATE.VERIFYING;

  if (state === STATE.LOADING) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] flex justify-center items-center">
        <RefreshCw size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Link your competitive programming accounts to CPPro</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">

          {/* ═══════ CODEFORCES SECTION ═══════ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-black">CF</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Codeforces</h2>
              {state === STATE.LINKED && (
                <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400">
                  <CheckCircle size={12} /> Verified
                </span>
              )}
            </div>

            {/* LINKED STATE */}
            {state === STATE.LINKED && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                <div className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/30 flex items-center justify-center">
                          <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-0.5">Linked Account</p>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{linkedHandle}</h3>
                          <a href={`https://codeforces.com/profile/${linkedHandle}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1">
                            View on Codeforces <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-white/[0.08]">
                    {!showUnlinkConfirm ? (
                      <button onClick={() => setShowUnlinkConfirm(true)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                        <Unlink size={14} /> Remove linked account
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={14} /> This will remove your linked Codeforces data. Continue?</span>
                        <button onClick={handleUnlink} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">Yes, unlink</button>
                        <button onClick={() => setShowUnlinkConfirm(false)} className="px-4 py-1.5 border border-gray-200 dark:border-white/[0.15] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* UNLINKED / VERIFICATION FLOW */}
            {state !== STATE.LINKED && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                    className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm">
                    <label htmlFor="cf-handle-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Codeforces Handle</label>
                    <input id="cf-handle-input" type="text" value={handle} onChange={e => setHandle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && state === STATE.IDLE && handleGenerateCode()}
                      placeholder="e.g. tourist" disabled={state !== STATE.IDLE}
                      className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white text-sm rounded-lg py-3 px-4 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                          <XCircle size={14} /> <span>{error}</span>
                        </motion.div>
                      )}
                      {success && state === STATE.IDLE && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle size={14} /> <span>{success}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {state === STATE.IDLE && (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerateCode}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                          <Fingerprint size={16} /> Generate Code
                        </motion.button>
                      )}
                      {state === STATE.WAITING_FOR_USER && !isVerified && (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleVerify}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                          <Shield size={16} /> Verify Account
                        </motion.button>
                      )}
                      {state === STATE.GENERATING_CODE && (
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-lg">
                          <RefreshCw size={14} className="animate-spin" /> Generating...
                        </div>
                      )}
                      {state === STATE.VERIFYING && !isVerified && (
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                          <RefreshCw size={14} className="animate-spin" /> Verifying...
                        </div>
                      )}
                      {state !== STATE.IDLE && (
                        <button onClick={handleReset}
                          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-white/[0.15] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-medium rounded-lg transition-colors">
                          Start Over
                        </button>
                      )}
                    </div>
                  </motion.div>

                  {/* Secret Code */}
                  <AnimatePresence>
                    {secretCode && (
                      <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.4 }}
                        className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Terminal size={16} className="text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Verification Code</h3>
                          </div>
                          <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/[0.08] rounded-lg p-4 mb-5">
                            <code className="font-mono text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider select-all">{secretCode}</code>
                            <button onClick={copyCode}
                              className={`shrink-0 p-2 rounded-lg border transition-all duration-200 ${copied ? 'border-green-300 text-green-600 bg-green-50 dark:bg-green-500/15' : 'border-gray-200 dark:border-white/[0.15] text-gray-400 hover:text-indigo-600 hover:border-indigo-200'}`}>
                              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructions</p>
                            <ol className="space-y-2.5">
                              {['Go to codeforces.com and open Settings', 'Navigate to the "Social" tab', 'Change "First Name (English)" to the code above', 'Save changes, then come back and click "Verify Account"'].map((txt, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                                  <span>{txt}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                          <a href="https://codeforces.com/settings/social" target="_blank" rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline group">
                            <ExternalLink size={14} /> Open Codeforces Settings <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success Banner */}
                  <AnimatePresence>
                    {isVerified && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-1">Account Verified!</h3>
                            <p className="text-sm text-green-700 dark:text-green-400">
                              Your Codeforces handle <span className="font-semibold">{handle}</span> has been linked to CPPro.
                              You can now restore your First Name on Codeforces.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Steps Sidebar */}
                <div className="lg:col-span-2">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                    className="bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm sticky top-24">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">How it works</h3>
                    <div className="space-y-1">
                      {CF_STEPS.map((s, i) => {
                        const status = getStepStatus(i);
                        return (
                          <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                            status === 'active' ? 'bg-indigo-50 dark:bg-indigo-500/10' : status === 'done' ? 'bg-green-50/60 dark:bg-green-500/5' : ''
                          }`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                              status === 'done' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                              : status === 'active' ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-400'
                            }`}>
                              {status === 'done' ? '✓' : s.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${status === 'active' ? 'text-indigo-700 dark:text-indigo-400' : status === 'done' ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{s.title}</p>
                              <p className={`text-xs mt-0.5 ${status === 'active' ? 'text-indigo-500 dark:text-indigo-300' : status === 'done' ? 'text-green-500 dark:text-green-300' : 'text-gray-400 dark:text-gray-500'}`}>{s.desc}</p>
                            </div>
                            {status === 'active' && <ChevronRight size={14} className="text-indigo-400 mt-1 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {state === STATE.IDLE && 'Ready'}
                          {state === STATE.GENERATING_CODE && 'Generating code...'}
                          {state === STATE.WAITING_FOR_USER && 'Waiting for you'}
                          {state === STATE.VERIFYING && (isVerified ? 'Verified ✓' : 'Checking...')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-white/[0.08]" />

          {/* ═══════ LEETCODE SECTION ═══════ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center">
                <span className="text-white text-xs font-black">LC</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">LeetCode</h2>
            </div>
            <LeetCodeSection />
          </div>

        </div>
      </div>
    </div>
  );
}
