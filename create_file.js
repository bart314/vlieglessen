/*
let org_data = [
    { "lat": 53.1197743, "lon": 6.1374082, "ele": 13.4, "time": "2021-06-19T07:51:29.000Z" },
    { "lat": 53.1197458, "lon": 6.1373892, "ele": 12.6, "time": "2021-06-19T07:52:25.000Z" },
    { "lat": 53.1197458, "lon": 6.1373892, "ele": 12.6, "time": "2021-06-19T07:53:52.000Z" },
    { "lat": 53.1197458, "lon": 6.1373892, "ele": 12.6, "time": "2021-06-19T07:53:55.000Z" },
    { "lat": 53.1197415, "lon": 6.1373841, "ele": 13.2, "time": "2021-06-19T07:51:39.000Z" },
    { "lat": 53.1197458, "lon": 6.1373892, "ele": 14.6, "time": "2021-06-19T07:52:55.000Z" },
]
*/
let gpxParser = require('gpxparser');
let fetch = require('node-fetch')
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
