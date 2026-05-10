import { CATEGORIES, CITY_IDS } from '../../config/adminConfig';

export default function AddModal({ show, addForm, setAddForm, onAdd, onCancel, onAddToServer }) {
  if (!show) return null;

  const hasServer = typeof onAddToServer === 'function';

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-headline font-black uppercase text-primary mb-6">Nuova Pizzeria</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome *" value={addForm.name} onChange={v => setAddForm(f => ({ ...f, name: v }))} />
            <Field label="Città *" type="select" value={addForm.cityId} onChange={v => setAddForm(f => ({ ...f, cityId: v }))} options={CITY_IDS} />
            <Field label="Indirizzo" value={addForm.address} onChange={v => setAddForm(f => ({ ...f, address: v }))} />
            <Field label="Telefono" value={addForm.phone} onChange={v => setAddForm(f => ({ ...f, phone: v }))} />
            <Field label="Categoria" type="select" value={addForm.category} onChange={v => setAddForm(f => ({ ...f, category: v }))} options={CATEGORIES} />
            <Field label="Voto (0-5)" type="number" step="0.1" min="0" max="5" value={addForm.rating} onChange={v => setAddForm(f => ({ ...f, rating: v }))} />
            <Field label="Stato" type="select" value={addForm.status} onChange={v => setAddForm(f => ({ ...f, status: v }))} options={['open', 'closed']} />
            <Field label="Frazione" value={addForm.frazione} onChange={v => setAddForm(f => ({ ...f, frazione: v }))} />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1">Descrizione</label>
            <textarea className="w-full bg-background border-2 border-primary p-2 font-body text-primary focus:border-secondary" rows="2"
              value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 font-headline font-bold uppercase text-primary cursor-pointer">
              <input type="checkbox" checked={addForm.isNew} onChange={e => setAddForm(f => ({ ...f, isNew: e.target.checked }))} />
              Nuova Apertura
            </label>
            {addForm.isNew && (
              <Field label="Data Apertura" type="month" value={addForm.openedAt} onChange={v => setAddForm(f => ({ ...f, openedAt: v }))} />
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button onClick={onCancel} className="bg-surface text-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">Annulla</button>
            {hasServer && (
              <button onClick={onAddToServer} className="bg-tertiary text-on-tertiary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-tertiary-container transition-colors">Aggiungi al Server</button>
            )}
            <button onClick={onAdd} className="bg-primary text-on-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors">Aggiungi</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, options, step, min, max }) {
  return (
    <div>
      <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1">{label}</label>
      {type === 'select' ? (
        <select className="w-full bg-background border-2 border-primary p-2 font-body text-primary focus:border-secondary"
          value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} step={step} min={min} max={max}
          className="w-full bg-background border-2 border-primary p-2 font-body text-primary focus:border-secondary"
          value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}
