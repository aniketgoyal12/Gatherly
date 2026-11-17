import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-100 text-navy-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full bg-cream-50 border border-cream-300 rounded-3xl p-8 shadow-xl text-center space-y-6">
        {/* Official Brand Logo */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <img
            src="/logo.png"
            alt="Gatherly Logo"
            className="h-14 w-auto object-contain mx-auto"
          />
          <p className="text-xs text-navy-700">
            AI-Powered Event Planning & Management Platform
          </p>
        </div>

        {/* 60:30:10 Design Palette Card */}
        <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 space-y-3 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-navy-500">
            Active Design System (60:30:10)
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-950 text-cream-100">
              <span className="font-semibold">60% Deep Navy</span>
              <code className="text-[10px] text-cream-400">#080D1A</code>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-cream-50 text-navy-950 border border-cream-300">
              <span className="font-semibold">30% Warm Cream</span>
              <code className="text-[10px] text-navy-600">#FDFBF7</code>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-coral-500 text-white font-semibold">
              <span>10% Energetic Coral</span>
              <code className="text-[10px] text-coral-100">#FF6B5B</code>
            </div>
          </div>
        </div>

        {/* Icon & Setup Status */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <img
            src="/logo-icon.png"
            alt="Gatherly Icon"
            className="w-10 h-10 rounded-xl shadow-md border border-navy-800"
          />
          <div className="text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Logos & Icons Integrated</span>
            </div>
            <p className="text-[11px] text-navy-500 mt-0.5">
              Available at <code className="text-navy-700">/logo.png</code> & <code className="text-navy-700">/logo-icon.png</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
