var map = L.map('map');
    var defaultLocation = [27.86844398704398, -82.72174687141549];
  
    map.setView(defaultLocation, 23);
  
    var satelliteBasemap = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }
    ).addTo(map);
  
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
  
    var customPolylineOptions = {
      shapeOptions: {
        color: 'blue',
        dashArray: '18.8, 18.8',
      },
    };
  
    var drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: false,
      },
      draw: {
        polyline: customPolylineOptions,
        polygon: true,
        marker: {
          icon: new L.Icon.Default(),
        },
      },
    });
  
    map.addControl(drawControl);
  
    var totalDistance = 0;
    var totalSections = 0;
    var popups = [];
    var markers = [];
    var markerInterval = 8;
  
    function displayDistance(layer) {
    var distance = layer._latlngs.reduce(function (acc, val, index, array) {
        if (index > 0) {
            acc += val.distanceTo(array[index - 1]);
        }
        return acc;
    }, 0);

    var distanceInFeet = distance * 3.28084;

    var dashLength = parseInt(document.getElementById('dashLength').value) ;
    var gapLength = parseInt(document.getElementById('gapLength').value) ;
    var posts = parseInt(document.getElementById('postsInput').value);


    // Calculate sections based on dash length
    var sections = Math.floor(distanceInFeet / (dashLength + gapLength));
    const remainder = (distanceInFeet % (dashLength + gapLength));
    if (remainder != 0) {
      sections = sections +1 ;
    }

    var labelContent = `<div>${distanceInFeet.toFixed(2)} feet</div>`;

    var label = L.divIcon({
        className: 'label',
        html: labelContent
    });

    var latLngs = layer.getLatLngs();
    var midPoint = L.latLng((latLngs[0].lat + latLngs[1].lat) / 2, (latLngs[0].lng + latLngs[1].lng) / 2);
    L.marker(midPoint, { icon: label }).addTo(map);

    var lineDetailsDiv = document.getElementById('line-details');
    var lineDetails = `<div>Distance: ${distanceInFeet.toFixed(2)} feet <strong>Sections:</strong> ${sections} <strong>Posts:</strong> ${posts} </div>`;
    lineDetailsDiv.innerHTML += lineDetails;

    totalDistance += distanceInFeet;
    totalSections += sections;
    updateTotalDistancePopup();
  }

    function updateTotalDistancePopup() {
      var totalDistancePopup = document.getElementById('total-distance-popup');
      totalDistancePopup.innerHTML = `<strong>Total Distance:</strong> ${totalDistance.toFixed(2)} feet, <strong>Total Sections:</strong> ${totalSections}`;
    }
  
    map.on('draw:created', function(e) {
      var layer = e.layer;
      drawnItems.addLayer(layer);
  
      displayDistance(layer);
  
      popups.push(layer.getPopup());
    });
  
    function deleteDrawnLines() {
      drawnItems.eachLayer(function(layer) {
        if (layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      removeLabels();

      var lineDetailsDiv = document.getElementById('line-details');
      lineDetailsDiv.innerHTML = '';

      totalDistance = 0;
      totalSections = 0;
      updateTotalDistancePopup();

      popups = [];
    }

    function removeLabels() {
      map.eachLayer(function(layer) {
        if (layer instanceof L.Marker && layer._icon.classList.contains('label')) {
          map.removeLayer(layer);
        }
      });
    }

    function togglePopups() {
      for (var i = 0; i < popups.length; i++) {
        var popup = popups[i];
        if (map.hasLayer(popup)) {
          map.removeLayer(popup);
        } else {
          map.addLayer(popup);
        }
      }
    }

    function zoomToAddress() {
      var address = document.getElementById('addressInput').value;
      var apiKey = '137cd95c485341e296f7f4e101a37bfc';
  
      fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
          if (data.results.length > 0) {
            var lat = data.results[0].geometry.lat;
            var lon = data.results[0].geometry.lng;
            var coordinates = [lat, lon];
  
            map.setView(coordinates, 23);
          } else {
            alert('Address not found.');
          }
        })
        .catch(error => {
          console.error('Error fetching geolocation data:', error);
        });
    }