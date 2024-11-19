// Define the expanded Southeast region from 105°W to 70°W and 40°N to 25°N
var expandedRegion = ee.Geometry.Rectangle([-100, 25, -80, 35]);

// Load the ERA5-Land dataset for October 23, 2023
var era5_land = ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY")
                 .select(['temperature_2m', 'dewpoint_temperature_2m', 'u_component_of_wind_10m', 'v_component_of_wind_10m', 
                          'surface_net_solar_radiation', 'surface_net_thermal_radiation', 'surface_latent_heat_flux'])
                 .filterDate('2023-10-23', '2023-10-24')  // Filter for a single day
                 .filterBounds(expandedRegion);

// Define the fog detection function using both net radiation and latent heat flux
var detectFogConditions = function(image) {
  var a = 17.27;
  var b = 237.7;

  // Convert temperature and dew point from Kelvin to Celsius
  var tempC = image.select('temperature_2m').subtract(273.15);
  var dewC = image.select('dewpoint_temperature_2m').subtract(273.15);

  // Calculate saturation vapor pressure (es) and actual vapor pressure (ed)
  var es = tempC.expression('6.112 * exp((a * T) / (T + b))', {'T': tempC, 'a': a, 'b': b});
  var ed = dewC.expression('6.112 * exp((a * Td) / (Td + b))', {'Td': dewC, 'a': a, 'b': b});

  // Calculate relative humidity (RH)
  var rh = ed.divide(es).multiply(100);

  // Calculate temperature-dew point difference
  var temp_dew_diff = tempC.subtract(dewC);

  // Calculate wind speed (u^2 + v^2)
  var wind_speed = image.expression('sqrt(u*u + v*v)', {
    'u': image.select('u_component_of_wind_10m'),
    'v': image.select('v_component_of_wind_10m')
  });

  // Calculate net radiation: surface_net_solar + surface_net_thermal
  var net_radiation = image.select('surface_net_solar_radiation').add(image.select('surface_net_thermal_radiation'));

  // Get surface latent heat flux
  var latent_heat_flux = image.select('surface_latent_heat_flux');

  // Fog detection based on combined conditions
  var fog = rh.gt(95)                       // High RH > 95%
             .and(temp_dew_diff.lt(2))      // Temperature-dew point spread < 2°C
             .and(wind_speed.lt(5))         // Wind speed < 5 m/s
             .and(net_radiation.lt(0)       // Negative net radiation
                 .or(latent_heat_flux.gt(0)))  // OR High latent heat flux indicating moisture addition
             .rename('fog_hour');

  return fog.set('system:time_start', image.get('system:time_start'));
};

// Apply the fog detection function to each hourly image
var fog_hours = era5_land.map(detectFogConditions);

// Convert each hour to a separate band
var hourly_fog_event_images = fog_hours.toBands();

// Calculate the total fog hours across the entire day by summing all hourly bands
var total_fog_hours = fog_hours.reduce(ee.Reducer.sum()).rename('total_fog_hours');

// Combine hourly bands with the total fog hours band
var full_fog_event_image = hourly_fog_event_images.addBands(total_fog_hours);

// Export the full multi-band GeoTIFF
Export.image.toDrive({
  image: full_fog_event_image.toFloat(),
  description: 'Hourly_Fog_Oct23_2023_ExpandedRegion_WithTotalFogHours',
  fileFormat: 'GeoTIFF',
  scale: 9000,  // ERA5-Land resolution (9 km per pixel)
  region: expandedRegion,
  maxPixels: 1e13
});
