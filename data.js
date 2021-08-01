var flight_data = []
var marker
const mymap = L.map('map');
const f_number = new URLSearchParams(window.location.search).get('f') || 1

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 50
}).addTo(mymap);

fetch(`flights/flight${f_number}.json`)
.then ( r => r.json() )
.then ( resp => {
    show_summary([resp.summary, resp.costs])
    flight_data = resp.flight_data
    let coords = flight_data.map( p => [p.data.lat, p.data.lon])
    let times = flight_data.map( p => p.time)
    let elevation = flight_data.map ( p => p.data.ele)
    drawTrack(coords)
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

function drawTrack(coords) {
	var polyline = L.polyline(coords, { weight: 6, color: 'darkblue' }).addTo(mymap);
	mymap.fitBounds(polyline.getBounds());

    marker = L.circle([flight_data[0].data.lat, flight_data[0].data.lon], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(mymap);
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
    let options = {
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

            if (marker) {
                mymap.removeLayer(marker)
            } 
            try {
                marker = L.circle([flight_data[dataX].data.lat, flight_data[dataX].data.lon ], {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    radius: 500
                }).addTo(mymap);
            } catch (e) {}
        }
     }

    let config = { type: 'line', data, options }
    const chart = new Chart( document.getElementById('elevation'), config)
}