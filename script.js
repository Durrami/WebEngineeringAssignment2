document.addEventListener('DOMContentLoaded', function () {
    let barChartInstance = null;
    let doughnutChartInstance = null;
    let lineChartInstance = null;
    let currentPage = 0;
    const pageSize = 10;
    let forecastData = null;
    let isCelsius = true;

    const weatherApiKey = 'a119fab8b978f3848061e02cf5c93e62';
    const geminiApiKey = 'AIzaSyDKW1bmjb0TgbsvB0fAuXCeIYdp03aVlYY';

    // Fetch weather when user clicks the "Get Weather" button
    document.getElementById('get-weather').addEventListener('click', function () {
        const city = document.getElementById('city-name').value;
        if (city) {
            fetchCurrentWeather(city);
            fetchWeatherForecast(city);
        } else {
            alert('Please enter a city name');
        }
    });

    // Toggle Celsius/Fahrenheit
    document.getElementById('toggleUnit').addEventListener('click', function () {
        isCelsius = !isCelsius;
        updateTemperatureUnits();
    });

    // Pagination for forecast table
    document.getElementById('prevPage').addEventListener('click', function () {
        if (currentPage > 0) {
            currentPage--;
            createForecastTable(forecastData);
        }
    });

    document.getElementById('nextPage').addEventListener('click', function () {
        currentPage++;
        createForecastTable(forecastData);
    });

    function showLoadingSpinner() {
        document.getElementById('loadingSpinner').style.display = 'block';
    }

    function hideLoadingSpinner() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    document.getElementById('ask-chatbot').addEventListener('click', function() {
        const userInput = document.getElementById('user-query').value;
        getChatbotResponse(userInput);
    });

    // Fetch current weather
    function fetchCurrentWeather(city) {
        showLoadingSpinner();
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                hideLoadingSpinner();
                if (data.cod !== 200) {
                    alert('City not found or other error occurred: ' + data.message);
                    return;
                }
                displayCurrentWeather(data);
            })
            .catch(error => {
                hideLoadingSpinner();
                alert('Error fetching data: ' + error.message);
            });
    }

    // Display current weather
    function displayCurrentWeather(data) {
        const weatherWidget = document.querySelector('.weather-widget');
        const weatherDetails = document.getElementById('weatherDetails');
        const { name, main: { temp, humidity }, wind: { speed }, weather } = data;
        const description = weather[0].description;
        const iconCode = weather[0].icon;

        weatherDetails.innerHTML = `
            <h4>Current Weather for ${name}</h4>
            <p class="temperature">${temp.toFixed(1)} °C</p>
            <p>Humidity: ${humidity} %</p>
            <p>Wind Speed: ${speed} m/s</p>
            <p>Weather: ${description}</p>
            <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Weather Icon">
        `;

        updateWidgetBackground(weatherWidget, description);
        weatherWidget.classList.add('show');
    }

    // Update widget background based on weather
    function updateWidgetBackground(widget, description) {
        const condition = description.toLowerCase();
        let gradient = '';

        if (condition.includes('cloud')) {
            gradient = 'linear-gradient(to bottom, #bdc3c7, #2c3e50)';
        } else if (condition.includes('clear')) {
            gradient = 'linear-gradient(to bottom, #2980b9, #6dd5fa, #ffffff)';
        } else if (condition.includes('rain')) {
            gradient = 'linear-gradient(to bottom, #314755, #26a0da)';
        } else if (condition.includes('snow')) {
            gradient = 'linear-gradient(to bottom, #83a4d4, #b6fbff)';
        } else {
            gradient = 'linear-gradient(to bottom, #d7d2cc, #304352)';
        }

        widget.style.backgroundImage = gradient;
    }

    // Fetch weather forecast
    function fetchWeatherForecast(city) {
        showLoadingSpinner();
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherApiKey}&units=metric`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                hideLoadingSpinner();
                if (data.cod !== "200") {
                    alert('City not found or other error occurred: ' + data.message);
                    return;
                }
                forecastData = data;
                createCharts(data);
                createForecastTable(forecastData);
            })
            .catch(error => {
                hideLoadingSpinner();
                alert('Error fetching data: ' + error.message);
            });
    }

    // Update temperature units
    function updateTemperatureUnits() {
        const temperatureElements = document.querySelectorAll('.temperature');
        temperatureElements.forEach(element => {
            let currentTemp = parseFloat(element.textContent);
            if (isCelsius) {
                // Convert Celsius to Fahrenheit
                let tempInFahrenheit = (currentTemp * 9/5) + 32;
                element.textContent = `${tempInFahrenheit.toFixed(1)} °F`;
            } else {
                // Convert Fahrenheit to Celsius
                let tempInCelsius = (currentTemp - 32) * 5/9;
                element.textContent = `${tempInCelsius.toFixed(1)} °C`;
            }
        });
    }

    // Create forecast table with pagination
    function createForecastTable(data) {
        const tableBody = document.querySelector('#forecastTable tbody');
        tableBody.innerHTML = '';

        const startIndex = currentPage * pageSize;
        const endIndex = Math.min(startIndex + pageSize, data.list.length);

        for (let i = startIndex; i < endIndex; i++) {
            const forecast = data.list[i];
            const date = new Date(forecast.dt_txt).toLocaleString();
            const temp = forecast.main.temp;
            const description = forecast.weather[0].description;

            const row = `
                <tr>
                    <td>${date}</td>
                    <td class="temperature">${temp.toFixed(1)} °C</td>
                    <td>${description}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        }

        document.getElementById('prevPage').disabled = currentPage === 0;
        document.getElementById('nextPage').disabled = endIndex >= data.list.length;
    }

    // Create charts
    function createCharts(data) {
        const labels = [];
        const temperatures = [];
        const weatherConditions = {};

        data.list.forEach((item, index) => {
            if (index % 8 === 0) {
                labels.push(new Date(item.dt_txt).toLocaleDateString());
                temperatures.push(item.main.temp);
                const condition = item.weather[0].main;

                weatherConditions[condition] = (weatherConditions[condition] || 0) + 1;
            }
        });

        if (barChartInstance !== null) barChartInstance.destroy();
        if (doughnutChartInstance !== null) doughnutChartInstance.destroy();
        if (lineChartInstance !== null) lineChartInstance.destroy();

        // Bar Chart
        const barCtx = document.getElementById('tempBarChart').getContext('2d');
        barChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temperatures,
                    backgroundColor: 'rgba(173, 216, 230, 0.5)',
                    borderColor: 'rgba(173, 216, 230, 1)',
                    borderWidth: 1
                }]
            }
        });

        // Doughnut Chart
        const doughnutCtx = document.getElementById('weatherDoughnutChart').getContext('2d');
        doughnutChartInstance = new Chart(doughnutCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(weatherConditions),
                datasets: [{
                    data: Object.values(weatherConditions),
                    backgroundColor: ['#FFB6C1', '#87CEFA', '#FFDAB9', '#90EE90', '#DDA0DD']
                }]
            }
        });

                // Line Chart
                const lineCtx = document.getElementById('tempLineChart').getContext('2d');
                lineChartInstance = new Chart(lineCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Temperature (°C)',
                            data: temperatures,
                            fill: false,
                            borderColor: 'rgba(173, 216, 230, 1)',
                            tension: 0.1
                        }]
                    }
                });
            }
        
            // Chatbot API call
            async function getChatbotResponse(userInput) {
                if (userInput.toLowerCase().includes('weather')) {
                    const cityMatch = userInput.match(/weather in (\w+)/i);
                    if (cityMatch && cityMatch[1]) {
                        const city = cityMatch[1];
                        document.getElementById('chatbotResponse').innerText = `Fetching weather for ${city}...`;
                        try {
                            let data = await getWeatherData(city);
                            if (data === null) {
                                document.getElementById('chatbotResponse').innerText = 'Error fetching weather data.';
                                return;
                            }
                            
                            // Display current weather
                            displayCurrentWeather(data); 
            
                            // Fetch and display the forecast data for the city
                            fetchWeatherForecast(city);
            
                            // Chatbot response
                            const weatherDescription = `The current weather in ${city} is ${data.weather[0].description}, with a temperature of ${data.main.temp} °C, humidity of ${data.main.humidity}%, and wind speed of ${data.wind.speed} m/s.`;
                            document.getElementById('chatbotResponse').innerText = weatherDescription;
                        } catch (error) {
                            document.getElementById('chatbotResponse').innerText = 'Error fetching weather data.';
                        }
                    } else {
                        document.getElementById('chatbotResponse').innerText = 'Please specify a city for the weather information.';
                    }
                } else {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
                    const requestData = {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: userInput
                                    }
                                ]
                            }
                        ]
                    };
            
                    fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.candidates && data.candidates.length > 0) {
                                const responseText = data.candidates[0].content.parts[0].text;
                                document.getElementById('chatbotResponse').innerText = responseText;
                            } else {
                                document.getElementById('chatbotResponse').innerText = 'Unable to get a response from the chatbot.';
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            document.getElementById('chatbotResponse').innerText = 'Error: Unable to connect to the chatbot.';
                        });
                }
            }
            
            
            
        
            // Helper function to get weather data
            async function getWeatherData(city) {
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        return await response.json();
                    } else {
                        return null;
                    }
                } catch (error) {
                    console.error('Error fetching weather data:', error);
                    return null;
                }
            }
        
            // Geolocation to fetch weather
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    fetchWeatherByCoords(lat, lon);
                });
            }
        
            function fetchWeatherByCoords(lat, lon) {
                showLoadingSpinner();
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
        
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        hideLoadingSpinner();
                        if (data.cod !== 200) {
                            alert('Error fetching weather for current location');
                            return;
                        }
                        displayCurrentWeather(data);
                    })
                    .catch(error => {
                        hideLoadingSpinner();
                        alert('Error fetching weather: ' + error.message);
                    });
            }
        });
        
