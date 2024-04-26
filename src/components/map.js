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
  
    const [showStateData, setShowStateData] =
    useState(false);

  const [stateLayer, setStateLayer] = useState(null);
  const [map, setMap] = useState(null);

  const handleDesalinationCheckboxChange = (checked) => {
    // If any of the desalination checkboxes are checked, uncheck the energy infrastructure and others checkbox
    setShowEnergyInfrastructure(false);
    setShowStateData(false);
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
      // If energy infrastructure checkbox is checked, uncheck the other checkboxes
      setShowPlanned(false);
      setShowUnderConstruction(false);
      setShowOperational(false);
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
                      if (index % 2 === 0) rows.push([]); // Start a new row every two entries
                      const contentId = `${fieldName}_content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                      const fieldHTML = fieldValue.length > 70 ? `
                          <span id="${contentId}_short">${fieldValue.substring(0, 50)}...</span>
                          <span id="${contentId}_full" class="full-content">${fieldValue}</span>
                          <a href="#" class="read-more-link" data-id="${contentId}">Read More</a>
                      ` : `${fieldValue}`;
                      rows[rows.length - 1].push(`<td class="field-name">${fieldName}</td><td class="field-value">${fieldHTML}</td>`);
                      return rows;
                  }, [])
                  .map(row => `<tr>${row.join('')}</tr>`)
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
              .bindPopup(generatePopupContent(projectName, otherFields, source));
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
      layer.on('mouseover', (e) => {
        // Change the color of the polygon to brown on hover
        e.target.setStyle({
          fillColor: 'brown',
          color: '#d9534f',
          weight: 2,
        });
      });
      // Define mouseout event
      layer.on('mouseout', (e) => {
        // Reset the color of the polygon when not hovering
        e.target.setStyle({
          fillColor: '#90EE90', // Original color
          color: '#006400',
          weight: 2,
        });
      });

          if (feature.properties && feature.properties.name) {
            layer.bindPopup(feature.properties.name);
          }
        },
        style: {
          // Define default styles for your polygons or based on feature properties
          color: '#006400',
          weight: 2,
          opacity: 1,
          fillColor: '#90EE90',
          fillOpacity: 0.7
        }
      }).addTo(map);
      setStateLayer(layer);
    } else if (!showStateData && stateLayer) {
      // Remove GeoJSON layer if it exists and the checkbox is not checked
      map.removeLayer(stateLayer);
      setStateLayer(null);
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
                onChange={(e) =>
                  handleStateDataCheckbox(e.target.checked)
                }
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
