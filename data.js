let mymap = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 50
}).addTo(mymap);

fetch('flights/test.json')
.then ( r => r.json() )
.then ( resp => {
    let coords = resp.map( p => [p.data.lat, p.data.lon])
    let times = resp.map( p => p.time)
    let elevation = resp.map ( p => p.data.ele)
    drawTrack(coords)
    drawElevations(elevation, times)
})

function get_decimals(s) {
    return (s<10) ? `0${s}` : s
}

function drawTrack(coords) {
	var polyline = L.polyline(coords, { weight: 6, color: 'darkblue' }).addTo(mymap);
	mymap.fitBounds(polyline.getBounds());

    L.circle([53.1197539, 6.1373938], {
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
    let options = { }

    let config = { type: 'line', data, options }
    new Chart( document.getElementById('elevation'), config)
}