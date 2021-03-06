let gpxParser = require('gpxparser');
let fetch = import('node-fetch')
const fs = require('fs');

let org_data = []
fs.readFile('flights/tmp.gpx', (err, data) => {
    let parser = new gpxParser()
    parser.parse(data)
    create_file(parser.tracks[0].points)
})

function create_file(points) {
    //https://gist.github.com/robmathers/1830ce09695f759bf2c4df15c29dd22d
    let data = points.reduce ( (store, item) => {
        let t = new Date(item.time)
        let key = `${get_decimals(t.getHours())}:${get_decimals(t.getMinutes())}`
       // console.log(key)

        store[key] = store[key] || []
        store[key].push(item)
        //console.log(store)
        return store
    }, {})

    //console.log(data)

    let rv = []
    for (item in data) {
        let l = data[item].length

        let lat = (data[item].map ( e => e.lat).reduce( (a,b)=>a+b ) / l).toFixed(7) 
        let lon = (data[item].map ( e => e.lon).reduce( (a,b)=>a+b ) / l).toFixed(7)
        let ele = (data[item].map ( e => e.ele).reduce( (a,b)=>a+b ) / l).toFixed(2)

        rv.push ( { "time":item, "data":{lat, lon, ele}} )
    }

    console.log(JSON.stringify(rv))
}

function get_decimals(s) {
    return (s<10) ? `0${s}` : s
}
