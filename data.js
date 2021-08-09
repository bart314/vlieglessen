var flight_data = []
var marker
const mymap = L.map('map');
const marker_options = {   color: 'red',
fillOpacity: 0.5,
radius: 500,
weight:1}

const f_number = new URLSearchParams(window.location.search).get('f') || 1

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 50
}).addTo(mymap);

fetch(`flights/flight${f_number}.gpx`)
.then ( r => r.text() )
.then ( gpx => {
    let parser = new gpxParser();
    parser.parse(gpx);
    let coordinates = parser.tracks[0].points.map(p => [p.lat.toFixed(5), p.lon.toFixed(5)]);
    var polyline = L.polyline(coordinates, { weight: 2, color: 'darkblue' }).addTo(mymap);

    // zoom the map to the polyline
    mymap.fitBounds(polyline.getBounds());
})

fetch(`flights/flight${f_number}.json`)
.then ( r => r.json() )
.then ( resp => {
    show_summary([resp.summary, resp.costs])
    flight_data = resp.flight_data
    let times = flight_data.map( p => p.time)
    let elevation = flight_data.map ( p => p.data.ele)
    drawElevations(elevation, times)
})

function show_summary(data) {
    for (i of ['date','instructor','airplane','wheather','summary','duration','total_time']) {
        d(i).innerHTML = data[0][i]
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
    const formatter = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR'}) 
    for (i of ['rent','costs-instructor','landing','costs-flight','costs-total']) {
        d(i).innerHTML = formatter.format(data[1][i])
    }
}

function d(el) {
    return document.getElementById(el)
}

function drawElevations(eles, times) {
    let data = { labels:times,
        datasets: [{
          label: 'Hoogte (meters)',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: eles,
        }]
    }

    //https://stackoverflow.com/a/68138981/10974490
    //https://stackoverflow.com/a/43658507/10974490
    let options = {
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'nearest',
                intersect:false,
            }
        },
        hover: {
            mode:'index',
            intersect: false
        },
        onHover: (e) => {
            const canvasPosition = Chart.helpers.getRelativePosition(e, chart);
            const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);

            if (marker) mymap.removeLayer(marker)
            try {
                marker = L.circle([flight_data[dataX].data.lat, flight_data[dataX].data.lon ], marker_options)
                  .addTo(mymap);
            } catch (e) {}
        }
     }

    let config = { type: 'line', data, options }
    const chart = new Chart( document.getElementById('elevation'), config)
}