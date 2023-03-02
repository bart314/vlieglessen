import { data } from './flight-data'

function get_time_string(minutes) {
  let hrs = Math.floor(minutes/60)
  hrs = hrs < 10 ? `0${hrs}` : `${hrs}`
  let mins = minutes%60
  mins = mins < 10 ? `0${mins}` : `${mins}`
  return `${hrs}:${mins}`
}

data.forEach ( el => el.datum = new Date(el.datum) )

var marker
const mymap = L.map('map');
const marker_options = {   color: 'red', fillOpacity: 0.5, radius: 5, weight:1}
const f_number = parseInt(new URLSearchParams(window.location.search).get('f')) || 1
const thisday = data[f_number-1]
const previousdays = data.filter( el => el.datum<=new Date(thisday.datum) )

thisday.vluchtkosten = thisday.lesgeld + thisday.landing + thisday.huur
thisday.totale_kosten = previousdays.map( el=> el.lesgeld+el.landing+el.huur ).reduce( (acc,el) => acc+el )
thisday.totale_tijd = get_time_string(previousdays.map( el => el.duur ).reduce ( (acc,el) => acc+el ))

thisday.duur = get_time_string(thisday.duur)
thisday.datum = `Vlucht ${f_number}: ` + thisday.datum.toLocaleString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

for (let i of ['datum','instructeur','toestel','weer','samenvatting','duur','totale_tijd']) {
    document.getElementById(i).innerHTML = thisday[i]
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
const formatter = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR'}) 
for (let i of ['huur','lesgeld','landing','vluchtkosten','totale_kosten']) {
    d(i).innerHTML = formatter.format(thisday[i])
}

//,'total_time'

if (f_number > 1) {
    d("vorige_vlucht").href=`?f=${f_number-1}`
} else {
    d("vorige_vlucht").href=""
    d("vorige_vlucht").classList.add('disabled')
}

if (f_number < data.length) {
    d('volgende_vlucht').href =`?f=${f_number + 1}`
} else {
    d("volgende_vlucht").href=""
    d("volgende_vlucht").classList.add('disabled')
}


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 50
}).addTo(mymap);

fetch(`flights/flight${f_number}.gpx`)
.then ( r => {
    if (!r.ok) throw new Error ('file not found')
    return r.text() 
})
.then ( gpx => {
    let parser = new gpxParser();
    parser.parse(gpx);
    let coordinates = parser.tracks[0].points.map(p => [p.lat.toFixed(5), p.lon.toFixed(5)]);
    var polyline = L.polyline(coordinates, { weight: 2, color: 'darkblue' }).addTo(mymap);

    // zoom the map to the polyline
    mymap.fitBounds(polyline.getBounds());
})
.catch ( err => {
    console.error('not found')
    document.querySelector('#map').innerHTML = 'Geen data opgenomen'
})

fetch(`flights/flight${f_number}.json`)
.then ( resp => {
    if (!resp.ok) throw new Error ('file not found')
    return resp.json() 
})
.then ( json => {
    let flight_data = json.flight_data
    let times = flight_data.map( p => p.time)
    let elevation = flight_data.map ( p => p.data.ele)
    show_elevation(elevation, times)
})
.catch ( err => document.querySelector('#canvas').style.display = 'none' )

/*
fetch(`flights/flight${f_number}.json`)
.then ( r => r.json() )
.then ( resp => {
    show_summary([resp.summary, resp.costs])
    show_progress(resp.progress)
    flight_data = resp.flight_data
    let times = flight_data.map( p => p.time)
    let elevation = flight_data.map ( p => p.data.ele)
    sh0w_elevation(elevation, times)
})
*/
async function show_progress(progress) {
  create_progress_array( progress )
  .then (data => {
      var html = '<tr><th>Fase</th><th>Onderdeel en beschrijving</th><th>Deze vlucht</th></tr>'
      for (let f in data) {
          let sep = ''
          html += '<tbody>'
          html += `<tr><td rowspan=${data[f].length}>${f}</td>`
          for (el of data[f]) {
              html += `${sep}<td>${el.onderdeel} - ${el.omschrijving}</td>`
              html += `<td>${el.grade}`
              sep = '<tr>'
          }
          html += '</tbody>'
      }
      document.querySelector('#progress').innerHTML = html
    })
}

function d(el) {
    return document.getElementById(el)
}

function show_elevation(eles, times) {
    console.log('hier?')
    let data = { labels:times,
        datasets: [{
          label: 'Hoogte (meters)',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: eles,
        }]
    }

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
        /*
        onHover: (e) => {
            const canvasPosition = Chart.helpers.getRelativePosition(e, chart);
            const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
        

            if (marker) mymap.removeLayer(marker)
            try {
                marker = L.circleMarker([flight_data[dataX].data.lat, flight_data[dataX].data.lon ], marker_options)
                  .addTo(mymap);
            } catch (e) {console.error(e)}
        }
        */
     }

    let config = { type: 'line', data, options }
    const chart = new Chart( document.getElementById('elevation'), config)
    console.log(chart)
}


async function create_progress_array(progress) {
  let rv = {}

  await fetch('./flights/voortgang.json')
    .then ( r => r.json() )
    .then ( data => {
      for (let p of progress) {
        let f = get_fase(p[0])
        rv[f] = rv[f] || []

        let foo = data['onderdelen'].filter( e => e.id==p[0] )[0]
	    foo['grade'] = p[1]
        rv[f].push(foo)
      }
    })
  return rv
}

function get_fase(el){
  if (el<20) return 'fase1'
  if (el<24) return 'fase2'
  if (el<34) return 'fase3'
  if (el<36) return 'fase4'
  if (el<38) return 'fase5'
  if (el<41) return 'fase6'
  return 'fase7'
}