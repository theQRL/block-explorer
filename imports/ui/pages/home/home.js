import { homechart } from '/imports/api/index.js'

import './home.html'
import '../../components/status/status.js'
/* global LocalStore */

let chartIntervalHandle

// Function to validate if the input is a valid Unix timestamp
function isValidUnixTimestamp(timestamp) {
  const unixTimestampRegex = /^\d+$/ // Regex to match digits only
  return unixTimestampRegex.test(timestamp)
}

function revertTimeAgoToTimestamp(formattedTimeAgo) {
  const now = new Date()

  // Check if the input is 'Just now'
  if (formattedTimeAgo === 'Just now') {
    return Math.floor(now / 1000)
  }

  // Extract values and units from the formatted string
  const matches = formattedTimeAgo.match(/(\d+)\s*(day|hr|min)s? ago/)

  if (!matches || matches.length !== 3) {
    // Invalid input format
    return null
  }

  const [fullMatch, value, unit] = matches // eslint-disable-line
  const intValue = parseInt(value, 10)

  // Calculate timestamp based on the provided values and units
  let timestamp
  switch (unit) {
    case 'day':
      timestamp = now - intValue * 24 * 60 * 60 * 1000
      break
    case 'hr':
      timestamp = now - intValue * 60 * 60 * 1000
      break
    case 'min':
      timestamp = now - intValue * 60 * 1000
      break
    default:
      // Invalid unit
      return null
  }

  return Math.floor(timestamp / 1000)
}
function formatFullDate(timestamp) {
  if (!isValidUnixTimestamp(timestamp)) {
    return timestamp
  }
  // Create a new Date object using the Unix timestamp
  const date = new Date(timestamp * 1000)

  // Get the day, month, year, hours, minutes, and seconds from the Date object
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-based, so we add 1
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // Format the date as dd/mm/yyyy hh:mm:ss
  const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  return formattedDateTime
}

function formatTimeAgo(timestamp) {
  if (!isValidUnixTimestamp(timestamp)) {
    return timestamp
  }
  const now = new Date()
  const targetDate = new Date(timestamp * 1000) // Assuming the timestamp is in seconds

  const diffMilliseconds = now - targetDate
  const diffSeconds = Math.floor(diffMilliseconds / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  let result = ''

  if (diffDays > 0) {
    result += diffDays + (diffDays === 1 ? ' day ' : ' days ')
  }

  if (diffHours % 24 > 0) {
    result += (diffHours % 24) + (diffHours % 24 === 1 ? ' hr ' : ' hrs ')
  }

  if (diffMinutes % 60 > 0) {
    result
          += (diffMinutes % 60) + (diffMinutes % 60 === 1 ? ' min ' : ' mins ')
  }

  if (result === '') {
    return 'Just now'
  }
  return `${result.trim()} ago`
}

function renderChart() {
  // Get Chart data from Mongo
  const chartLineData = homechart.findOne()

  // Only render chart if we get valid data back
  if (chartLineData !== undefined) {
    // Hide loading svg
    $('#chartLoading').hide()

    // determine colour to use for labels
    let graphLabels = '#EAEFF5'
    const x = LocalStore.get('theme')
    if (x === 'light') {
      graphLabels = '#0B181E'
    }

    // Draw chart
    const ctx = document.getElementById('myChart').getContext('2d')

    // eslint-disable-next-line
    const myChart = new Chart(ctx, {
      type: 'line',
      data: chartLineData,
      options: {
        legend: {
          labels: {
            fontColor: graphLabels,
          },
        },
        tooltips: {
          mode: 'index',
          callbacks: {
            title:
            (context) => {
              const formattedTooltipTitle = `Block ${context[0].xLabel[0]}`
              return formattedTooltipTitle
            },
            afterTitle:
            (context) => {
              const unix = revertTimeAgoToTimestamp(context[0].xLabel[1])
              const formattedTooltipSubTitle = formatFullDate(unix)
              return formattedTooltipSubTitle
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        hoverMode: 'index',
        stacked: false,
        scales: {
          xAxes: [{
            ticks: {
              fontColor: graphLabels,
              callback(value) {
                return [value[0], formatTimeAgo(value[1])]
              },
            },
            scaleLabel: {
              display: false,
              labelString: 'Human-readable time ago',
              fontColor: graphLabels,
            },
          }],
          yAxes: [{
            fontColor: graphLabels,
            type: 'linear',
            display: true,
            position: 'left',
            id: 'y-axis-1',
            ticks: {
              beginAtZero: true,
              max: 150,
              fontColor: '#4AAFFF',
            },
            scaleLabel: {
              display: true,
              labelString: 'Seconds',
              fontColor: graphLabels,
            },
          }, {
            type: 'linear',
            fontColor: graphLabels,
            display: true,
            position: 'right',
            id: 'y-axis-2',
            gridLines: {
              drawOnChartArea: false,
            },
            ticks: {
              fontColor: '#FFA729',
            },
            scaleLabel: {
              display: true,
              labelString: 'Hashes Per Second',
              fontColor: graphLabels,
            },
          }],
        },
      },
    })

    // Clear Interval
    Meteor.clearInterval(chartIntervalHandle)
  }
  return true
}

Template.appHome.onCreated(() => {
  Session.set('homechart', {})
  Meteor.subscribe('homechart')
})

Template.appHome.onRendered(() => {
  const h = $('#statusSegment').height()
  const canvas = $('canvas')
  const newWidth = canvas.parent().width()
  const newHeight = canvas.parent().height() // eslint-disable-line
  canvas.prop({
    width: newWidth,
    height: h,
  })
  $('#chart').parent().height(h)

  // Display chart - wait for data if it doesn't yet exist in mongo
  chartIntervalHandle = Meteor.setInterval(() => {
    renderChart()
  }, 500)
})
