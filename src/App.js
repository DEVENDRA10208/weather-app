import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [city, setCity] = useState("");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // On first load: try last city, otherwise default to Jammalamadugu
  useEffect(() => {
    const savedCity = localStorage.getItem("lastCity");
    if (savedCity) {
      setCity(savedCity);
      fetchForecastByCity(savedCity);
    } else {
      setCity("Jammalamadugu");
      fetchForecastByCity("Jammalamadugu");
    }
  }, []);

  const fetchForecastByCity = async (cityName) => {
    try {
      setLoading(true);
      setError("");

      // Get coordinates from Open-Meteo geocoding
      const geoRes = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
        params: { name: cityName, count: 1, language: "en", format: "json" },
      });

      if (!geoRes.data.results || geoRes.data.results.length === 0) {
        setError("City not found. Please try again.");
        setLoading(false);
        return;
      }

      const { latitude, longitude, name } = geoRes.data.results[0];
      localStorage.setItem("lastCity", name); // save search

      // Fetch forecast
      const weatherRes = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude,
          longitude,
          daily: [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max"
          ],
          timezone: "auto",
        },
      });

      setForecast({
        ...weatherRes.data.daily,
        location: name,
      });

    } catch (err) {
      console.error(err);
      setError("Could not fetch weather. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim() !== "") {
      fetchForecastByCity(city);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>7-Day Weather Forecast • 7 రోజుల వాతావరణం</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city / పట్టణం నమోదు చేయండి"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Get / పొందండి</button>
      </form>

      {loading && <p style={styles.info}>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {forecast && (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <h3 style={styles.subtitle}>{forecast.location}</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Date / తేదీ</th>
                <th style={styles.th}>Rain (mm) / వర్షం</th>
                <th style={styles.th}>Chance % / అవకాశం</th>
                <th style={styles.th}>Rain? / వర్షం?</th>
                <th style={styles.th}>Max °C / గరిష్టం</th>
                <th style={styles.th}>Min °C / కనిష్టం</th>
              </tr>
            </thead>
            <tbody>
              {forecast.time.map((day, index) => {
                const rainChance = forecast.precipitation_probability_max[index];
                const rainText = rainChance > 60 ? "Yes / అవును" : "No / లేదు";
                const rainColor = rainChance > 60 ? "green" : "red";

                return (
                  <tr key={day} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{day}</td>
                    <td style={styles.td}>{forecast.precipitation_sum[index]}</td>
                    <td style={styles.td}>{rainChance}%</td>
                    <td style={{ ...styles.td, fontWeight: "bold", color: rainColor }}>
                      {rainText}
                    </td>
                    <td style={styles.td}>{forecast.temperature_2m_max[index]}</td>
                    <td style={styles.td}>{forecast.temperature_2m_min[index]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!forecast && (
        <p style={styles.tip}>
          Tip: Allow location or search your village.<br/>
          సూచన: లోకేషన్ అనుమతించండి లేదా మీ ఊరు వెతకండి.
        </p>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "10px",
    fontFamily: "Arial, sans-serif",
  },
  title: { textAlign: "center", fontSize: "20px", marginBottom: "10px" },
  subtitle: { textAlign: "center", fontSize: "18px", margin: "10px 0" },
  form: { display: "flex", gap: "8px", marginBottom: "10px" },
  input: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  button: {
    padding: "10px 15px",
    fontSize: "16px",
    border: "none",
    backgroundColor: "#4caf50",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "16px",
    minWidth: "500px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  theadRow: { backgroundColor: "#4caf50", color: "white" },
  th: { padding: "8px", border: "1px solid #ddd" },
  td: { padding: "8px", border: "1px solid #ddd", textAlign: "center" },
  rowEven: { backgroundColor: "#ffffff" },
  rowOdd: { backgroundColor: "#f1f1f1" },
  tip: { textAlign: "center", fontSize: "14px", color: "#555", marginTop: "20px" },
  info: { textAlign: "center", color: "blue" },
  error: { textAlign: "center", color: "red", fontWeight: "bold" },
};

export default App;
