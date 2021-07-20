let mymap = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 50
}).addTo(mymap);

fetch('flights/2021-07-19.gpx')
  .then ( r => r.text() )
  .then ( gpx => {
    let parser = new gpxParser()
    parser.parse(gpx)
    let els = summarize_gpx(parser.tracks[0])
    console.log(els)

    //let t = parser.tracks[0].points[1].time
    //console.log(t.getHours(), t.getMinutes(), t.getSeconds())


	let coordinates = parser.tracks[0].points.map(p => [p.lat.toFixed(5), p.lon.toFixed(5)]);
    let elevations = parser.tracks[0].points.map (p => p.ele)
    let times = parser.tracks[0].points.map (p => p.time)
            .map ( t => `${t.getHours()}:${get_decimals(t.getMinutes())}:${get_decimals(t.getSeconds())}`)
    console.log(times[1])
    drawTrack(coordinates)
    drawElevations(elevations, times)
})


function summarize_gpx(gpx) {
    let start = gpx.points[0].time.getMinutes()
    let rv = []
    gpx.points.forEach( (val,idx) => {
        console.log(val.time.getMinutes())
        console.log(start)
        if (val.time.getMinutes() > start){
            console.log(val)
            rv.push(val)
            start = val.time.getMinutes()
        }
    })
    return rv
}

function get_decimals(s) {
    return (s<10) ? `0${s}` : s
}

function drawTrack(coords) {
	var polyline = L.polyline(coords, { weight: 6, color: 'darkblue' }).addTo(mymap);
	mymap.fitBounds(polyline.getBounds());
}

function drawElevations(eles, times) {
    let data = { labels:times,
        datasets: [{
          label: 'My First dataset',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: eles,
        }]
    }
    let options = {
        scales: {
            x: {
                ticks: {
                    callback: function(val, idx) {
                        console.log(this.getLabelForValue(idx))
                        return idx%41==0 ? this.getLabelForValue(val) : ''
                    }
                }
            }
        }
    }
    let config = { type: 'line', data, options }
    new Chart( document.getElementById('elevation'), config)
}