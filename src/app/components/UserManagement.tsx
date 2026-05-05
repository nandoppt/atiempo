import { useState } from 'react'
import { Search, User, Mail, Calendar, MoreHorizontal, Edit, Trash2, X, Save } from 'lucide-react'
import { useClientes } from '../../lib/hooks'
import { supabase } from '../../lib/supabase'

export default function UserManagement() {
  const { clientes, loading } = useClientes()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', telefono: '' })

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (cliente: any) => {
    setEditingUser(cliente.id)
    setEditForm({ nombre: cliente.nombre || '', telefono: cliente.telefono || '' })
  }

  const handleSave = async () => {
    if (!editingUser) return
    const { error } = await supabase
      .from('clientes')
      .update({ nombre: editForm.nombre, telefono: editForm.telefono })
      .eq('id', editingUser)
    if (!error) {
      setEditingUser(null)
      window.location.reload() // Simple refresh for now
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (!error) {
        window.location.reload() // Simple refresh for now
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Gestión de Usuarios</h2>
            <p className="text-sm text-gray-500 mt-1">Administra los usuarios clientes registrados</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        {editingUser === cliente.id ? (
                          <input
                            type="text"
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            className="border rounded px-2 py-1 text-sm"
                            placeholder="Nombre"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.nombre || 'Sin nombre'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{cliente.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-ES') : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === cliente.id ? (
                      <input
                        type="text"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="Teléfono"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {cliente.telefono || 'No especificado'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {editingUser === cliente.id ? (
                        <>
                          <button onClick={handleSave} className="text-green-600 hover:text-green-900 p-1">
                            <Save className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingUser(null)} className="text-gray-600 hover:text-gray-900 p-1">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(cliente)} className="text-indigo-600 hover:text-indigo-900 p-1">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(cliente.id)} className="text-red-600 hover:text-red-900 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClientes.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron usuarios con ese criterio.' : 'Aún no hay usuarios registrados.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}