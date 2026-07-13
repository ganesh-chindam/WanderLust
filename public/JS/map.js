// coordinates = [longitude, latitude] from MongoDB

const map = L.map("map").setView(
    [coordinates[1], coordinates[0]],
    15 //we can also increase the zoom size to more like 16 etc
);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

L.marker([coordinates[1], coordinates[0]])
    .addTo(map)
    .bindPopup(`
        <b>${listingTitle}</b><br>
        Exact location will be provided after booking.
    `)
    .openPopup();

