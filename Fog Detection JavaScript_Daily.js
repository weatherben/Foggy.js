// Define the expanded Southeast region from 100°W to 80°W and 35°N to 25°N
var expandedRegion = ee.Geometry.Rectangle([-100, 25, -80, 35]);

// Load the ERA5-Land dataset for the period (October 1 to December 31, 2023)
var era5_land = ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY")
                 .select(['temperature_2m', 'dewpoint_temperature_2m', 'u_component_of_wind_10m', 'v_component_of_wind_10m', 
                          'surface_net_solar_radiation', 'surface_net_thermal_radiation', 'surface_latent_heat_flux'])
                 .filterDate('2023-10-01', '2023-12-31')  // Filter for the desired date range
                 .filterBounds(expandedRegion);

// Define the fog detection function
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

// Function to calculate daily fog events
var calculateDailyFogEvents = function(day) {
  var start = ee.Date.fromYMD(2023, 10, 1).advance(day, 'day');
  var end = start.advance(1, 'day');

  // Filter fog data for this day
  var daily_fog_hours = fog_hours.filterDate(start, end).sort('system:time_start');

  // Use max to detect if any hour in the day had fog
  var daily_event = daily_fog_hours.reduce(ee.Reducer.max());

  // Format day index as a static string for band naming
  var dayIndex = ee.String('fog_event_day_').cat(ee.Number(day).format('%03d'));

  return daily_event.rename([dayIndex]);
};

// Generate list of days for October to December (92 days)
var days = ee.List.sequence(0, 91);  // 92 days total from Oct 1 to Dec 31

// Calculate daily fog events and store each day as a band
var daily_fog_event_images = ee.ImageCollection.fromImages(
  days.map(function(day) {
    return calculateDailyFogEvents(ee.Number(day));
  })
);

// Combine daily fog events into a multi-band image for the period
var multi_band_fog_events = daily_fog_event_images.toBands();

// Calculate the total fog events over the entire period (optional summary analysis)
var combined_fog_events = multi_band_fog_events.reduce(ee.Reducer.sum()).rename('total_fog_events');

// Combine daily bands with the total fog event band
var full_fog_event_image = multi_band_fog_events.addBands(combined_fog_events);

// Export the full multi-band GeoTIFF
Export.image.toDrive({
  image: full_fog_event_image.toFloat(),
  description: 'Daily_Fog_Events_OctDec2023_ExpandedRegion',
  fileFormat: 'GeoTIFF',
  scale: 9000,  // ERA5-Land resolution (9 km per pixel)
  region: expandedRegion,
  maxPixels: 1e13
});
