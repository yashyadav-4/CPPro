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
  { step: '3', title: 'Update LeetCode', desc: 'Set your "Name" field to the code on your LC profile page' },
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
    <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm flex justify-center">
      <RefreshCw size={20} className="animate-spin text-amber-500" />
    </div>
  );

  /* LINKED STATE */
  if (lcState === LC_STATE.LINKED) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
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
      <div className="px-6 py-4 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/[0.08]">
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
          className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm">
          <label htmlFor="lc-handle-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LeetCode Username</label>
          <input id="lc-handle-input" type="text" value={handle} onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lcState === LC_STATE.IDLE && handleGenerateCode()}
            placeholder="e.g. your_leetcode_id" disabled={lcState !== LC_STATE.IDLE}
            className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white text-sm rounded-lg py-3 px-4 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />

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
              className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal size={16} className="text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Verification Code</h3>
                </div>
                <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] rounded-lg p-4 mb-5">
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
                      <><a href="https://leetcode.com/profile/" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 underline font-medium">leetcode.com/profile/</a> — open your profile page</>,
                      'Find the "Name" field and set it to the verification code above',
                      'Click "Save"',
                      'Come back here and click "Verify Account"',
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
          className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm sticky top-24">
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
   CodeChef Section — same flow, emerald color scheme
   ═══════════════════════════════════════════════════════════════ */
const CC_STATE = {
  LOADING: 'LOADING', LINKED: 'LINKED', IDLE: 'IDLE',
  GENERATING_CODE: 'GENERATING_CODE', WAITING_FOR_USER: 'WAITING_FOR_USER', VERIFYING: 'VERIFYING',
};

const CC_STEPS = [
  { step: '1', title: 'Enter Handle', desc: 'Input your CodeChef username in the field above' },
  { step: '2', title: 'Generate Code', desc: 'Click the button to get a unique verification code' },
  { step: '3', title: 'Update CodeChef', desc: 'Set your "Name" field to the code on CodeChef' },
  { step: '4', title: 'Verify', desc: "Click verify and we'll confirm the link automatically" },
];

function CodeChefSection() {
  const [handle, setHandle] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [ccState, setCcState] = useState(CC_STATE.LOADING);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkedHandle, setLinkedHandle] = useState('');
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/auth/verify', { withCredentials: true });
        const cc = res.data?.user?.linkedAccounts?.codechef;
        if (cc) { setLinkedHandle(cc); setCcState(CC_STATE.LINKED); }
        else setCcState(CC_STATE.IDLE);
      } catch { setCcState(CC_STATE.IDLE); }
    })();
  }, []);

  const getCcStepStatus = (index) => {
    const order = [CC_STATE.IDLE, CC_STATE.GENERATING_CODE, CC_STATE.WAITING_FOR_USER, CC_STATE.VERIFYING];
    const cur = order.indexOf(ccState);
    if (success && ccState === CC_STATE.VERIFYING) return 'done';
    if (index < cur) return 'done';
    if (index === cur) return 'active';
    return 'pending';
  };

  const handleGenerateCode = async () => {
    if (!handle.trim()) { setError('Please enter your CodeChef username'); return; }
    setError(''); setSuccess(''); setCcState(CC_STATE.GENERATING_CODE);
    try {
      const res = await axios.get('/api/settings/generate-cf-code', { withCredentials: true });
      if (res.data.success) { setSecretCode(res.data.code); setCcState(CC_STATE.WAITING_FOR_USER); }
      else throw new Error('Failed to generate code');
    } catch (err) {
      setCcState(CC_STATE.IDLE);
      setError(err.response?.data?.message || err.message || 'Failed to generate code');
    }
  };

  const handleVerify = async () => {
    setError(''); setSuccess(''); setCcState(CC_STATE.VERIFYING);
    try {
      const res = await axios.post('/api/settings/verify-cc', { handle: handle.trim() }, { withCredentials: true });
      if (res.data.success) {
        setSuccess(res.data.message || 'CodeChef account linked successfully!');
        setLinkedHandle(handle.trim());
      } else throw new Error(res.data.message || 'Verification failed');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
      setCcState(CC_STATE.WAITING_FOR_USER);
    }
  };

  const handleUnlink = async () => {
    setError(''); setShowUnlinkConfirm(false);
    try {
      const res = await axios.delete('/api/settings/unlink-cc', { withCredentials: true });
      if (res.data.success) {
        setLinkedHandle(''); setCcState(CC_STATE.IDLE); setSecretCode(''); setHandle('');
        setSuccess('CodeChef unlinked'); setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to unlink'); }
  };

  const handleReset = () => { setHandle(''); setSecretCode(''); setCcState(CC_STATE.IDLE); setError(''); setSuccess(''); setCopied(false); };
  const copyCode = () => { navigator.clipboard.writeText(secretCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const isVerified = success && ccState === CC_STATE.VERIFYING;
  const isCcLoading = ccState === CC_STATE.GENERATING_CODE || ccState === CC_STATE.VERIFYING;

  if (ccState === CC_STATE.LOADING) return (
    <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm flex justify-center">
      <RefreshCw size={20} className="animate-spin text-emerald-500" />
    </div>
  );

  if (ccState === CC_STATE.LINKED) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/30 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-0.5">Linked Account</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{linkedHandle}</h3>
            <a href={`https://www.codechef.com/users/${linkedHandle}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1">
              View on CodeChef <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/[0.08]">
        {!showUnlinkConfirm ? (
          <button onClick={() => setShowUnlinkConfirm(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            <Unlink size={14} /> Remove linked account
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={14} /> Remove CodeChef link?</span>
            <button onClick={handleUnlink} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">Yes, unlink</button>
            <button onClick={() => setShowUnlinkConfirm(false)} className="px-4 py-1.5 border border-gray-200 dark:border-white/[0.15] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
          className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm">
          <label htmlFor="cc-handle-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CodeChef Username</label>
          <input id="cc-handle-input" type="text" value={handle} onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ccState === CC_STATE.IDLE && handleGenerateCode()}
            placeholder="e.g. your_codechef_id" disabled={ccState !== CC_STATE.IDLE}
            className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white text-sm rounded-lg py-3 px-4 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex items-center gap-2 text-red-600 text-sm"><XCircle size={14} /> <span>{error}</span></motion.div>}
            {success && ccState === CC_STATE.IDLE && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex items-center gap-2 text-green-600 text-sm"><CheckCircle size={14} /> <span>{success}</span></motion.div>}
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap gap-3">
            {ccState === CC_STATE.IDLE && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerateCode}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <Fingerprint size={16} /> Generate Code
              </motion.button>
            )}
            {ccState === CC_STATE.WAITING_FOR_USER && !isVerified && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleVerify}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <Shield size={16} /> Verify Account
              </motion.button>
            )}
            {ccState === CC_STATE.GENERATING_CODE && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg">
                <RefreshCw size={14} className="animate-spin" /> Generating...
              </div>
            )}
            {ccState === CC_STATE.VERIFYING && !isVerified && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                <RefreshCw size={14} className="animate-spin" /> Verifying...
              </div>
            )}
            {ccState !== CC_STATE.IDLE && (
              <button onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-white/[0.15] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-medium rounded-lg transition-colors">
                Start Over
              </button>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {secretCode && (
            <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.4 }}
              className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Verification Code</h3>
                </div>
                <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] rounded-lg p-4 mb-5">
                  <code className="font-mono text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-wider select-all">{secretCode}</code>
                  <button onClick={copyCode}
                    className={`shrink-0 p-2 rounded-lg border transition-all duration-200 ${copied ? 'border-green-300 text-green-600 bg-green-50 dark:bg-green-500/15' : 'border-gray-200 dark:border-white/[0.15] text-gray-400 hover:text-emerald-600 hover:border-emerald-200'}`}>
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructions</p>
                  <ol className="space-y-2.5">
                    {[
                      <><a href="https://www.codechef.com/users/your_handle/edit" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 underline font-medium">codechef.com/users/your_handle/edit</a> — open your profile settings</>,
                      'Find the "Name" field under "Personal Details" and set it to the verification code above',
                      'Click "Save"',
                      'Come back here and click "Verify Account"',
                    ].map((txt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <a href="https://www.codechef.com/users/your_handle/edit" target="_blank" rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline group">
                  <ExternalLink size={14} /> Open CodeChef Settings <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    Your CodeChef username <span className="font-semibold">{handle}</span> has been linked to CPPro.
                    You can now restore your Name on CodeChef.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:col-span-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm sticky top-24">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">How it works</h3>
          <div className="space-y-1">
            {CC_STEPS.map((s, i) => {
              const status = getCcStepStatus(i);
              return (
                <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                  status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10' : status === 'done' ? 'bg-green-50/60 dark:bg-green-500/5' : ''
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    status === 'done' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                    : status === 'active' ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-400'
                  }`}>
                    {status === 'done' ? '✓' : s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${status === 'active' ? 'text-emerald-700 dark:text-emerald-400' : status === 'done' ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{s.title}</p>
                    <p className={`text-xs mt-0.5 ${status === 'active' ? 'text-emerald-500 dark:text-emerald-300' : status === 'done' ? 'text-green-500 dark:text-green-300' : 'text-gray-400 dark:text-gray-500'}`}>{s.desc}</p>
                  </div>
                  {status === 'active' && <ChevronRight size={14} className="text-emerald-400 mt-1 shrink-0" />}
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : isCcLoading ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {ccState === CC_STATE.IDLE && 'Ready'}
                {ccState === CC_STATE.GENERATING_CODE && 'Generating code...'}
                {ccState === CC_STATE.WAITING_FOR_USER && 'Waiting for you'}
                {ccState === CC_STATE.VERIFYING && (isVerified ? 'Verified ✓' : 'Checking...')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GeeksforGeeks Section — GFG green theme (#2F8D46 / #4ade80)
   ═══════════════════════════════════════════════════════════════ */
const GFG_LINK   = 'https://auth.geeksforgeeks.org/user/edit';
const GFG_PROFILE = (handle) => `https://www.geeksforgeeks.org/user/${handle}/`;

const GFG_VSTATE = {
  LOADING: 'LOADING', LINKED: 'LINKED', IDLE: 'IDLE',
  GENERATING_CODE: 'GENERATING_CODE', WAITING_FOR_USER: 'WAITING_FOR_USER', VERIFYING: 'VERIFYING',
};

const GFG_STEPS = [
  { step: '1', title: 'Enter Username', desc: 'Input your GFG username in the field above' },
  { step: '2', title: 'Generate Code', desc: 'Click the button to get a unique verification code' },
  { step: '3', title: 'Update GFG Profile', desc: 'Set your Display Name to the code on your GFG profile' },
  { step: '4', title: 'Verify', desc: "Click verify and we'll confirm the link automatically" },
];

const GFG_PRIMARY       = '#2F8D46';
const GFG_PRIMARY_DARK  = '#4ade80';

function GfgSection() {
  const [handle, setHandle]       = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [gfgVState, setGfgVState] = useState(GFG_VSTATE.LOADING);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [copied, setCopied]       = useState(false);
  const [linkedHandle, setLinkedHandle] = useState('');
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/auth/verify', { withCredentials: true });
        const gfg = res.data?.user?.linkedAccounts?.geeksforgeeks;
        if (gfg) { setLinkedHandle(gfg); setGfgVState(GFG_VSTATE.LINKED); }
        else setGfgVState(GFG_VSTATE.IDLE);
      } catch { setGfgVState(GFG_VSTATE.IDLE); }
    })();
  }, []);

  const getStepStatus = (index) => {
    const order = [GFG_VSTATE.IDLE, GFG_VSTATE.GENERATING_CODE, GFG_VSTATE.WAITING_FOR_USER, GFG_VSTATE.VERIFYING];
    const cur = order.indexOf(gfgVState);
    if (success && gfgVState === GFG_VSTATE.VERIFYING) return 'done';
    if (index < cur) return 'done';
    if (index === cur) return 'active';
    return 'pending';
  };

  const handleGenerateCode = async () => {
    if (!handle.trim()) { setError('Please enter your GFG username'); return; }
    setError(''); setSuccess(''); setGfgVState(GFG_VSTATE.GENERATING_CODE);
    try {
      const res = await axios.get('/api/settings/generate-gfg-code', { withCredentials: true });
      if (res.data.success) { setSecretCode(res.data.code); setGfgVState(GFG_VSTATE.WAITING_FOR_USER); }
      else throw new Error('Failed to generate code');
    } catch (err) {
      setGfgVState(GFG_VSTATE.IDLE);
      setError(err.response?.data?.message || err.message || 'Failed to generate code');
    }
  };

  const handleVerify = async () => {
    setError(''); setSuccess(''); setGfgVState(GFG_VSTATE.VERIFYING);
    try {
      const res = await axios.post('/api/settings/verify-gfg', { handle: handle.trim() }, { withCredentials: true });
      if (res.data.success) {
        setSuccess(res.data.message || 'GFG account linked successfully!');
        setLinkedHandle(handle.trim());
      } else throw new Error(res.data.message || 'Verification failed');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
      setGfgVState(GFG_VSTATE.WAITING_FOR_USER);
    }
  };

  const handleUnlink = async () => {
    setError(''); setShowUnlinkConfirm(false);
    try {
      const res = await axios.delete('/api/settings/unlink-gfg', { withCredentials: true });
      if (res.data.success) {
        setLinkedHandle(''); setGfgVState(GFG_VSTATE.IDLE); setSecretCode(''); setHandle('');
        setSuccess('GFG unlinked'); setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to unlink'); }
  };

  const handleReset = () => { setHandle(''); setSecretCode(''); setGfgVState(GFG_VSTATE.IDLE); setError(''); setSuccess(''); setCopied(false); };
  const copyCode = () => { navigator.clipboard.writeText(secretCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const isVerified = success && gfgVState === GFG_VSTATE.VERIFYING;
  const isGfgLoading = gfgVState === GFG_VSTATE.GENERATING_CODE || gfgVState === GFG_VSTATE.VERIFYING;

  if (gfgVState === GFG_VSTATE.LOADING) return (
    <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm flex justify-center">
      <RefreshCw size={20} className="animate-spin" style={{ color: GFG_PRIMARY }} />
    </div>
  );

  /* LINKED STATE */
  if (gfgVState === GFG_VSTATE.LINKED) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/30 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: GFG_PRIMARY }}>Linked Account</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{linkedHandle}</h3>
            <a href={GFG_PROFILE(linkedHandle)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs hover:underline mt-1" style={{ color: GFG_PRIMARY }}>
              View on GFG <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/[0.08]">
        {!showUnlinkConfirm ? (
          <button onClick={() => setShowUnlinkConfirm(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            <Unlink size={14} /> Remove linked account
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={14} /> Remove GFG link?</span>
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
          className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm">
          <label htmlFor="gfg-handle-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GFG Username</label>
          <input id="gfg-handle-input" type="text" value={handle} onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && gfgVState === GFG_VSTATE.IDLE && handleGenerateCode()}
            placeholder="e.g. your_gfg_username" disabled={gfgVState !== GFG_VSTATE.IDLE}
            className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white text-sm rounded-lg py-3 px-4 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ '--tw-ring-color': `${GFG_PRIMARY}33` }}
            onFocus={e => { e.target.style.borderColor = GFG_PRIMARY; e.target.style.boxShadow = `0 0 0 2px ${GFG_PRIMARY}22`; }}
            onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
          />

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex items-center gap-2 text-red-600 text-sm"><XCircle size={14} /> <span>{error}</span></motion.div>}
            {success && gfgVState === GFG_VSTATE.IDLE && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex items-center gap-2 text-green-600 text-sm"><CheckCircle size={14} /> <span>{success}</span></motion.div>}
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap gap-3">
            {gfgVState === GFG_VSTATE.IDLE && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerateCode}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                style={{ backgroundColor: GFG_PRIMARY }}>
                <Fingerprint size={16} /> Generate Code
              </motion.button>
            )}
            {gfgVState === GFG_VSTATE.WAITING_FOR_USER && !isVerified && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleVerify}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <Shield size={16} /> Verify Account
              </motion.button>
            )}
            {gfgVState === GFG_VSTATE.GENERATING_CODE && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg"
                style={{ backgroundColor: `${GFG_PRIMARY}18`, color: GFG_PRIMARY }}>
                <RefreshCw size={14} className="animate-spin" /> Generating...
              </div>
            )}
            {gfgVState === GFG_VSTATE.VERIFYING && !isVerified && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                <RefreshCw size={14} className="animate-spin" /> Verifying...
              </div>
            )}
            {gfgVState !== GFG_VSTATE.IDLE && (
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
              className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal size={16} style={{ color: GFG_PRIMARY }} />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Verification Code</h3>
                </div>
                <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] rounded-lg p-4 mb-5">
                  <code className="font-mono text-xl sm:text-2xl font-bold tracking-wider select-all" style={{ color: GFG_PRIMARY }}>{secretCode}</code>
                  <button onClick={copyCode}
                    className={`shrink-0 p-2 rounded-lg border transition-all duration-200 ${copied ? 'border-green-300 text-green-600 bg-green-50 dark:bg-green-500/15' : 'border-gray-200 dark:border-white/[0.15] text-gray-400'}`}>
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructions</p>
                  <ol className="space-y-2.5">
                    {[
                      <><a href={GFG_LINK} target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: GFG_PRIMARY }}>auth.geeksforgeeks.org/user/edit</a> — open your GFG profile settings</>,
                      'Find the "Name (Display Name)" field and set it to the verification code above',
                      'Save your profile',
                      'Come back here and click "Verify Account"',
                    ].map((txt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 text-white" style={{ backgroundColor: GFG_PRIMARY }}>{i + 1}</span>
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <a href={GFG_LINK} target="_blank" rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:underline group" style={{ color: GFG_PRIMARY }}>
                  <ExternalLink size={14} /> Open GFG Profile Settings <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
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
                    Your GFG username <span className="font-semibold">{handle}</span> has been linked to CPPro.
                    You can now restore your Display Name on GFG.
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
          className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm sticky top-24">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">How it works</h3>
          <div className="space-y-1">
            {GFG_STEPS.map((s, i) => {
              const status = getStepStatus(i);
              return (
                <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                  status === 'active' ? 'dark:bg-green-500/10' : status === 'done' ? 'bg-green-50/60 dark:bg-green-500/5' : ''
                }`} style={status === 'active' ? { backgroundColor: `${GFG_PRIMARY}10` } : {}}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    status === 'done' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-400'
                  }`} style={status === 'active' ? { backgroundColor: GFG_PRIMARY, color: '#fff' } : {}}>
                    {status === 'done' ? '✓' : s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${status === 'done' ? 'text-green-700 dark:text-green-400' : status === 'active' ? '' : 'text-gray-500 dark:text-gray-400'}`}
                      style={status === 'active' ? { color: GFG_PRIMARY } : {}}>{s.title}</p>
                    <p className={`text-xs mt-0.5 ${status === 'done' ? 'text-green-500 dark:text-green-300' : 'text-gray-400 dark:text-gray-500'}`}
                      style={status === 'active' ? { color: `${GFG_PRIMARY}cc` } : {}}>{s.desc}</p>
                  </div>
                  {status === 'active' && <ChevronRight size={14} className="mt-1 shrink-0" style={{ color: GFG_PRIMARY }} />}
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : isGfgLoading ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {gfgVState === GFG_VSTATE.IDLE && 'Ready'}
                {gfgVState === GFG_VSTATE.GENERATING_CODE && 'Generating code...'}
                {gfgVState === GFG_VSTATE.WAITING_FOR_USER && 'Waiting for you'}
                {gfgVState === GFG_VSTATE.VERIFYING && (isVerified ? 'Verified ✓' : 'Checking...')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


export default function Verification() {
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
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex justify-center items-center">
        <RefreshCw size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#0a0a0a] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">

        {/* ── Redesigned Page Header ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10">
          {/* Top badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-4">
            <Shield size={11} />
            Account Verification
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            Link Your Platforms
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
            Connect your competitive programming accounts to unlock unified stats, leaderboard scores, and cross-platform insights.
          </p>

          {/* Platform pills row */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {[
              { label: 'Codeforces', color: '#4f83cc', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-700 dark:text-blue-300', abbr: 'CF' },
              { label: 'LeetCode',   color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-700 dark:text-amber-300', abbr: 'LC' },
              { label: 'CodeChef',   color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', abbr: 'CC' },
              { label: 'GeeksforGeeks', color: '#2F8D46', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20', text: 'text-green-700 dark:text-green-300', abbr: 'GFG' },
            ].map(p => (
              <span key={p.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${p.bg} ${p.border} ${p.text}`}>
                <span className="w-4 h-4 rounded text-white flex items-center justify-center font-black text-[9px]" style={{ backgroundColor: p.color }}>{p.abbr}</span>
                {p.label}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="space-y-10">

          {/* ═══════ CODEFORCES SECTION ═══════ */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-black">CF</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-none">Codeforces</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Set your First Name (English) to the code</p>
              </div>
              {state === STATE.LINKED && (
                <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400">
                  <CheckCircle size={11} /> Verified
                </span>
              )}
            </div>

            {/* LINKED STATE */}
            {state === STATE.LINKED && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
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
                  <div className="px-6 py-4 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/[0.08]">
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
                    className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm">
                    <label htmlFor="cf-handle-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Codeforces Handle</label>
                    <input id="cf-handle-input" type="text" value={handle} onChange={e => setHandle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && state === STATE.IDLE && handleGenerateCode()}
                      placeholder="e.g. tourist" disabled={state !== STATE.IDLE}
                      className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white text-sm rounded-lg py-3 px-4 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />

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
                        className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Terminal size={16} className="text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Verification Code</h3>
                          </div>
                          <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] rounded-lg p-4 mb-5">
                            <code className="font-mono text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider select-all">{secretCode}</code>
                            <button onClick={copyCode}
                              className={`shrink-0 p-2 rounded-lg border transition-all duration-200 ${copied ? 'border-green-300 text-green-600 bg-green-50 dark:bg-green-500/15' : 'border-gray-200 dark:border-white/[0.15] text-gray-400 hover:text-indigo-600 hover:border-indigo-200'}`}>
                              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructions</p>
                            <ol className="space-y-2.5">
                              {[
                                <><a href="https://codeforces.com/settings/social" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-medium">codeforces.com/settings/social</a> — open your social settings</>,
                                'Find "First Name (English)" and set it to the code above',
                                'Click "Save"',
                                'Come back here and click "Verify Account"',
                              ].map((txt, i) => (
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
                    className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm sticky top-24">
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
          <div className="border-t border-gray-200 dark:border-white/[0.06]" />

          {/* ═══════ LEETCODE SECTION ═══════ */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-black">LC</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-none">LeetCode</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Set your Name field to the code on your profile</p>
              </div>
            </div>
            <LeetCodeSection />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-white/[0.06]" />

          {/* ═══════ CODECHEF SECTION ═══════ */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-black">CC</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-none">CodeChef</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Set your Name field to the code on your profile</p>
              </div>
            </div>
            <CodeChefSection />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-white/[0.06]" />

          {/* ═══════ GFG SECTION ═══════ */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#2F8D46' }}>
                <span className="text-white text-[10px] font-black">GFG</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-none">GeeksforGeeks</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Set your Display Name to the code on your GFG profile</p>
              </div>
            </div>
            <GfgSection />
          </div>

        </div>
      </div>
    </div>
  );
}

