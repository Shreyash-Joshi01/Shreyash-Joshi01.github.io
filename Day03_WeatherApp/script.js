document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const searchInput = document.getElementById('search-input');
    const cityNameEl = document.getElementById('city-name');
    const tempMainEl = document.getElementById('temp-main');
    const weatherIconEl = document.getElementById('weather-icon-main');
    const currentTimeEl = document.getElementById('current-time');
    const tempHighEl = document.getElementById('temp-high');
    const tempLowEl = document.getElementById('temp-low');
    const hourlyListEl = document.getElementById('hourly-list');
    const forecastListEl = document.getElementById('forecast-list');
    const hourlyDescEl = document.getElementById('hourly-desc');

    // API Key (Secured via HTTP Referrers in OpenWeatherMap Dashboard)
    const API_KEY = '4515a4b02df552e4e12cbbd2639a2886';
    const BASE_URL = 'https://api.openweathermap.org/data/2.5';

    // Helper: format time based on timezone offset
    const formatTime = (unixTime, timezoneOffset) => {
        // OpenWeatherMap returns time in UTC unix seconds.
        // timezoneOffset is in seconds from UTC.
        // We create a Date object holding the local time of the target city.
        const utcDate = new Date(unixTime * 1000);
        // This is a bit tricky: to display native formatting, we shift the UTC time 
        // to match the local time so we can use UTC methods, or use Intl.DateTimeFormat with a specific timezone.
        // Since OWM just gives offset, manual shift is easiest for simple HH:MM display.
        const localTimeMs = utcDate.getTime() + (timezoneOffset * 1000);
        const localDate = new Date(localTimeMs);
        
        let hours = localDate.getUTCHours();
        let minutes = localDate.getUTCMinutes();
        
        // Pad with zeros
        hours = hours.toString().padStart(2, '0');
        minutes = minutes.toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Helper: Get Day Name
    const getDayName = (unixTime, timezoneOffset) => {
        const localDate = new Date((unixTime + timezoneOffset) * 1000);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[localDate.getUTCDay()];
    };

    // Helper to determine the background class
    const updateBackground = (weatherId, isDay) => {
        document.body.className = ''; // reset classes

        // OWM Condition Codes: https://openweathermap.org/weather-conditions
        if (weatherId >= 200 && weatherId < 300) {
            document.body.classList.add('bg-thunderstorm');
        } else if (weatherId >= 300 && weatherId < 400) {
            document.body.classList.add('bg-rain'); // Drizzle
        } else if (weatherId >= 500 && weatherId < 600) {
            document.body.classList.add('bg-rain'); // Rain
        } else if (weatherId >= 600 && weatherId < 700) {
            document.body.classList.add('bg-snow'); // Snow
        } else if (weatherId >= 700 && weatherId < 800) {
            document.body.classList.add('bg-mist'); // Atmosphere/Mist
        } else if (weatherId === 800) {
            // Clear
            if (isDay) {
                // Approximate morning vs afternoon based on local time could go here, 
                // but we'll keep it simple: day or night.
                document.body.classList.add('bg-clear-afternoon');
            } else {
                document.body.classList.add('bg-clear-night');
            }
        } else if (weatherId > 800) {
            // Clouds
            if (isDay) {
                document.body.classList.add('bg-clouds-day');
            } else {
                document.body.classList.add('bg-clouds-night');
            }
        } else {
            document.body.classList.add('bg-default');
        }
    };

    // Fetch and Current Update
    const fetchWeather = async (city) => {
        try {
            cityNameEl.textContent = 'Loading...';
            
            // 1. Fetch Current Weather
            const currentRes = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
            if (!currentRes.ok) throw new Error("City not found");
            const currentData = await currentRes.json();

            // 2. Fetch Forecast (3-hour steps for 5 days)
            const forecastRes = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
            const forecastData = await forecastRes.json();

            updateCurrentUI(currentData);
            updateForecastUI(forecastData, currentData.timezone);

        } catch (error) {
            console.error("Weather App Error:", error);
            cityNameEl.textContent = "Error: " + error.message;
        }
    };

    // Also support picking by location
    const fetchWeatherByCoords = async (lat, lon) => {
        try {
            cityNameEl.textContent = 'Loading...';
            const currentRes = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
            if (!currentRes.ok) throw new Error("Location not found");
            const currentData = await currentRes.json();

            const forecastRes = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
            const forecastData = await forecastRes.json();

            updateCurrentUI(currentData);
            updateForecastUI(forecastData, currentData.timezone);
        } catch (error) {
            console.error("Weather App Error:", error);
            cityNameEl.textContent = "Error fetching location.";
        }
    }


    const updateCurrentUI = (data) => {
        cityNameEl.textContent = data.name;
        tempMainEl.innerHTML = `${Math.round(data.main.temp)}<span class="degree">&deg;C</span>`;
        
        // Time & High/Low
        currentTimeEl.textContent = formatTime(data.dt, data.timezone);
        tempHighEl.innerHTML = `H:${Math.round(data.main.temp_max)}&deg;`;
        tempLowEl.innerHTML = `L:${Math.round(data.main.temp_min)}&deg;`;
        
        // Weather Icon (using OWM default icons)
        // reference icons: https://openweathermap.org/img/wn/10d@2x.png
        weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
        weatherIconEl.style.display = 'block';

        // Check if day or night
        // OWM icon string ends with 'd' or 'n'
        const isDay = data.weather[0].icon.endsWith('d');
        updateBackground(data.weather[0].id, isDay);
    };

    const updateForecastUI = (data, timezoneOffset) => {
        // 1. Hourly Forecast (Next 5 items, which is 15 hours)
        hourlyListEl.innerHTML = '';
        const currentCondition = data.list[0].weather[0].description;
        hourlyDescEl.textContent = `${currentCondition.charAt(0).toUpperCase() + currentCondition.slice(1)} expected.`;

        for (let i = 0; i < 5; i++) {
            const item = data.list[i];
            const div = document.createElement('div');
            div.className = 'hourly-item';
            
            // First item could be "Now"
            const timeLabel = i === 0 ? "Now" : formatTime(item.dt, timezoneOffset);
            
            div.innerHTML = `
                <span>${timeLabel}</span>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="icon" />
                <span>${Math.round(item.main.temp)}&deg;</span>
            `;
            hourlyListEl.appendChild(div);
        }

        // 2. 5-Day Forecast (Extracting one daily high/low per day approx 12:00PM or max/min over the day)
        // Since OWM free forecast is 3-hourly, we group by day date.
        
        const dailyData = {};
        
        data.list.forEach(item => {
            // Local date string (YYYY-MM-DD)
            const localDate = new Date((item.dt + timezoneOffset) * 1000).toISOString().split('T')[0];
            
            if (!dailyData[localDate]) {
                dailyData[localDate] = {
                    min: item.main.temp_min,
                    max: item.main.temp_max,
                    icon: item.weather[0].icon, // take the first icon encountered
                    dt: item.dt
                };
            } else {
                dailyData[localDate].min = Math.min(dailyData[localDate].min, item.main.temp_min);
                dailyData[localDate].max = Math.max(dailyData[localDate].max, item.main.temp_max);
                // Prefer daytime icons if encountered
                if (item.weather[0].icon.endsWith('d')) {
                    dailyData[localDate].icon = item.weather[0].icon;
                }
            }
        });

        // Convert to array and slice the next 5 days
        const daysArray = Object.values(dailyData).slice(0, 5);
        
        // Find absolute min and max of the 5 days to scale the temperature bar correctly
        const absMin = Math.min(...daysArray.map(d => d.min));
        const absMax = Math.max(...daysArray.map(d => d.max));
        const tempRange = absMax - absMin;

        forecastListEl.innerHTML = '';
        daysArray.forEach((day, index) => {
            const div = document.createElement('div');
            div.className = 'forecast-item';
            
            const dayName = index === 0 ? "Today" : getDayName(day.dt, timezoneOffset);
            
            // Calculate bar positioning and width percentages
            // E.g., if total range is 10 to 30 (range 20)
            // Day 1 min is 15, max is 25.
            // Bar left = (15 - 10) / 20 * 100% = 25%
            // Bar width = (25 - 15) / 20 * 100% = 50%
            let leftPercent = 0;
            let widthPercent = 100;
            
            if (tempRange > 0) {
               leftPercent = ((day.min - absMin) / tempRange) * 100;
               widthPercent = ((day.max - day.min) / tempRange) * 100;
               // Ensure at least some width is visible if temp didn't change (e.g., 5%)
               if (widthPercent < 5) widthPercent = 5; 
            }

            div.innerHTML = `
                <span class="day">${dayName}</span>
                <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="icon" />
                <span class="low">${Math.round(day.min)}&deg;</span>
                <div class="temp-bar-container">
                    <div class="temp-bar" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
                </div>
                <span class="high">${Math.round(day.max)}&deg;</span>
            `;
            forecastListEl.appendChild(div);
        });

    };


    // Event Listeners
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            fetchWeather(searchInput.value.trim());
            searchInput.value = ''; // clear input
        }
    });

    document.getElementById('location-btn').addEventListener('click', () => {
        if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
                 (position) => {
                     fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                 },
                 (error) => {
                     console.error("Geolocation Error:", error);
                     alert("Unable to get location.");
                 }
             );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    });

    // Initialize with a default city
    fetchWeather('Tokyo');
});
