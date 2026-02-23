'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  
  const [form, setForm] = useState({ item: '', vendor: '', harga: '', depo: '', kategori: 'Aiman' })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    let { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .order('position', { ascending: true })
    
    setData(expenses || [])
    setLoading(false)
  }

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const items = Array.from(data);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setData(items);

    const updates = items.map((item, index) => ({ id: item.id, position: index }));
    for (const update of updates) {
      await supabase.from('expenses').update({ position: update.position }).eq('id', update.id);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { 
      item: form.item, 
      vendor: form.vendor, 
      harga: parseFloat(form.harga) || 0, 
      depo: parseFloat(form.depo) || 0, 
      kategori: form.kategori 
    }

    if (editId) {
      await supabase.from('expenses').update(payload).eq('id', editId)
    } else {
      await supabase.from('expenses').insert([{ ...payload, position: data.length }])
    }
    closeModal()
    fetchData()
  }

  function openEdit(item: any) {
    setEditId(item.id)
    setForm({ item: item.item, vendor: item.vendor || '', harga: item.harga.toString(), depo: item.depo.toString(), kategori: item.kategori })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditId(null)
    setForm({ item: '', vendor: '', harga: '', depo: '', kategori: 'Aiman' })
  }

  async function deleteItem(id: string) {
    if (confirm('Padam item ni?')) {
      await supabase.from('expenses').delete().eq('id', id)
      fetchData()
    }
  }

  const totalHarga = data.reduce((acc, item) => acc + (Number(item.harga) || 0), 0)
  const totalDepo = data.reduce((acc, item) => acc + (Number(item.depo) || 0), 0)
  const totalBalance = totalHarga - totalDepo

  // Kira total ikut kategori
  const totalAiman = data.filter(i => i.kategori === 'Aiman').reduce((acc, item) => acc + (Number(item.harga) || 0), 0)
  const totalDinda = data.filter(i => i.kategori === 'Dinda').reduce((acc, item) => acc + (Number(item.harga) || 0), 0)
  const totalCommon = data.filter(i => i.kategori === 'Common').reduce((acc, item) => acc + (Number(item.harga) || 0), 0)

  // Helper untuk warna kategori
  const getCatColor = (cat: string) => {
    switch (cat) {
      case 'Aiman': return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', accent: 'bg-blue-600' }
      case 'Dinda': return { text: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', accent: 'bg-pink-600' }
      case 'Common': return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', accent: 'bg-amber-600' }
      default: return { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', accent: 'bg-gray-600' }
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#1A1C1E] font-sans flex flex-col">
      
      {/* 1. Top Black Border & Safe Area */}
      <div className="h-[env(safe-area-inset-top,44px)] bg-white w-full sticky top-0 z-50">
        <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-black"></div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-6 pt-8 pb-20">
        {/* Sleek Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase">Dinda<span className="text-blue-600">.</span></h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Wedding Planner</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Balance Due</p>
            <p className="text-2xl font-semibold tracking-tight">RM{totalBalance.toLocaleString()}</p>
          </div>
        </header>

        {/* Hero Card Updated with Category Totals */}
        <div className="bg-[#121212] rounded-[2rem] p-8 text-white mb-10 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Expenses</p>
              <p className="text-3xl font-semibold tracking-tight">RM{totalHarga.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Total Paid</p>
              <p className="text-2xl font-semibold tracking-tight">RM{totalDepo.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="h-[1px] w-full bg-gray-800 mb-6"></div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Aiman</p>
              <p className="text-sm font-semibold">RM{totalAiman.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-pink-400 uppercase mb-1">Dinda</p>
              <p className="text-sm font-semibold">RM{totalDinda.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-amber-400 uppercase mb-1">Common</p>
              <p className="text-sm font-semibold">RM{totalCommon.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="space-y-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="expenses">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {data.map((item, index) => {
                    const colors = getCatColor(item.kategori);
                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white rounded-2xl border ${snapshot.isDragging ? 'shadow-xl scale-[1.02] z-40 ' + colors.border : 'border-gray-100'} transition-all`}
                          >
                            <div className="p-5">
                              <div className="flex items-center gap-4">
                                <div {...provided.dragHandleProps} className="text-gray-200 active:text-gray-400">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-[15px] truncate tracking-tight uppercase">{item.item}</h3>
                                  <p className="text-[11px] text-gray-400 tracking-wide font-medium">
                                    {item.vendor || 'No Vendor'} • <span className={`${colors.text} font-bold uppercase`}>{item.kategori}</span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[15px] font-bold">RM{(item.harga - item.depo).toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-gray-300 uppercase">Balance</p>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <div className="flex gap-4 text-[10px] font-bold uppercase text-gray-400 tracking-tighter">
                                  <span>Total: RM{item.harga}</span>
                                  <span className="text-green-500 font-bold">Paid: RM{item.depo}</span>
                                </div>
                                <div className="flex gap-3">
                                  <button onClick={() => openEdit(item)} className="text-[10px] font-bold uppercase text-gray-400 hover:text-black">Edit</button>
                                  <button onClick={() => deleteItem(item.id)} className="text-[10px] font-bold uppercase text-gray-400 hover:text-red-500">Del</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <button 
            onClick={() => setShowModal(true)}
            className="w-full mt-8 bg-[#121212] text-white py-5 rounded-2xl flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="text-sm font-bold uppercase tracking-widest">Add New Item</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.4em]">Hmmm</p>
        </footer>
      </div>

      {/* Modal - FLOATING STYLE */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold mb-6 tracking-tight uppercase italic text-center">
              {editId ? 'Update Entry' : 'New Entry'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Item name" required className="w-full px-5 py-4 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-200 font-medium transition-all" value={form.item} onChange={e => setForm({...form, item: e.target.value})} />
              <input placeholder="Vendor" className="w-full px-5 py-4 bg-gray-50 rounded-xl outline-none" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Cost" required className="w-full px-5 py-4 bg-gray-50 rounded-xl outline-none font-bold" value={form.harga} onChange={e => setForm({...form, harga: e.target.value})} />
                <input type="number" placeholder="Paid" required className="w-full px-5 py-4 bg-gray-50 rounded-xl outline-none font-bold text-green-600" value={form.depo} onChange={e => setForm({...form, depo: e.target.value})} />
              </div>
              
              <div className="flex gap-2 p-1.5 bg-gray-50 rounded-xl">
                <button type="button" onClick={() => setForm({...form, kategori: 'Aiman'})} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${form.kategori === 'Aiman' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'}`}>Aiman</button>
                <button type="button" onClick={() => setForm({...form, kategori: 'Dinda'})} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${form.kategori === 'Dinda' ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-400'}`}>Dinda</button>
                <button type="button" onClick={() => setForm({...form, kategori: 'Common'})} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${form.kategori === 'Common' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-400'}`}>Common</button>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                  Save
                </button>
                <button type="button" onClick={closeModal} className="w-full py-2 text-gray-300 text-[10px] font-bold uppercase tracking-widest text-center">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}