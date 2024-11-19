# FoggyJS
### **Fog Detection System Using ERA5-Land Reanalysis Data**

-Overview

This repository provides a robust framework for detecting fog events using ERA5-Land reanalysis data in Google Earth Engine (GEE). The system leverages key meteorological variables to identify fog events based on threshold-based criteria. It includes scripts for analyzing hourly fog conditions and aggregating results into daily and total fog events, with outputs as GeoTIFF files.

-Fog Detection Criteria

The detection system identifies fog based on the following criteria:

Relative Humidity (RH) > 95%: Ensures that the air is near saturation.
Temperature-Dew Point Difference (T - Td) < 2°C: Indicates that temperature is close to the dew point.
Wind Speed < 5 m/s: Supports stable conditions conducive to fog formation.
Net Radiation < 0 W/m²: Indicates surface cooling (key for radiation fog).
Optionally: Surface Latent Heat Flux > 0 W/m²: Captures additional moisture contributions from evaporation (used in some scripts).

-Features
Hourly Fog Detection: Detects fog for each hour of a given date range.
Daily Aggregation: Aggregates hourly fog detections into daily fog events.
Spatial Coverage: Covers the Southeast US or custom-defined regions (configurable in the script).

-Outputs:
Multi-band GeoTIFFs (e.g., each hour or day as a band).
Total fog events for the specified time period.
Customizable: Includes adjustable parameters for thresholds and region of interest.

-Scripts
The repository contains the following scripts:

Hourly Fog Detection:
Detects fog on an hourly basis for a specific day or date range.
Daily Fog Event Aggregation:
Aggregates fog detections into daily events.
Batch Processing for Specific Dates:
Runs the fog detection for multiple specified dates and outputs separate results for each.

-Input Data
The scripts use the ERA5-Land Hourly dataset provided by the Copernicus Climate Change Service (C3S). The dataset includes high-resolution meteorological variables at a spatial resolution of 9 km.

Key Variables Used:
temperature_2m (°K): Near-surface air temperature.
dewpoint_temperature_2m (°K): Near-surface dew point temperature.
u_component_of_wind_10m (m/s): East-west wind component at 10 m.
v_component_of_wind_10m (m/s): North-south wind component at 10 m.
surface_net_solar_radiation (W/m²): Net solar radiation at the surface.
surface_net_thermal_radiation (W/m²): Net thermal radiation at the surface.
Optional: surface_latent_heat_flux (W/m²): Represents moisture contributions from evaporation.

How to Use
Set Up Google Earth Engine:

Ensure you have access to the Google Earth Engine (GEE) platform and have authorized the GEE Python or JavaScript API.
Load the Script:

Copy the .js files into your GEE editor or import the repository.

Adjust Parameters: 
Configure the following parameters as needed:
Region of Interest (expandedRegion): Customize the geographic bounds.
Date Range (filterDate): Define the start and end dates for analysis.
Fog Detection Thresholds: Modify RH, temperature-dew point difference, wind speed, or radiation thresholds for your study area. (default thresholds are based of peer-reviewed literature)   

Run the Script:

Execute the script directly in GEE.
Outputs will be saved to your Google Drive.
Analyze the Outputs:

The script generates multi-band GeoTIFF files where each band corresponds to:
Hourly fog detections (hourly mode).
Daily fog events (daily aggregation).
Total fog events (summary analysis).
Use GIS software (e.g., QGIS, ArcGIS) or Python (e.g., rasterio, xarray) to visualize and analyze the results.
Example Usage
Custom Date Range (Hourly Fog Detection)
To analyze fog conditions for October 23, 2023, modify the following parameters:

javascript
Copy code
.filterDate('2023-10-23', '2023-10-24')
Batch Processing (Multiple Dates)
To analyze specific dates (e.g., ['2023-10-23', '2012-01-29']), include the dates in the dates array and run the batch processing script.

Outputs
GeoTIFF Files:
Multi-band images where each band corresponds to an hour or day.
A summary band for total fog events in the time range.
Format: GeoTIFF, 32-bit floating point, spatial resolution of 9 km.
Required Libraries and Tools
Google Earth Engine (GEE): Required for running the scripts.
QGIS/ArcGIS: Optional for visualizing and analyzing GeoTIFF outputs.
Python Tools (Optional for post-processing):
rasterio: For reading and analyzing GeoTIFF files.
numpy/xarray: For numerical analysis of raster data.
Limitations
Spatial Resolution: ERA5-Land has a spatial resolution of 9 km, which may miss fine-scale fog patterns.
Temporal Resolution: The analysis is hourly; sub-hourly variations are not captured.
Fog Type: The method is best suited for radiation fog but also captures evaporation and advection fog under certain conditions.
Citation and References
If you use this repository in your research, please cite the ERA5-Land dataset and relevant sources:

ERA5-Land hourly data from Copernicus Climate Change Service (C3S).
Google Earth Engine Documentation.
Contact
For questions, feedback, or contributions:

Author: [Benjamin Thigpen]
Email: [benjamin.thigpen@uga.edu]
Affiliation: [University of Georgia]



