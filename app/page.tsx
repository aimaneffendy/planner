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

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 font-sans text-[#1A1C1E]">
      {/* Top Header App Bar Style */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-blue-600">Aiman&Dinda.</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Planner | 14.6.2026</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-orange-500 uppercase">Baki Belum Bayar</p>
            <p className="text-lg font-bold">RM{totalBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Cost</p>
            <p className="text-xl font-bold">RM{totalHarga.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1 text-green-500">Dah Bayar</p>
            <p className="text-xl font-bold text-green-600">RM{totalDepo.toLocaleString()}</p>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-black uppercase text-xs tracking-[0.2em] text-gray-400">Senarai Expenses</h2>
            <span className="text-[10px] font-bold text-gray-300 italic">Hold ⋮⋮ to reorder</span>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="expenses">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {data.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative group bg-white p-5 rounded-[2.5rem] border border-gray-100 transition-all ${
                            snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 scale-[1.02] z-50' : 'shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps} className="text-gray-300 text-xl font-bold p-2">
                              ⋮⋮
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${
                                  item.kategori === 'Aiman' ? 'bg-blue-400' : item.kategori === 'Dinda' ? 'bg-pink-400' : 'bg-yellow-400'
                                }`}></span>
                                <h3 className="font-bold text-gray-800 truncate leading-tight">{item.item}</h3>
                              </div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate ml-4">
                                {item.vendor || 'Tiada Vendor'}
                              </p>
                            </div>

                            {/* Price Info (Mobile Friendly) */}
                            <div className="text-right">
                              <p className="text-[9px] font-black text-gray-300 uppercase">Baki</p>
                              <p className="font-mono font-black text-orange-500 text-lg leading-none">
                                {(item.harga - item.depo).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Detail Breakdown (Expand on Desktop or Keep simple for Mobile) */}
                          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                             <div className="flex gap-4">
                               <div className="text-center">
                                  <p className="text-[8px] font-black text-gray-300 uppercase">Harga</p>
                                  <p className="text-[10px] font-bold text-gray-600 italic">RM{item.harga}</p>
                               </div>
                               <div className="text-center">
                                  <p className="text-[8px] font-black text-gray-300 uppercase">Depo</p>
                                  <p className="text-[10px] font-bold text-green-500 italic">RM{item.depo}</p>
                               </div>
                             </div>
                             
                             <div className="flex gap-2">
                                <button onClick={() => openEdit(item)} className="bg-gray-50 text-[10px] font-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">EDIT</button>
                                <button onClick={() => deleteItem(item.id)} className="text-red-300 hover:text-red-500 p-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                                </button>
                             </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Floating Action Button (Mobile Style) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
        <button 
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-600 text-white py-4 rounded-full font-black shadow-2xl shadow-blue-200 hover:scale-95 active:scale-90 transition-all uppercase tracking-widest text-xs"
        >
          + TAMBAH ITEM
        </button>
      </div>

      {/* Modal Form - Redesigned for Mobile (Bottom Sheet style on Mobile) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] md:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8 md:hidden"></div>
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">{editId ? 'Edit Barang' : 'Barang Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Nama Barang" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 font-bold" value={form.item} onChange={e => setForm({...form, item: e.target.value})} />
              <input placeholder="Vendor" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Harga</label>
                  <input type="number" step="any" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 font-black" value={form.harga} onChange={e => setForm({...form, harga: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Depo</label>
                  <input type="number" step="any" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 font-black" value={form.depo} onChange={e => setForm({...form, depo: e.target.value})} />
                </div>
              </div>
              <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 font-bold" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}>
                <option value="Aiman">Aiman</option>
                <option value="Dinda">Dinda</option>
                <option value="Common">Others</option>
              </select>
              <div className="pt-4 space-y-2">
                <button type="submit" className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs">SAVE</button>
                <button type="button" onClick={closeModal} className="w-full text-gray-400 p-3 font-black text-[10px] uppercase tracking-widest">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}