import React, { useState } from 'react';
import { Cloud, X, Copy, Check, Server, Terminal, Box, Globe, ExternalLink } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'render' | 'railway' | 'vercel' | 'docker'>('render');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Cloud Deployment Guide</h3>
              <p className="text-xs text-slate-500">Deploy your complete AI Full-Stack app to the cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 text-xs font-bold gap-2 pt-2">
          {[
            { id: 'render', label: 'Render.com', icon: Server },
            { id: 'railway', label: 'Railway.app', icon: Globe },
            { id: 'docker', label: 'Docker (Any Cloud)', icon: Box },
            { id: 'vercel', label: 'Vercel', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  active
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'render' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 text-sky-950">
                <span className="font-bold block mb-1">Recommended for Full-Stack: Render Web Service</span>
                Render automatically builds the React client and runs the Express backend + SQLite database in one unified container!
              </div>

              <ol className="space-y-3 list-decimal list-inside text-slate-700 font-medium leading-relaxed">
                <li>Push this repository to your GitHub account (`git push origin main`).</li>
                <li>Go to <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">dashboard.render.com</a> and click <strong>New → Web Service</strong>.</li>
                <li>Connect your repository and choose <strong>Node</strong> environment.</li>
                <li>
                  Configure the build and start commands:
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono flex items-center justify-between">
                      <span>Build Command: <strong className="text-emerald-400">npm run build</strong></span>
                      <button
                        onClick={() => copyToClipboard('npm run build', 'render-build')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedIndex === 'render-build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono flex items-center justify-between">
                      <span>Start Command: <strong className="text-emerald-400">npm start</strong></span>
                      <button
                        onClick={() => copyToClipboard('npm start', 'render-start')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedIndex === 'render-start' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </li>
                <li>
                  Add Environment Variables in Render:
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600 pl-2">
                    <li><code>NODE_ENV = production</code></li>
                    <li><code>JWT_SECRET = [generate any random string]</code></li>
                    <li><code>GEMINI_API_KEY = [your Gemini API key from AI Studio]</code></li>
                  </ul>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'railway' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-950">
                <span className="font-bold block mb-1">Railway 1-Click Deployment</span>
                Railway detects the <code>Dockerfile</code> or Node project automatically and generates a live HTTPS URL.
              </div>

              <ol className="space-y-2.5 list-decimal list-inside text-slate-700 leading-relaxed font-medium">
                <li>Create a project on <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">Railway.app</a>.</li>
                <li>Click <strong>New Project → Deploy from GitHub repo</strong>.</li>
                <li>Set the variables: <code>PORT=5000</code>, <code>JWT_SECRET</code>, and <code>GEMINI_API_KEY</code>.</li>
                <li>Railway provisions persistent volume storage for <code>/data/mindflow.db</code> and boots immediately!</li>
              </ol>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900">
                <span className="font-bold block mb-1">Docker Multi-Stage Production Container</span>
                Deploy anywhere: AWS ECS/Fargate, Google Cloud Run, DigitalOcean, or your VPS.
              </div>

              <p className="text-slate-600">Run the following commands in the project directory:</p>
              
              <div className="space-y-2">
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono flex items-center justify-between">
                  <span>docker build -t mindflow-ai .</span>
                  <button
                    onClick={() => copyToClipboard('docker build -t mindflow-ai .', 'docker-build')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 'docker-build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono flex items-center justify-between">
                  <span>docker run -p 5000:5000 -e GEMINI_API_KEY="your_key" mindflow-ai</span>
                  <button
                    onClick={() => copyToClipboard('docker run -p 5000:5000 -e GEMINI_API_KEY="your_key" mindflow-ai', 'docker-run')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 'docker-run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-950">
                <span className="font-bold block mb-1">Vercel Deployment</span>
                Configured with <code>vercel.json</code> to route API requests to serverless execution or link with your cloud backend.
              </div>
              <p className="text-slate-600">
                Install the Vercel CLI or connect your GitHub repository directly to Vercel:
              </p>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono flex items-center justify-between">
                <span>npx vercel</span>
                <button
                  onClick={() => copyToClipboard('npx vercel', 'vercel-cmd')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedIndex === 'vercel-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
