import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/axios'
import { Shield, Plus, X } from 'lucide-react'

export default function RoleConfig() {
  const [domains, setDomains] = useState(['reliancehospital.com', 'ril.com', 'jiohealth.com'])
  const [newDomain, setNewDomain] = useState('')
  const [configs, setConfigs] = useState([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/api/config/roles-config').then(r => setConfigs(r.data)).catch(() => {})
  }, [])

  const addDomain = () => {
    const d = newDomain.replace('@', '').trim().toLowerCase()
    if (!d || domains.includes(d)) return
    setDomains(p => [...p, d])
    setNewDomain('')
  }

  const removeDomain = (d) => {
    if (d === 'reliancehospital.com') return
    setDomains(p => p.filter(x => x !== d))
  }


  return (
    <Layout title="System Configuration" subtitle="Control domain access and role-based permissions">
      {saved && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2 animate-fade-in">
          ✓ Configuration saved successfully
        </div>
      )}

      <div className="space-y-5">
        {/* Domain whitelist */}
        <div className="card border-t-4 border-forest-600 max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-forest-600" />
            <h3 className="font-bold text-charcoal font-display">Allowed Email Domains</h3>
          </div>
          <p className="text-xs text-muted mb-5">Only these domains can register in DevTracker</p>

          <div className="space-y-2 mb-5">
            {domains.map(d => (
              <div key={d} className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-forest-50 flex items-center justify-center">
                    <Shield size={13} className="text-forest-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">@{d}</p>
                    {d === 'reliancehospital.com' && (
                      <span className="text-[10px] font-bold bg-gold-400/20 text-gold-500 px-1.5 py-0.5 rounded">PRIMARY</span>
                    )}
                  </div>
                </div>
                {d !== 'reliancehospital.com' && (
                  <button onClick={() => removeDomain(d)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">@</span>
              <input
                className="input pl-7"
                placeholder="newdomain.com"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDomain()}
              />
            </div>
            <button onClick={addDomain} className="btn-primary flex-shrink-0">
              <Plus size={15} /> Add
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <span className="text-amber-500 text-sm">⚠</span>
            <p className="text-xs text-amber-700">Removing a domain will not deactivate existing users with that domain.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
