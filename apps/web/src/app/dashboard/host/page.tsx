'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Home,
  Calendar,
  MessageSquare,
  Star,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  Power,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  pricePerNight: number;
  photos: string[];
  isActive: boolean;
  city: string;
  state: string;
  acceptsDogs: boolean;
  acceptsCats: boolean;
  acceptsSmallPets: boolean;
  acceptsMediumPets: boolean;
  acceptsLargePets: boolean;
  hasYard: boolean;
  allowsWalks: boolean;
  providesMedication: boolean;
  _count?: {
    bookings: number;
    reviews: number;
  };
  reviews?: Array<{
    rating: number;
  }>;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  stripeSubscriptionId?: string;
}

interface HostData {
  id: string;
  bio: string;
  verifiedAt?: string;
  user: {
    name: string;
    email: string;
    profilePhoto?: string;
  };
  subscription?: Subscription;
  listings: Listing[];
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  revenue: number;
}

export default function HostDashboard() {
  const router = useRouter();
  const [hostData, setHostData] = useState<HostData | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'listings' | 'calendar' | 'bookings'>('listings');

  useEffect(() => {
    fetchHostData();
    fetchBookingStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchBlockedDates();
    }
  }, [activeTab, currentMonth]);

  const fetchHostData = async () => {
    try {
      // Get user's host profile
      const hostResponse = await api.get('/v1/users/profile');
      const userId = hostResponse.data.user.id;

      // Get host data with listings
      const response = await api.get(`/v1/users/${userId}`);
      
      if (response.data.user.host) {
        const host = response.data.user.host;
        
        // Get listings for the host
        const listingsResponse = await api.get('/v1/listings/me');
        
        setHostData({
          ...host,
          user: response.data.user,
          listings: listingsResponse.data.listings || [],
        });
      } else {
        setError('Host profile not found. Please create a host profile first.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch host data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const response = await api.get('/v1/bookings');
      const bookings = response.data.bookings || [];

      const stats: BookingStats = {
        total: bookings.length,
        pending: bookings.filter((b: any) => b.status === 'PENDING').length,
        confirmed: bookings.filter((b: any) => b.status === 'CONFIRMED').length,
        cancelled: bookings.filter((b: any) => b.status === 'CANCELLED').length,
        revenue: bookings
          .filter((b: any) => b.status === 'CONFIRMED')
          .reduce((sum: number, b: any) => sum + b.totalPrice, 0),
      };

      setBookingStats(stats);
    } catch (err) {
      console.error('Failed to fetch booking stats:', err);
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const response = await api.get('/v1/hosts/availability', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      const dates = response.data.availability
        .filter((item: any) => item.isBlocked)
        .map((item: any) => new Date(item.date));

      setBlockedDates(dates);
    } catch (err) {
      console.error('Failed to fetch blocked dates:', err);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) return;

    try {
      await api.post('/v1/hosts/availability/block', {
        dates: selectedDates.map((date) => date.toISOString()),
      });

      setBlockedDates([...blockedDates, ...selectedDates]);
      setSelectedDates([]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to block dates');
    }
  };

  const handleUnblockDates = async () => {
    if (selectedDates.length === 0) return;

    try {
      await api.post('/v1/hosts/availability/unblock', {
        dates: selectedDates.map((date) => date.toISOString()),
      });

      setBlockedDates(
        blockedDates.filter(
          (date) => !selectedDates.some((d) => d.toDateString() === date.toDateString())
        )
      );
      setSelectedDates([]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unblock dates');
    }
  };

  const toggleDateSelection = (date: Date) => {
    const exists = selectedDates.some((d) => d.toDateString() === date.toDateString());
    if (exists) {
      setSelectedDates(selectedDates.filter((d) => d.toDateString() !== date.toDateString()));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some((d) => d.toDateString() === date.toDateString());
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some((d) => d.toDateString() === date.toDateString());
  };

  const toggleListingActive = async (listingId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/v1/listings/${listingId}/toggle-active`);
      
      // Update local state
      if (hostData) {
        setHostData({
          ...hostData,
          listings: hostData.listings.map((listing) =>
            listing.id === listingId ? { ...listing, isActive: !currentStatus } : listing
          ),
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update listing');
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      await api.delete(`/v1/listings/${listingId}`);
      
      // Update local state
      if (hostData) {
        setHostData({
          ...hostData,
          listings: hostData.listings.filter((listing) => listing.id !== listingId),
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete listing');
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isBlocked = isDateBlocked(date);
      const isSelected = isDateSelected(date);
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <button
          key={day}
          onClick={() => !isPast && toggleDateSelection(date)}
          disabled={isPast}
          className={`h-12 rounded-lg border transition-colors ${
            isPast
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isSelected
              ? 'bg-blue-500 text-white border-blue-600'
              : isBlocked
              ? 'bg-red-100 text-red-600 border-red-300'
              : 'bg-white hover:bg-gray-50 border-gray-200'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDates([]);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDates([]);
  };

  const calculateAverageRating = (listing: Listing) => {
    if (!listing.reviews || listing.reviews.length === 0) return 0;
    const sum = listing.reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / listing.reviews.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !hostData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error || 'Failed to load host data'}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { user, subscription, listings } = hostData;
  const isPro = subscription?.plan === 'PRO';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  {isPro && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-sm font-semibold rounded-full">
                      <Crown className="w-4 h-4" />
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{user.email}</p>
                {subscription && (
                  <p className="text-sm text-gray-500 mt-1">
                    Subscription: {subscription.plan} • Status: {subscription.status} •
                    Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/listings/new')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              New Listing
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {bookingStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{bookingStats.total}</p>
                </div>
                <Home className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">{bookingStats.confirmed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{bookingStats.cancelled}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${bookingStats.revenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'listings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                My Listings ({listings.length})
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'calendar'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Availability Calendar
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-4">
                {listings.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No listings yet</p>
                    <button
                      onClick={() => router.push('/listings/new')}
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      Create your first listing
                    </button>
                  </div>
                ) : (
                  listings.map((listing) => {
                    const avgRating = calculateAverageRating(listing);
                    const reviewCount = listing._count?.reviews || listing.reviews?.length || 0;

                    return (
                      <div
                        key={listing.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex gap-4">
                          <div className="w-32 h-32 flex-shrink-0">
                            {listing.photos.length > 0 ? (
                              <img
                                src={listing.photos[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <Home className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{listing.title}</h3>
                                <p className="text-sm text-gray-600">
                                  {listing.city}, {listing.state}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <span className="font-semibold text-blue-600">
                                    ${listing.pricePerNight}/night
                                  </span>
                                  {reviewCount > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span>
                                        {avgRating.toFixed(1)} ({reviewCount})
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{listing._count?.bookings || 0} bookings</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    listing.isActive
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {listing.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <button
                                  onClick={() => toggleListingActive(listing.id, listing.isActive)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                  title={listing.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  <Power className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => router.push(`/dashboard/listings/${listing.id}/edit`)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => deleteListing(listing.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {listing.acceptsDogs && (
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                  Dogs
                                </span>
                              )}
                              {listing.acceptsCats && (
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                                  Cats
                                </span>
                              )}
                              {listing.hasYard && (
                                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                                  Yard
                                </span>
                              )}
                              {listing.allowsWalks && (
                                <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">
                                  Walks
                                </span>
                              )}
                              {listing.providesMedication && (
                                <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">
                                  Medication
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={previousMonth}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                      <span className="text-sm text-gray-600">Blocked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
                      <span className="text-sm text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                      <span className="text-sm text-gray-600">Available</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>

                  {selectedDates.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleBlockDates}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        Block Selected Dates ({selectedDates.length})
                      </button>
                      <button
                        onClick={handleUnblockDates}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Unblock Selected Dates ({selectedDates.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
