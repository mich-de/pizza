import { useState } from 'react';
import { CATEGORIES, CITY_IDS } from '../../config/adminConfig';

export default function PizzeriaRow({ row, isEditing, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className={`border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] overflow-hidden ${isEditing ? 'bg-primary-container' : 'bg-surface'}`}>
      <div className="p-6 flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-headline font-black text-xl uppercase text-primary truncate">{row.name}</div>
          <div className="text-sm text-on-surface-variant font-body truncate">{row.address}</div>
          <div className="text-xs text-on-surface-variant font-body mt-1">
            {row.cityName} · <span className="capitalize">{row.category}</span> · {row.status === 'open' ? '🟢 Aperta' : '🔴 Chiusa'} · ⭐ {row.rating}
          </div>
        </div>

        {isEditing ? (
          <EditForm
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        ) : (
          <ViewMode
            row={row}
            onEdit={onStartEdit}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirm
          name={row.name}
          onConfirm={() => { onDelete(); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function ViewMode({ row, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-lg font-black font-headline text-primary">{row.status === 'open' ? '🟢' : '🔴'} {row.phone || '—'}</div>
        <div className="text-xs text-on-surface-variant font-body">{row.frazione || ''}</div>
      </div>
      <button onClick={onEdit} className="bg-primary text-on-primary font-headline font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">edit</span> Modifica
      </button>
      <button onClick={onDelete} className="bg-secondary text-on-tertiary font-headline font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">
        Elimina
      </button>
    </div>
  );
}

function EditForm({ editForm, setEditForm, onSave, onCancel, onDelete }) {
  return (
    <div className="flex flex-col gap-3 w-full md:w-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
        <Field label="Città" type="select" value={editForm.cityId} onChange={v => setEditForm(f => ({ ...f, cityId: v }))} options={CITY_IDS} />
        <Field label="Indirizzo" value={editForm.address} onChange={v => setEditForm(f => ({ ...f, address: v }))} />
        <Field label="Telefono" value={editForm.phone} onChange={v => setEditForm(f => ({ ...f, phone: v }))} />
        <Field label="Categoria" type="select" value={editForm.category} onChange={v => setEditForm(f => ({ ...f, category: v }))} options={CATEGORIES} />
        <Field label="Voto (0-5)" type="number" step="0.1" min="0" max="5" value={editForm.rating} onChange={v => setEditForm(f => ({ ...f, rating: v }))} />
        <Field label="Stato" type="select" value={editForm.status} onChange={v => setEditForm(f => ({ ...f, status: v }))} options={['open', 'closed']} />
        <Field label="Frazione" value={editForm.frazione} onChange={v => setEditForm(f => ({ ...f, frazione: v }))} />
      </div>
      <div>
        <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1">Descrizione</label>
        <textarea className="w-full bg-background border-2 border-primary p-2 font-body text-primary focus:border-secondary" rows="2"
          value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex items-end gap-2">
        <button onClick={onSave} className="bg-primary text-on-primary font-headline font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors">OK</button>
        <button onClick={onCancel} className="bg-surface text-primary font-headline font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">Annulla</button>
        <button onClick={onDelete} className="bg-secondary text-on-tertiary font-headline font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors ml-auto">Elimina</button>
      </div>
    </div>
  );
}

function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-headline font-black uppercase text-primary mb-4">Eliminare definitivamente {name}?</h2>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="bg-surface text-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">Annulla</button>
            <button onClick={onConfirm} className="bg-secondary text-on-tertiary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">Elimina</button>
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
