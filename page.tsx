"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, MapPin, Thermometer, Droplets, Wind, Sunrise, Sunset } from 'lucide-react'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  feelsLike: number
  sunrise: string
  sunset: string
  icon: string
}

interface ForecastData {
  date: string
  high: number
  low: number
  condition: string
  icon: string
}

export default function WeatherDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const popularCities = [
    'New York', 'London', 'Tokyo', 'Paris', 'Sydney',
    'Los Angeles', 'Chicago', 'Toronto', 'Berlin', 'Mumbai',
    'Singapore', 'Dubai', 'Barcelona', 'Rome', 'Amsterdam'
  ]

  const filteredCities = popularCities.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle clicks outside the search component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCitySelect = (city: string) => {
    setSearchQuery(city)
    setShowAutocomplete(false)
    // Trigger search
    setTimeout(() => handleSearch(), 100)
  }

  // Mock data for demonstration
  const mockWeather: WeatherData = {
    location: 'New York, NY',
    temperature: 72,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 8,
    feelsLike: 74,
    sunrise: '6:30 AM',
    sunset: '7:45 PM',
    icon: 'partly-cloudy'
  }

  const mockForecast: ForecastData[] = [
    { date: 'Today', high: 75, low: 62, condition: 'Sunny', icon: 'sunny' },
    { date: 'Tomorrow', high: 78, low: 65, condition: 'Partly Cloudy', icon: 'partly-cloudy' },
    { date: 'Wednesday', high: 80, low: 68, condition: 'Clear', icon: 'clear' },
    { date: 'Thursday', high: 77, low: 64, condition: 'Rainy', icon: 'rainy' },
    { date: 'Friday', high: 73, low: 60, condition: 'Cloudy', icon: 'cloudy' }
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      // Fetch current weather
      const weatherResponse = await fetch(`/api/weather?city=${encodeURIComponent(searchQuery)}`)
      if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather data')
      }
      const weatherData = await weatherResponse.json()
      
      // Fetch forecast
      const forecastResponse = await fetch(`/api/forecast?city=${encodeURIComponent(searchQuery)}`)
      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast data')
      }
      const forecastData = await forecastResponse.json()
      
      setWeather(weatherData)
      setForecast(forecastData)
    } catch (err) {
      setError('Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    setLoading(true)
    setError('')
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const response = await fetch(`/api/weather-coordinates?lat=${latitude}&lon=${longitude}`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch weather data for your location')
            }
            
            const data = await response.json()
            setWeather(data.weather)
            setForecast(data.forecast)
          } catch (err) {
            setError('Failed to fetch weather for your location')
          } finally {
            setLoading(false)
          }
        },
        (err) => {
          setError('Unable to get your location')
          setLoading(false)
        }
      )
    } else {
      setError('Geolocation is not supported by this browser')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load default weather data for New York
    const loadDefaultWeather = async () => {
      try {
        const weatherResponse = await fetch('/api/weather?city=New York')
        const weatherData = await weatherResponse.json()
        
        const forecastResponse = await fetch('/api/forecast?city=New York')
        const forecastData = await forecastResponse.json()
        
        setWeather(weatherData)
        setForecast(forecastData)
      } catch (err) {
        // Fallback to mock data if API fails
        setWeather(mockWeather)
        setForecast(mockForecast)
      }
    }
    
    loadDefaultWeather()
  }, [])

  const getWeatherIcon = (icon: string) => {
    const iconMap: Record<string, string> = {
      'sunny': '☀️',
      'partly-cloudy': '⛅',
      'cloudy': '☁️',
      'rainy': '🌧️',
      'clear': '🌤️'
    }
    return iconMap[icon] || '🌤️'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Weather Dashboard</h1>
          <p className="text-gray-600">Get current weather and forecasts for any location</p>
        </div>

        {/* Search Section */}
        <Card className="p-6">
          <div ref={searchRef} className="relative">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search for a city..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowAutocomplete(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowAutocomplete(searchQuery.length > 0)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={getCurrentLocation} disabled={loading}>
                  <MapPin className="w-4 h-4 mr-2" />
                  My Location
                </Button>
              </div>
            </div>
            
            {/* Autocomplete Dropdown */}
            {showAutocomplete && filteredCities.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {filteredCities.map((city, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleCitySelect(city)}
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{city}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weather Data */}
        {weather && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Weather */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {weather.location}
                </CardTitle>
                <CardDescription>Current weather conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-6xl mb-2">{getWeatherIcon(weather.icon)}</div>
                    <div className="text-4xl font-bold text-gray-800 mb-1">
                      {weather.temperature}°F
                    </div>
                    <div className="text-lg text-gray-600 mb-4">{weather.condition}</div>
                    <Badge variant="secondary">Feels like {weather.feelsLike}°F</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Humidity</p>
                        <p className="text-gray-600">{weather.humidity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Wind className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">Wind Speed</p>
                        <p className="text-gray-600">{weather.windSpeed} mph</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sunrise className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Sunrise</p>
                        <p className="text-gray-600">{weather.sunrise}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sunset className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Sunset</p>
                        <p className="text-gray-600">{weather.sunset}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5-Day Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>5-Day Forecast</CardTitle>
                <CardDescription>Weather outlook for the next 5 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecast.map((day, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getWeatherIcon(day.icon)}</span>
                        <div>
                          <p className="font-medium">{day.date}</p>
                          <p className="text-sm text-gray-600">{day.condition}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{day.high}°</p>
                        <p className="text-sm text-gray-600">{day.low}°</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}