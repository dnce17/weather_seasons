import React from 'react';
import { useState, useEffect } from 'react';
import ResultDropdown from './ResultDropdown';
import { removeBlanks } from '../../helpers';

const SearchBar = ({ setWeatherData }) => {
  const [data, setData] = useState([]); // State to hold JSON data
  const [locationData, setLocationData] = useState(); // Save specific location for fetching weather
  const [query, setQuery] = useState(''); // Save search input
  const [filteredResults, setFilteredResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch JSON weather data on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${query.match(/[a-zA-Z]*/)}&count=100&language=en&format=json`;
        const res = await fetch(geocodingUrl);
        const data = await res.json();

        // Add whole location to data (e.g. city, state, country), so it appears if user types out full
        for (const location in data.results) {
          const record = data.results[location];
          record.geoLocation = removeBlanks([record.name, record.admin1, record.country]);
        }

        Array.isArray(data.results) ? setData(data.results) : setData([]);

      } catch (error) {
        console.log('Error fetching geocoding data', error);
      }
    }

    fetchLocations();

  }, [query]);

  // Update filtered results when query or data changes
  useEffect(() => {
    if (query) {
      const results = data.filter((item) =>
        item.geoLocation.toLowerCase().includes(query.toLowerCase())
      );

      setFilteredResults(results);
    }
    else {
      setFilteredResults([]);
    }
  }, [query, data]);

  const weatherFetch = async (e) => {
    e.preventDefault();
    console.log('submit');

    console.log(`Location Data: ${locationData}`);
    // Check for invalid location
    if (!locationData) {
      return 'Invalid Location';
    }

    try {
      const weatherUrl = `
          https://api.open-meteo.com/v1/forecast?
          latitude=${locationData.latitude}&
          longitude=${locationData.longitude}&
          current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&
          hourly=temperature_2m,weather_code,precipitation_probability&
          daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&
          temperature_unit=fahrenheit&
          wind_speed_unit=mph&
          timezone=auto
        `.replace(/\s/g, '');

      const res = await fetch(weatherUrl);
      const data = await res.json();

      // Add location name to JSON
      data.name = locationData.name;
      data.displayName = query;
      setWeatherData(data);

    } catch (error) {
      console.log('Error fetching weather data', error);
    }
  }

  return (
    <div className='relative max-w-md mx-auto text-black px-2'>
      {/* Search Input */}
      <form onSubmit={weatherFetch} className='flex'>
        <input
          type='text'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value); // Update query state
            setLocationData(''); // Reset location data
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setShowDropdown(false)}
          placeholder='Search location'
          className='w-full rounded-l-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          required
        />
        <button
          className='bg-sky-400 rounded-r-xl hover:bg-sky-500 text-slate-100 font-bold py-2 px-4 focus:outline-none focus:shadow-outline'
          type='submit'
        >
          Search
        </button>
      </form>

      {showDropdown && (
        <ResultDropdown setLocationData={setLocationData} setQuery={setQuery} filteredResults={filteredResults} setShowDropdown={setShowDropdown} />
      )}
    </div>
  );
};

export default SearchBar;