import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import data from "../data/desalination.json"; // Import JSON data
import stateData from "../data/states.json";
import markerPlanned from "../assets/planned.png";
import markerUnderConstruction from "../assets/construction.png";
import markerOperational from "../assets/online.png";
import {  Row, Col, Form } from 'react-bootstrap';

import "./map.css";

const GulfOfMexicoMap = () => {
  const [showPlanned, setShowPlanned] = useState(true);
  const [showUnderConstruction, setShowUnderConstruction] = useState(true);
  const [showOperational, setShowOperational] = useState(true);

  const [showEnergyInfrastructure, setShowEnergyInfrastructure] =
    useState(false);

  const [showStateData, setShowStateData] = useState(false);

  const [stateLayer, setStateLayer] = useState(null);
  const [map, setMap] = useState(null);

  const handleDesalinationCheckboxChange = (checked) => {
    // If any of the desalination checkboxes are checked, uncheck the energy infrastructure checkbox
    setShowEnergyInfrastructure(false);
  };

  const handleEnergyInfrastructureCheckbox = (checked) => {
    if (checked) {
      // If energy infrastructure checkbox is checked, uncheck the other checkboxes
      setShowPlanned(false);
      setShowUnderConstruction(false);
      setShowOperational(false);
      setShowStateData(false);
    }
    setShowEnergyInfrastructure(checked);
  };
  const handleStateDataCheckbox = (checked) => {
    if (checked) {
      // If energy state checkbox is checked, uncheck the other checkboxes
     
      setShowEnergyInfrastructure(false);
    }
    setShowStateData(checked);
  };

  useEffect(() => {
    const mapInstance = L.map("map").setView([27.994402, -90.502335], 6);

    L.tileLayer(
      "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoib2dlaWQzMDAwIiwiYSI6ImNsdDU4Z2hxZzBiNTIyam83bG85ZHU1bmUifQ.bJcmSX0j4Jk6AvKC9dUFUA",
      {
        maxZoom: 18,
        attribution:
          'Map data &copy; <a href="https://www.mapbox.com/">Mapbox</a> contributors, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
        tileSize: 512,
        zoomOffset: -1,
      }
    ).addTo(mapInstance);

    setMap(mapInstance);

    return () => {
      // Clean up
      mapInstance.remove();
    };
  }, []);

  // New useEffect to conditionally render base map when showEnergyInfrastructure is false
  // useEffect(() => {
  //   if (!map) return;

  //   const baseLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  //     attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  //     maxZoom: 18,
  //   });

  //   // Remove existing base map layer if it exists
  //   map.eachLayer((layer) => {
  //     if (layer._url === "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png") {
  //       map.removeLayer(layer);
  //     }
  //   });

  //   // Add or remove base map layer based on showEnergyInfrastructure
  //   if (!showEnergyInfrastructure) {
  //     baseLayer.addTo(map);
  //   }

  //   return () => {
  //     // Clean up by removing base map layer when component unmounts
  //     map.removeLayer(baseLayer);
  //   };
  // }, [showEnergyInfrastructure, map]);

  useEffect(() => {
    if (!map) return;

    //Desalination Markers
    const markers = [];
    // Function to get marker icon based on status and size
    function getMarkerIcon(status, size) {
      let iconUrl;
      let iconSize;
      switch (status) {
        case "Planned":
          iconUrl = markerPlanned;
          break;
        case "Under Construction":
          iconUrl = markerUnderConstruction;
          break;
        case "Operational":
          iconUrl = markerOperational;
          break;
        default:
          iconUrl = null;
          break;
      }

      // Set icon size based on the "Size" field
      switch (size) {
        case "XL":
          iconSize = [40, 40]; // Adjust the size as needed
          break;
        case "L":
          iconSize = [32, 32]; // Adjust the size as needed
          break;
        case "M":
          iconSize = [24, 24]; // Adjust the size as needed
          break;
        default:
          // Default size if not specified or invalid
          iconSize = [32, 32];
          break;
      }

      if (iconUrl) {
        return L.icon({
          iconUrl,
          iconSize,
        });
      } else {
        return null;
      }
    }

    function generatePopupContent(projectName, otherFields, source) {
      const popupContent = document.createElement("div");
      popupContent.style.maxWidth = "100%"; // Ensure the popup does not exceed the screen width

      
      popupContent.innerHTML = `
      <div class="popup-header">${projectName}</div>
      <div class="popup-body">
          <table class="details-table">
              ${Object.entries(otherFields)
                .reduce((rows, [fieldName, fieldValue], index) => {
                  if (index % 2 === 0 || fieldName==="Latest Updates") rows.push([]); // Start a new row every two entries
                  const contentId = `${fieldName}_content_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                  const fieldHTML =
                    fieldValue.length > 120
                      ? `
                          <span id="${contentId}_short">${fieldValue.substring(
                          0,
                          50
                        )}...</span>
                          <span id="${contentId}_full" class="full-content">${fieldValue}</span>
                          <a href="#" class="read-more-link" data-id="${contentId}">Read More</a>
                      `
                      : `${fieldValue}`;
                      if (fieldName === "Latest Updates") {
                        rows[rows.length - 1].push(
                          `<tr><td  class="field-name">${fieldName}</td><td colspan="3" class="field-value">${fieldHTML}</td></tr>`
                        );
                      }
                      else{
                        rows[rows.length - 1].push(
                          `<td class="field-name">${fieldName}</td><td class="field-value">${fieldHTML}</td>`
                        );
                      }

                  return rows;
                }, [])
                .map((row) => `<tr>${row.join("")}</tr>`)
                .join("")}
          </table>
      </div>
      
      <div>
      
  <button onclick="window.open('${source}', '_blank');" class="source-button">Source</button>
</div>

      `;

      // Attach event listener for "Read More" links
      popupContent.querySelectorAll(".read-more-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const uniqueId = e.target.getAttribute("data-id");
          const shortContent = document.getElementById(`${uniqueId}_short`);
          const fullContent = document.getElementById(`${uniqueId}_full`);
          const expanded = e.target.getAttribute("data-expanded") === "true";

          if (expanded) {
            shortContent.style.display = "inline";
            fullContent.style.display = "none";
            e.target.textContent = "Read More";
            e.target.setAttribute("data-expanded", "false");
          } else {
            shortContent.style.display = "none";
            fullContent.style.display = "inline";
            e.target.textContent = "Read Less";
            e.target.setAttribute("data-expanded", "true");
          }
        });
      });

      return popupContent;
    }

    // Add markers from JSON data with custom icons
    data.forEach((markerData) => {
      const {
        lat,
        long,
        "\ufeffProject Name": projectName,
        Status: status,
        Size: size,
        Source: source,
        ...otherFields
      } = markerData; // Modify this line to access "lat" and "long"
      if (lat && long) {
        if (
          (status === "Planned" && showPlanned) ||
          (status === "Under Construction" && showUnderConstruction) ||
          (status === "Operational" && showOperational)
        ) {
          const markerIcon = getMarkerIcon(status, size);
          if (markerIcon) {
            const marker = L.marker([parseFloat(lat), parseFloat(long)], {
              icon: markerIcon,
            }) // Modify this line to use "lat" and "long"
              .addTo(map)
              .bindPopup(
                generatePopupContent(projectName, otherFields, source)
              );
            marker.markerData = { lat, long, status, size, ...otherFields }; // Store the entire markerData object as a property of the marker
            markers.push(marker);
          }
        }
      }
    });

    return () => {
      // Clean up
      markers.forEach((marker) => map.removeLayer(marker));
    };
  }, [map, showPlanned, showUnderConstruction, showOperational]);

  useEffect(() => {
    if (!map) return;

    // Load GeoJSON layer
    if (showStateData && !stateLayer) {
      const layer = L.geoJson(stateData, {
        onEachFeature: (feature, layer) => {
          // Define mouseover event
          layer.on("mouseover", (e) => {
            // Change the color of the polygon to brown on hover
            e.target.setStyle({
              fillColor: "brown",
              color: "#d9534f",
              weight: 2,
            });
          });
          // Define mouseout event
          layer.on("mouseout", (e) => {
            // Reset the color of the polygon when not hovering
            e.target.setStyle({
              fillColor: "#90EE90", // Original color
              color: "#006400",
              weight: 2,
            });
          });

          if (feature.properties && feature.properties.name) {
            layer.bindPopup(generatePopupContent(feature).innerHTML);
          }
        },
        style: {
          // Define default styles for your polygons or based on feature properties
          color: "#006400",
          weight: 2,
          opacity: 1,
          fillColor: "#90EE90",
          fillOpacity: 0.7,
        },
      }).addTo(map);
      setStateLayer(layer);
    } else if (!showStateData && stateLayer) {
      // Remove GeoJSON layer if it exists and the checkbox is not checked
      map.removeLayer(stateLayer);
      setStateLayer(null);
    }
    function generatePopupContent(feature) {
      const properties = feature.properties;

      // Function to safely retrieve nested properties
      const getNestedValue = (object, keys) =>
        keys.reduce((o, k) => (o || {})[k], object);

      // Create a function to format the number with commas for thousands
      const formatNumber = (num) => num?.toLocaleString() || num;

      const popupContent = document.createElement("div");
      popupContent.style.maxWidth = "100%"; // Ensure the popup does not exceed the screen width
      popupContent.innerHTML = `
      <div class="popup-header" style=" width: 100%;">${properties.name}</div>
      <br>
      <div><strong>Population:</strong> ${formatNumber(
        properties.Population
      )}</div>
      <div class="popup-body">
        <table class="details-table" style="width: 100%; ">
        <tr>
            <!-- Electricity Data Column -->
            <td style="vertical-align: top; width: 50%; padding-left: 0; padding-right: 5px;">
                <table  >
                    <tr><th colspan="2" style="padding-left: 0; padding-right: 5px;">Electricity Data</th></tr>
                    <tr><td style="width: 40%; padding-left: 0; padding-right: 5px;">Production</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityData",
                        "Production",
                        "MWh",
                      ])
                    )} MWh <br>${formatNumber(
        getNestedValue(properties, [
          "ElectricityData",
          "Production",
          "MWh per capita",
        ])
      )} MWh per capita</td></tr>
                    
                    <tr><td style="width: 40%; padding-left: 0; padding-right: 5px;">Consumption</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityData",
                        "Consumption",
                        "MWh",
                      ])
                    )} MWh <br>${formatNumber(
        getNestedValue(properties, [
          "ElectricityData",
          "Consumption",
          "MWh per capita",
        ])
      )} MWh per capita</td></tr>
                    
                    <tr><td style="width: 40%; padding-left: 0; padding-right: 5px;">Renewable</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityData",
                        "Production from Renewable",
                        "MWh",
                      ])
                    )} MWh <br>${formatNumber(
        getNestedValue(properties, [
          "ElectricityData",
          "Production from Renewable",
          "MWh per capita",
        ])
      )} MWh per capita</td></tr>
                    
                    <tr><td style="width: 40%; padding-left: 0; padding-right: 5px;">Non-Renewable</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityData",
                        "Production from Non-Renewable",
                        "MWh",
                      ])
                    )} MWh <br>${formatNumber(
        getNestedValue(properties, [
          "ElectricityData",
          "Production from Non-Renewable",
          "MWh per capita",
        ])
      )} MWh per capita</td></tr>
                    
                    <tr><td style="width: 40%; padding-left: 0; padding-right: 5px;">CO2 Emissions</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityData",
                        "CO2 Emissions from Consumption",
                        "kg",
                      ])
                    )} kg <br>${formatNumber(
        getNestedValue(properties, [
          "ElectricityData",
          "CO2 Emissions from Consumption",
          "kg per capita",
        ])
      )} kg per capita</td></tr>
                    
                    <tr><th colspan="2">Electricity Rate and Bills</th></tr>
                    <tr><td style="width: 40%; padding-left: 0; padding-right: 5px;">Residential</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityRateandBills",
                        "Residential",
                        "centskWh",
                      ])
                    )} cents/kWh </td></tr>
                    <tr><td style="width: 50%; padding-left: 0; padding-right: 5px;">Ave. monthly Bill</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityRateandBills",
                        "Residential",
                        "Ave. monthly Bill",
                      ])
                    )}</td></tr>
                    
                    <tr><td style="width: 40%; padding-left: 0; padding-right: 5px;">Commercial</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityRateandBills",
                        "Commercial",
                        "centskWh",
                      ])
                    )} cents/kWh </td></tr>
                    <tr><td style="width: 50%; padding-left: 0; padding-right: 5px;">Ave. monthly Bill</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityRateandBills",
                        "Commercial",
                        "Ave. monthly Bill",
                      ])
                    )}</td></tr>
                    
                    <tr><td style="width: 40%; padding-left: 0; padding-right: 5px;">Industrial</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityRateandBills",
                        "Industrial",
                        "centskWh",
                      ])
                    )} cents/kWh </td></tr>
                    <tr><td style="width: 50%; padding-left: 0; padding-right: 5px;">Ave. monthly Bill</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "ElectricityRateandBills",
                        "Industrial",
                        "Ave. monthly Bill",
                      ])
                    )}</td></tr>
                  </table>
            </td>
            <!-- Water Data Column -->
            <td style="vertical-align: top; width: 50%; margin-left:2px">
                <table >
                    <tr><th colspan="2">Water Data</th></tr>
                    <tr><td>Current Demand</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "WaterData",
                        "Current Water Demand",
                        "acre-feet/year",
                      ])
                    )} acre-feet/year</td></tr>
                    <tr><td>In-State Supply</td><td>${formatNumber(
                      getNestedValue(properties, [
                        "WaterData",
                        "In-State Supply ",
                        "acre-feet/year",
                      ])
                    )} acre-feet/year</td></tr>
                    
                    <tr><th colspan="2">Water Usage by Type</th></tr>
                    <tr><td>Municipal</td><td>${
                      properties.WaterUsagebyType.Municipal
                    }</td></tr>
                    <tr><td>Irrigation</td><td>${
                      properties.WaterUsagebyType.Irrigation
                    }</td></tr>
                    <tr><td>Livestock</td><td>${
                      properties.WaterUsagebyType.Livestock
                    }</td></tr>
                    <tr><td>Industry</td><td>${
                      properties.WaterUsagebyType.Industry
                    }</td></tr>
                    <tr><td>Electric Power</td><td>${
                      properties.WaterUsagebyType.ElectricPower
                    }</td></tr>


                    <tr><th style="width: 50%;">Average Residential Monthly Water Bill</th><td>${
                      properties.AverageResidentialMonthlyWaterBill
                    }</td></tr>
                    
                </table>
            </td>
        </tr>
    </table>
      
        
      </div>
    `;

      return popupContent;
    }

    return () => {
      // Clean up the GeoJSON layer when the component unmounts or the checkbox is unchecked
      if (map && stateLayer) {
        map.removeLayer(stateLayer);
      }
    };
  }, [map, showStateData, stateLayer]);

  return (
    <Row>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <Col xs={12} md={3} style={{ width: "20%" }}>
          <div
            className="desalination-filter"
            style={{ textAlign: "left", paddingLeft: "10%" }}
          >
            <h4>Desalination Plants</h4>
            <Form style={{ justifyContent: "left" }}>
              <Form.Check
                type="checkbox"
                label="Planned"
                checked={showPlanned}
                onChange={(e) => {
                  setShowPlanned(e.target.checked);
                  handleDesalinationCheckboxChange(e.target.checked);
                }}
              />
              <Form.Check
                type="checkbox"
                label="Under Construction"
                checked={showUnderConstruction}
                onChange={(e) => {
                  setShowUnderConstruction(e.target.checked);
                  handleDesalinationCheckboxChange(e.target.checked);
                }}
              />
              <Form.Check
                type="checkbox"
                label="Operational"
                checked={showOperational}
                onChange={(e) => {
                  setShowOperational(e.target.checked);
                  handleDesalinationCheckboxChange(e.target.checked);
                }}
              />
            </Form>
          </div>
          <div
            className="energy-filter"
            style={{ textAlign: "left", paddingLeft: "10%" }}
          >
            <h4>Energy Infrastructure</h4>
            <Form>
              <Form.Check
                type="checkbox"
                label="Energy Infrastructure"
                checked={showEnergyInfrastructure}
                onChange={(e) =>
                  handleEnergyInfrastructureCheckbox(e.target.checked)
                }
              />
            </Form>
          </div>

          <div
            className="state-filter"
            style={{ textAlign: "left", paddingLeft: "10%" }}
          >
            <h4>State Data</h4>
            <Form>
              <Form.Check
                type="checkbox"
                label="State Data"
                checked={showStateData}
                onChange={(e) => handleStateDataCheckbox(e.target.checked)}
              />
            </Form>
          </div>
        </Col>
        <Col xs={12} md={9} style={{ width: "80%" }}>
          <div className="map-container">
            {showEnergyInfrastructure && (
              <iframe
                src="https://eia.maps.arcgis.com/apps/instant/interactivelegend/index.html?appid=5039a1a01ec34b6bbf0ab4fd57da5eb4"
                frameBorder="0"
                  title="energyinfra"
              ></iframe>
            )}

            <div
              style={{
                width: "100%",
                height: "90vh",
                display: showEnergyInfrastructure ? "none" : "block",
              }}
            >
              <div id="map" style={{ width: "100%", height: "100%" }}></div>
            </div>
          </div>
        </Col>
      </div>
    </Row>
  );
};

export default GulfOfMexicoMap;
