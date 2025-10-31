'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PawPrint, Plus, Pencil, Trash2, Loader2, AlertCircle, X, Upload } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import api from '@/lib/api';

interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  size: 'small' | 'medium' | 'large';
  birthDate?: string;
  weight?: number;
  photoUrl?: string;
  medicalInfo?: string;
  isVaccinated: boolean;
  vaccinationDetails?: string;
  specialNeeds?: string;
  temperament?: string;
  gender?: string;
}

export default function PetsPage() {
  return (
    <ProtectedRoute>
      <PetsContent />
    </ProtectedRoute>
  );
}

function PetsContent() {
  const uploadsBaseUrl = (() => {
    const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.endsWith('/api')) {
        parsed.pathname = parsed.pathname.replace(/\/api$/, '');
      }
      const cleanedPath = parsed.pathname.replace(/\/$/, '');
      return `${parsed.origin}${cleanedPath}`;
    } catch {
      return raw.replace(/\/api$/, '');
    }
  })();

  const resolveAssetUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) {
      return url;
    }
    const separator = url.startsWith('/') ? '' : '/';
    return `${uploadsBaseUrl}${separator}${url}`;
  };
  const formatDateForInput = (isoDate?: string) => {
    if (!isoDate) return '';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  };
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [filter, setFilter] = useState<'all' | 'dog' | 'cat'>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog' as 'dog' | 'cat',
    breed: '',
    size: 'medium' as 'small' | 'medium' | 'large',
    birthDate: '',
    weight: undefined as number | undefined,
    medicalInfo: '',
    isVaccinated: false,
    gender: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/pets');
      setPets(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar pets');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPet(null);
    setFormData({
      name: '',
      species: 'dog',
      breed: '',
      size: 'medium',
      birthDate: '',
      weight: undefined,
      medicalInfo: '',
      isVaccinated: false,
      gender: '',
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      size: pet.size,
      birthDate: formatDateForInput(pet.birthDate),
      weight: pet.weight,
      medicalInfo: pet.medicalInfo || '',
      isVaccinated: pet.isVaccinated,
      gender: pet.gender || '',
    });
    setPhotoFile(null);
    setPhotoPreview(pet.photoUrl ? resolveAssetUrl(pet.photoUrl) : '');
    setFormError('');
    setShowModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('A foto deve ter no máximo 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setFormError('Formato inválido. Use JPG, PNG ou WebP');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setFormError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      let petId = editingPet?.id;

      // Prepare data for backend
      const petData: any = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        size: formData.size,
        medicalInfo: formData.medicalInfo || undefined,
        isVaccinated: formData.isVaccinated,
        gender: formData.gender || undefined,
        weight: formData.weight || undefined,
      };

      // Convert birthDate to ISO format if provided
      if (formData.birthDate) {
        petData.birthDate = new Date(formData.birthDate).toISOString();
      }

      // Create or update pet
      if (editingPet) {
        await api.patch(`/pets/${editingPet.id}`, petData);
      } else {
        const response = await api.post('/pets', petData);
        petId = response.data.id;
      }

      // Upload photo if selected
      if (photoFile && petId) {
        const photoFormData = new FormData();
        photoFormData.append('file', photoFile);
        await api.post(`/pets/${petId}/photo`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      await loadPets();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar pet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (petId: string) => {
    if (!confirm('Tem certeza que deseja deletar este pet?')) return;

    try {
      await api.delete(`/pets/${petId}`);
      await loadPets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao deletar pet');
    }
  };

  const filteredPets = filter === 'all' 
    ? pets 
    : pets.filter(pet => pet.species === filter);

  const getSpeciesEmoji = (species: string) => species === 'dog' ? '🐕' : '🐈';
  const getSizeLabel = (size: string) => {
    const labels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
    return labels[size as keyof typeof labels];
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 section-padding">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Pets</h1>
              <p className="text-gray-600">Gerencie as informações dos seus pets</p>
            </div>
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Pet
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todos ({pets.length})
            </button>
            <button
              onClick={() => setFilter('dog')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'dog'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🐕 Cães ({pets.filter(p => p.species === 'dog').length})
            </button>
            <button
              onClick={() => setFilter('cat')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'cat'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🐈 Gatos ({pets.filter(p => p.species === 'cat').length})
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Erro ao carregar pets</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Pets Grid */}
          {!isLoading && !error && (
            <>
              {filteredPets.length === 0 ? (
                <div className="text-center py-12">
                  <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {filter === 'all' ? 'Nenhum pet cadastrado' : `Nenhum ${filter === 'dog' ? 'cão' : 'gato'} cadastrado`}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Adicione seu primeiro pet para começar
                  </p>
                  <button onClick={openCreateModal} className="btn-primary">
                    Adicionar Pet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPets.map((pet) => (
                    <div key={pet.id} className="card group hover:shadow-xl transition-shadow">
                      {/* Photo */}
                      <div className="relative h-48 bg-gradient-to-br from-primary-50 to-purple-50 rounded-t-xl overflow-hidden">
                        {pet.photoUrl ? (
                          <img
                            src={resolveAssetUrl(pet.photoUrl)}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.fallback-emoji');
                              if (fallback) {
                                (fallback as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`fallback-emoji flex items-center justify-center h-full ${pet.photoUrl ? 'hidden' : ''}`}
                        >
                          <span className="text-6xl">{getSpeciesEmoji(pet.species)}</span>
                        </div>
                        
                        {/* Actions Overlay */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(pet)}
                            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDelete(pet.id)}
                            className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                          {pet.isVaccinated && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Vacinado
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Espécie:</span> {pet.species === 'dog' ? 'Cão' : 'Gato'}
                          </p>
                          <p>
                            <span className="font-medium">Raça:</span> {pet.breed}
                          </p>
                          <p>
                            <span className="font-medium">Porte:</span> {getSizeLabel(pet.size)}
                          </p>
                          {pet.birthDate && (
                            <p>
                              <span className="font-medium">Idade:</span> {Math.floor((new Date().getTime() - new Date(pet.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} anos
                            </p>
                          )}
                          {pet.medicalInfo && (
                            <p className="pt-2 border-t border-gray-100">
                              <span className="font-medium">Observações:</span>
                              <span className="block mt-1 text-xs">{pet.medicalInfo}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPet ? 'Editar Pet' : 'Adicionar Pet'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto do Pet
                </label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      <img src={resolveAssetUrl(photoPreview)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                      <PawPrint className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <label className="btn-outline cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Escolher Foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG ou WebP. Máximo 5MB.</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  placeholder="Ex: Rex, Mimi..."
                />
              </div>

              {/* Species & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Espécie *
                  </label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value as 'dog' | 'cat' })}
                    className="input"
                    required
                  >
                    <option value="dog">🐕 Cão</option>
                    <option value="cat">🐈 Gato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porte *
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value as 'small' | 'medium' | 'large' })}
                    className="input"
                    required
                  >
                    <option value="small">Pequeno</option>
                    <option value="medium">Médio</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </div>

              {/* Breed & Birth Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raça *
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="input"
                    required
                    placeholder="Ex: Labrador, SRD..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Gender & Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gênero
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input"
                  >
                    <option value="">Selecione...</option>
                    <option value="male">Macho</option>
                    <option value="female">Fêmea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="input"
                    placeholder="Ex: 10.5"
                  />
                </div>
              </div>

              {/* Medical Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informações Médicas
                </label>
                <textarea
                  value={formData.medicalInfo}
                  onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Alergias, medicações, condições especiais..."
                />
              </div>

              {/* Vaccinated */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVaccinated"
                  checked={formData.isVaccinated}
                  onChange={(e) => setFormData({ ...formData, isVaccinated: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isVaccinated" className="ml-2 text-sm text-gray-700">
                  Pet vacinado
                </label>
              </div>

              {/* Error */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingPet ? 'Salvar Alterações' : 'Adicionar Pet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
