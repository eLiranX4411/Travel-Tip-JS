import { utilService } from './services/util.service.js'
import { locService } from './services/loc.service.js'
import { mapService } from './services/map.service.js'

window.onload = onInit

// To make things easier in this project structure
// functions that are called from DOM are defined on a global app object
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
  closeModalLocaion,
  saveLocation,
  openLocationDialog,
  onAddLoc,
  loadAndRenderLocs,
}

function onInit() {
  getFilterByFromQueryParams()
  loadAndRenderLocs()
  mapService
    .initMap()
    .then(() => {
      // onPanToTokyo()
      mapService.addClickListener(onAddLoc)
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot init map')
    })
}

function renderLocs(locs) {
  mapService.getUserPosition().then((myLoc) => {
    const selectedLocId = getLocIdFromQueryParams()

    var strHTML = locs
      .map((loc) => {
        const disFromMyLoc = utilService.getDistance(loc.geo, myLoc, 'K')
        const className = loc.id === selectedLocId ? 'active' : ''
        return `
          <li class="loc ${className}" data-id="${loc.id}">
              <h4>  
                  <span>${loc.name}</span>
                  <span>Distance: ${disFromMyLoc} KM.</span>
                  <span title="${loc.rate} stars">${'★'.repeat(loc.rate)}</span>
              </h4>
              <p class="muted">
                  Created: ${utilService.elapsedTime(loc.createdAt)}
                  ${loc.createdAt !== loc.updatedAt ? ` | Updated: ${utilService.elapsedTime(loc.updatedAt)}` : ''}
              </p>
              <div class="loc-btns">     
                 <button title="Delete" onclick="app.onRemoveLoc('${loc.id}')">🗑️</button>
                 <button title="Edit" onclick="app.onUpdateLoc('${loc.id}')">✏️</button>
                 <button title="Select" onclick="app.onSelectLoc('${loc.id}')">🗺️</button>
              </div>     
          </li>`
      })
      .join('')

    const elLocList = document.querySelector('.loc-list')
    elLocList.innerHTML = strHTML || 'No locs to show'

    renderLocStats()

    if (selectedLocId) {
      const selectedLoc = locs.find((loc) => loc.id === selectedLocId)
      displayLoc(selectedLoc)
    }
    document.querySelector('.debug').innerText = JSON.stringify(locs, null, 2)
  })
}

function onRemoveLoc(locId) {
  const confirmRemove = confirm('Are you sure?')
  if (confirmRemove) {
    locService
      .remove(locId)
      .then(() => {
        flashMsg('Location removed')
        unDisplayLoc()
        loadAndRenderLocs()
      })
      .catch((err) => {
        console.error('OOPs:', err)
        flashMsg('Cannot remove location')
      })
  } else {
    flashMsg('Remove canceled')
  }
}

function onSearchAddress(ev) {
  ev.preventDefault()
  const el = document.querySelector('[name=address]')
  mapService
    .lookupAddressGeo(el.value)
    .then((geo) => {
      mapService.panTo(geo)
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot lookup address')
    })
}
function openLocationDialog(geo = null, loc = null) {
  const elDialog = document.querySelector('.loc-dialog')
  elDialog.style.display = 'block'

  const isUpdate = loc !== null
  const title = isUpdate ? 'Update location' : 'Add new location'
  const nameValue = loc ? loc.name : ''
  const rateValue = loc ? loc.rate : '3'
  const latValue = geo ? geo.lat : loc.geo.lat
  const lngValue = geo ? geo.lng : loc.geo.lng

  elDialog.innerHTML = `
    <form method="dialog" class="location-form">
      <h3>${title}</h3>
      <label for="lat-loc">Latitude</label>
      <input type="text" id="lat-loc" name="lat" value="${latValue}" readonly required>
      <label for="lng-loc">Longitude</label>
      <input type="text" id="lng-loc" name="lng" value="${lngValue}" readonly required>
      <label for="name-loc">Location Name</label>
      <input type="text" id="name-loc" name="name" value="${nameValue}" required>
      <label for="rate-loc">Rate (1-5)</label>
      <input type="range" id="rate-loc" name="rate" min="1" max="5" value="${rateValue}" required>
      <div class="dialog-actions">
        <button type="submit">${isUpdate ? 'Update' : 'Save'} Location</button>
        <button type="button" onclick="app.closeModalLocaion()">Cancel</button>
      </div>
    </form>
  `

  elDialog.querySelector('.location-form').addEventListener('submit', (event) => {
    event.preventDefault()
    if (isUpdate) {
      saveLocation(loc)
    } else {
      saveLocation(null, geo)
    }
  })
}

function saveLocation(loc = null, geo = null) {
  const elDialog = document.querySelector('.location-form')

  if (!loc) {
    loc = {
      name: elDialog.querySelector('#name-loc').value,
      rate: elDialog.querySelector('#rate-loc').value,
      geo,
    }
  } else {
    loc.name = elDialog.querySelector('#name-loc').value
    loc.rate = elDialog.querySelector('#rate-loc').value
  }

  locService
    .save(loc)
    .then((savedLoc) => {
      const action = loc.geo ? 'Updated' : 'Added'
      flashMsg(`${action} Location (id: ${savedLoc.id})`)
      utilService.updateQueryParams({ locId: savedLoc.id })
      loadAndRenderLocs()
      closeModalLocaion()
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg(`Cannot ${loc.geo ? 'update' : 'add'} location`)
    })
}

function onAddLoc(geo) {
  openLocationDialog(geo)
}

function onUpdateLoc(locId) {
  locService.getById(locId).then((loc) => {
    openLocationDialog(null, loc)
  })
}

function closeModalLocaion() {
  const elDialog = document.querySelector('.loc-dialog')
  elDialog.style.display = 'none'
}

function loadAndRenderLocs() {
  locService
    .query()
    .then(renderLocs)
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot load locations')
    })
}

function onPanToUserPos() {
  mapService
    .getUserPosition()
    .then((latLng) => {
      mapService.panTo({ ...latLng, zoom: 15 })
      unDisplayLoc()
      loadAndRenderLocs()
      flashMsg(`You are at Latitude: ${latLng.lat} Longitude: ${latLng.lng}`)
    })
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot get your position')
    })
}

function onSelectLoc(locId) {
  return locService
    .getById(locId)
    .then(displayLoc)
    .catch((err) => {
      console.error('OOPs:', err)
      flashMsg('Cannot display this location')
    })
}

function displayLoc(loc) {
  mapService.getUserPosition().then((myLoc) => {
    const disFromMyLoc = utilService.getDistance(loc.geo, myLoc, 'K')

    document.querySelector('.loc.active')?.classList?.remove('active')
    document.querySelector(`.loc[data-id="${loc.id}"]`).classList.add('active')

    mapService.panTo(loc.geo)
    mapService.setMarker(loc)

    const el = document.querySelector('.selected-loc')
    el.querySelector('.loc-name').innerText = loc.name
    el.querySelector('.loc-dis').innerText = `Distance: ${disFromMyLoc} KM.`
    el.querySelector('.loc-address').innerText = loc.geo.address
    el.querySelector('.loc-rate').innerHTML = '★'.repeat(loc.rate)
    el.querySelector('[name=loc-copier]').value = window.location
    el.classList.add('show')

    utilService.updateQueryParams({ locId: loc.id })
  })
}

function unDisplayLoc() {
  utilService.updateQueryParams({ locId: '' })
  document.querySelector('.selected-loc').classList.remove('show')
  mapService.setMarker(null)
}

function onCopyLoc() {
  const elCopy = document.querySelector('[name=loc-copier]')
  elCopy.select()
  elCopy.setSelectionRange(0, 99999) // For mobile devices
  navigator.clipboard.writeText(elCopy.value)
  flashMsg('Link copied, ready to paste')
  prompt('first try to marge')
}

function onShareLoc() {
  const url = document.querySelector('[name=loc-copier]').value

  // title and text not respected by any app (e.g. whatsapp)
  const data = {
    title: 'Cool location',
    text: 'Check out this location',
    url,
  }
  navigator.share(data)
}

function flashMsg(msg) {
  const el = document.querySelector('.user-msg')
  el.innerText = msg
  el.classList.add('open')
  setTimeout(() => {
    el.classList.remove('open')
  }, 3000)
}

function getFilterByFromQueryParams() {
  const queryParams = new URLSearchParams(window.location.search)
  const txt = queryParams.get('txt') || ''
  const minRate = queryParams.get('minRate') || 0
  locService.setFilterBy({ txt, minRate })

  document.querySelector('input[name="filter-by-txt"]').value = txt
  document.querySelector('input[name="filter-by-rate"]').value = minRate
}

function getLocIdFromQueryParams() {
  const queryParams = new URLSearchParams(window.location.search)
  const locId = queryParams.get('locId')
  return locId
}

function onSetSortBy() {
  const prop = document.querySelector('.sort-by').value
  const isDesc = document.querySelector('.sort-desc').checked

  if (!prop) return

  const sortBy = {}
  sortBy[prop] = isDesc ? -1 : 1

  // Shorter Syntax:
  // const sortBy = {
  //     [prop] : (isDesc)? -1 : 1
  // }

  locService.setSortBy(sortBy)
  loadAndRenderLocs()
}

function onSetFilterBy({ txt, minRate }) {
  const filterBy = locService.setFilterBy({ txt, minRate: +minRate })
  utilService.updateQueryParams(filterBy)
  loadAndRenderLocs()
}

// function renderLocStats() {
//   locService.getLocCountByRateMap().then((stats) => {
//     handleStats(stats, 'loc-stats-rate')
//   })
// }

function renderLocStats() {
  locService.getLocCountByUpdateMap().then((stats) => {
    handleStats(stats, 'loc-stats-rate')
    // console.log(stats)
  })
}

function handleStats(stats, selector) {
  // stats = { low: 37, medium: 11, high: 100, total: 148 }
  // stats = { never: 37, past: 11, today: 100, total: 148 }
  // stats = { low: 5, medium: 5, high: 5, baba: 55, mama: 30, total: 100 }
  const labels = cleanStats(stats)
  const colors = utilService.getColors()

  var sumPercent = 0
  var colorsStr = `${colors[0]} ${0}%, `
  labels.forEach((label, idx) => {
    if (idx === labels.length - 1) return
    const count = stats[label]
    const percent = Math.round((count / stats.total) * 100, 2)
    sumPercent += percent
    colorsStr += `${colors[idx]} ${sumPercent}%, `
    if (idx < labels.length - 1) {
      colorsStr += `${colors[idx + 1]} ${sumPercent}%, `
    }
  })

  colorsStr += `${colors[labels.length - 1]} ${100}%`
  // Example:
  // colorsStr = `purple 0%, purple 33%, blue 33%, blue 67%, red 67%, red 100%`

  const elPie = document.querySelector(`.${selector} .pie`)
  const style = `background-image: conic-gradient(${colorsStr})`
  elPie.style = style

  const ledendHTML = labels
    .map((label, idx) => {
      return `
                <li>
                    <span class="pie-label" style="background-color:${colors[idx]}"></span>
                    ${label} (${stats[label]})
                </li>
            `
    })
    .join('')

  const elLegend = document.querySelector(`.${selector} .legend`)
  elLegend.innerHTML = ledendHTML
}

function cleanStats(stats) {
  const cleanedStats = Object.keys(stats).reduce((acc, label) => {
    if (label !== 'total' && stats[label]) {
      acc.push(label)
    }
    return acc
  }, [])
  return cleanedStats
}
