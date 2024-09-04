# TravelTip

#### The app that helps you find your favorite places

## Description

TravelTip is an application that allows users to manage a list of favorite locations.

## Main Features

- The app enables users to store and manage locations.
- Users can search for an address and pan the map to the selected point.
- Users can also pan the map to their current geo-location.

## Locations CRUDL (Create, Read, Update, Delete, List)

- **Create** – Clicking on the map prompts for a location name and rating.
- **Read** – Displays the selected location's details.
- **Update** – Allows the user to update the location's rating.
- **Delete** – Allows the user to delete a location.
- **List** – Includes filtering, sorting, and grouping of locations.

## Selected Location Features

- The selected location is displayed in the header.
- The location is highlighted in the list (gold color).
- A marker is placed on the map for the selected location.
- The selected location is reflected in the query parameters.
- Users can copy the URL to their clipboard.
- Users can share the location via the Web Share API.

## Location Object Format

The location object has the following format:

```js
{
  id: 'GEouN',
  name: 'Dahab, Egypt',
  rate: 5,
  geo: {
    address: 'Dahab, South Sinai, Egypt',
    lat: 28.5096676,
    lng: 34.5165187,
    zoom: 11
  },
  createdAt: 1706562160181,
  updatedAt: 1706562160181
}
```

## Services

The services used in the application:

```js
export const locService = {
  query,
  getById,
  remove,
  save,
  setFilterBy,
  setSortBy,
  getLocCountByUpdateMap,
}

export const mapService = {
  initMap,
  getUserPosition,
  setMarker,
  panTo,
  lookupAddressGeo,
  addClickListener,
}
```

## Controller

The global `app` object makes it easy to interact with DOM functions:

```js
window.app = {
  onRemoveLoc,
  onUpdateLoc,
  onSelectLoc,
  onPanToUserPos,
  onSearchAddress,
  onCopyLoc,
  onShareLoc,
  onSetSortBy,
  onSetFilterBy,
}
```

## Sample Usage

Here is an example of how to use the app:

```html
<button onclick="app.onCopyLoc()">Copy location</button> <button onclick="app.onShareLoc()">Share location</button>
```

This project is based on a starter template from Coding Academy and was enhanced and upgraded by Eliran Zohar & Michael Flaishcer.
