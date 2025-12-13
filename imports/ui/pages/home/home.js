import { homechart } from '/imports/api/index.js'
import { Tracker } from 'meteor/tracker'

import './home.html'
import '../../components/status/status.js'
/* global LocalStore */

let chartIntervalHandle
let currentChart = null
let isChartInitialized = false
let userHasInteracted = false
let lastDataLength = 0
let currentViewRange = { min: 0, max: 0 }
let lastProcessedData = null // Track the last data we processed

// Load ApexCharts from CDN
function loadApexCharts() {
  return new Promise((resolve, reject) => {
    if (window.ApexCharts) {
      console.log('ApexCharts already loaded')
      resolve(window.ApexCharts)
      return
    }

    console.log('Loading ApexCharts from CDN...')
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/apexcharts@5.3.6/dist/apexcharts.min.js'
    script.integrity = 'sha384-mrR3K8Jvv+o9bZ6Yu9HWI0M8tuzo5VWNi4fWcmmbFq3NbB+WvjW/tF/wnELivEnc'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      console.log('ApexCharts loaded successfully')
      resolve(window.ApexCharts)
    }
    script.onerror = () => {
      console.error('Failed to load ApexCharts')
      reject(new Error('Failed to load ApexCharts'))
    }
    document.head.appendChild(script)
  })
}

// Calculate nice increments divisible by 10
function calculateNiceIncrement(maxValue, minValue, targetTicks = 8) {
  const range = maxValue - minValue
  const roughStep = range / targetTicks

  // Find the order of magnitude
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))

  // Normalize the rough step
  const normalizedStep = roughStep / magnitude

  // Choose a nice step that's divisible by 10
  let niceStep
  if (normalizedStep <= 1) niceStep = 1
  else if (normalizedStep <= 2) niceStep = 2
  else if (normalizedStep <= 5) niceStep = 5
  else niceStep = 10

  return niceStep * magnitude
}

// Initialize the chart with initial data
async function initializeChart(dataToUse, isSampleData = false) {
  const isDark = LocalStore.get('theme') !== 'light'
  const chartContainer = document.getElementById('chart-container')

  if (!chartContainer) {
    console.error('Chart container not found!')
    return
  }

  try {
    // Clear any existing chart
    chartContainer.innerHTML = ''

    // Load ApexCharts
    const ApexCharts = await loadApexCharts()

    // Transform data for ApexCharts
    const series = dataToUse.datasets.map((dataset) => ({
      name: dataset.label,
      data: dataset.data.map((value, index) => ({
        x: dataToUse.labels[index],
        y: value,
      })),
    }))

    console.log('Initializing ApexCharts with series:', series)

    // Start with the most zoomed out view - show all available data
    const maxBlock = Math.max(...dataToUse.labels)
    const minBlock = Math.min(...dataToUse.labels)
    currentViewRange = { min: minBlock, max: maxBlock }

    // Calculate nice increments divisible by 10
    const niceIncrement = calculateNiceIncrement(currentViewRange.max, currentViewRange.min)

    // ApexCharts configuration for real-time updates
    const options = {
      chart: {
        type: 'line',
        height: 320,
        background: 'transparent',
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        // Enable real-time updates
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
        // Track user interactions
        events: {
          zoom(chartContext, { xaxis }) {
            console.log('User zoomed chart')
            userHasInteracted = true
            // Update our tracking of current view
            currentViewRange = {
              min: xaxis.min,
              max: xaxis.max,
            }
          },
          pan(chartContext, { xaxis }) {
            console.log('User panned chart')
            userHasInteracted = true
            // Update our tracking of current view
            currentViewRange = {
              min: xaxis.min,
              max: xaxis.max,
            }
          },
          selection(chartContext, { xaxis }) {
            console.log('User selected range')
            userHasInteracted = true
            // Update our tracking of current view
            currentViewRange = {
              min: xaxis.min,
              max: xaxis.max,
            }
          },
        },
      },
      theme: {
        mode: isDark ? 'dark' : 'light',
      },
      series,
      colors: ['#4AAFFF', '#9CA3AF', '#8B5A0F', '#FFA729'],
      stroke: {
        curve: 'smooth',
        width: [3, 3, 3, 1],
      },
      grid: {
        show: true,
        borderColor: isDark ? 'rgba(234, 239, 245, 0.1)' : 'rgba(11, 24, 30, 0.1)',
      },
      xaxis: {
        type: 'numeric',
        min: currentViewRange.min,
        max: currentViewRange.max,
        title: {
          text: 'Block Number',
          style: {
            color: isDark ? '#EAEFF5' : '#0B181E',
            fontSize: '12px',
            fontWeight: 600,
          },
        },
        labels: {
          style: {
            colors: isDark ? '#EAEFF5' : '#0B181E',
            fontSize: '12px',
            fontWeight: 500,
          },
          formatter(value) {
            // Show more labels with better formatting
            const roundedValue = Math.round(value)
            if (roundedValue % 5 === 0) { // Show every 5th block instead of 10th
              return roundedValue.toLocaleString()
            }
            return ''
          },
          rotate: 0,
          trim: false,
          hideOverlappingLabels: false,
        },
        // Show more labels
        tickAmount: 12,
        tickPlacement: 'between',
        forceNiceScale: true,
      },
      yaxis: [
        {
          // Left Y-axis for Hash Power and Difficulty
          seriesName: ['Hash Power (hps)', 'Difficulty'],
          title: {
            text: 'Hash Power / Difficulty',
            style: {
              color: isDark ? '#EAEFF5' : '#0B181E',
              fontSize: '12px',
              fontWeight: 600,
            },
          },
          labels: {
            style: {
              colors: isDark ? '#EAEFF5' : '#0B181E',
              fontSize: '11px',
            },
            formatter(value) {
              return value.toLocaleString()
            },
          },
        },
        {
          // Right Y-axis for Block Time
          seriesName: 'Block Time Average (s)',
          opposite: true,
          title: {
            text: 'Block Time Average (s)',
            style: {
              color: isDark ? '#EAEFF5' : '#0B181E',
              fontSize: '12px',
              fontWeight: 600,
            },
          },
          labels: {
            style: {
              colors: isDark ? '#EAEFF5' : '#0B181E',
              fontSize: '11px',
            },
            formatter(value) {
              return `${value.toFixed(1)}s`
            },
          },
          min: 0,
          max: undefined, // Let it auto-scale
        },
      ],
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        x: {
          formatter(value) {
            return `Block ${Math.round(value).toLocaleString()}`
          },
        },
      },
      // Enable smooth scrolling for real-time updates
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
        markers: {
          width: 8,
          height: 8,
          radius: 2,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
      },
    }

    // Create the chart
    currentChart = new ApexCharts(chartContainer, options)
    await currentChart.render()

    console.log('ApexCharts initialized successfully')
    isChartInitialized = true
    lastDataLength = dataToUse.labels.length
    lastProcessedData = dataToUse // Store the initial data
  } catch (error) {
    console.error('Error initializing ApexCharts:', error)
    chartContainer.innerHTML = `<div class="flex items-center justify-center h-full text-red-400">Error loading chart: ${error.message}</div>`
    Session.set('nodeError', true)
  }
}

// Update chart with new data (only add new points, don't change existing)
async function updateChart(newData) {
  if (!currentChart || !isChartInitialized) {
    console.log('Chart not initialized yet, skipping update')
    return
  }

  try {
    // Check if we have new data (more data points than before)
    const currentDataLength = newData.labels.length
    const hasNewData = currentDataLength > lastDataLength

    if (!hasNewData) {
      console.log('No new data to add, skipping update')
      return
    }

    console.log(`Adding ${currentDataLength - lastDataLength} new data points`)

    // Only add the new data points, don't change existing ones
    const newSeries = newData.datasets.map((dataset, datasetIndex) => {
      const existingData = lastProcessedData ? lastProcessedData.datasets[datasetIndex].data : []
      const newDataPoints = dataset.data.slice(existingData.length)
      const newLabels = newData.labels.slice(existingData.length)

      return {
        name: dataset.label,
        data: newDataPoints.map((value, index) => ({
          x: newLabels[index],
          y: value,
        })),
      }
    })

    console.log('Adding new data points:', newSeries)

    // Add new data points to the chart (this preserves existing data)
    await currentChart.appendData(newSeries, true) // true = animate

    // Only auto-scroll if user hasn't interacted with the chart
    if (!userHasInteracted && newData.labels.length > 0) {
      const latestBlock = Math.max(...newData.labels)
      const viewWidth = currentViewRange.max - currentViewRange.min

      console.log('Auto-scrolling to show latest data')

      // Calculate new view range - scroll to the right to show latest data
      const newMin = Math.max(0, latestBlock - viewWidth + 20) // Keep same width, show latest data
      const newMax = latestBlock + 20 // Add some padding

      // Update our tracking
      currentViewRange = { min: newMin, max: newMax }

      // Smooth scroll to new range
      await currentChart.zoomX(newMin, newMax, true) // true = animate
    } else if (userHasInteracted) {
      console.log('User has interacted with chart, not auto-scrolling')
    }

    // Update tracking variables
    lastDataLength = currentDataLength
    lastProcessedData = newData // Store the updated data
  } catch (error) {
    console.error('Error updating chart:', error)
  }
}

function renderChart() {
  console.log('renderChart called')

  // Get Chart data from Mongo
  const chartLineData = homechart.findOne()

  // Check if subscription is ready
  if (!chartLineData) {
    console.log('No chart data found in collection')
    console.log('Collection count:', homechart.find().count())
    console.log('All collection data:', homechart.find().fetch())
    console.log('Chart data not ready yet, waiting for subscription...')
    return
  }
  console.log('Chart data:', chartLineData)

  const dataToUse = chartLineData

  if (dataToUse !== undefined && dataToUse.labels && dataToUse.datasets) {
    console.log('Valid chart data found, hiding loading...')

    // Hide loading animation
    const chartLoading = document.getElementById('chartLoading')
    if (chartLoading) {
      chartLoading.style.display = 'none'
      console.log('Loading element hidden successfully')
    }

    // If chart is not initialized, initialize it
    if (!isChartInitialized) {
      console.log('Initializing chart for the first time...')
      initializeChart(dataToUse, false)
    } else {
      // Chart is already initialized, just update it smoothly
      console.log('Updating existing chart...')
      updateChart(dataToUse)
    }
  } else {
    console.log('No valid chart data available yet')
    // Show waiting message
    const chartContainer = document.getElementById('chart-container')
    if (chartContainer) {
      chartContainer.innerHTML = `
        <div class="flex items-center justify-center h-full text-qrl-text-secondary">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-qrl-accent mx-auto mb-4"></div>
            <p class="text-lg font-semibold">Waiting for blockchain data...</p>
            <p class="text-sm mt-2">Connecting to QRL network</p>
          </div>
        </div>
      `
    }
  }
}

// Subscribe to chart data
Template.appHome.onCreated(function () {
  console.log('Subscribing to homechart...')
  this.subscribe('homechart')
  console.log('Subscription started')
})

// Initialize chart when template is rendered
Template.appHome.onRendered(() => {
  console.log('Template rendered, initializing chart...')

  // Set up reactive autorun to update chart when data changes
  Tracker.autorun(() => {
    renderChart()
  })

  // Set up auto-refresh with shorter interval for smoother updates
  chartIntervalHandle = Meteor.setInterval(() => {
    renderChart()
  }, 30000) // Refresh every 30 seconds for smoother updates
})

// Clean up when template is destroyed
Template.appHome.onDestroyed(() => {
  if (chartIntervalHandle) {
    Meteor.clearInterval(chartIntervalHandle)
  }
  if (currentChart) {
    currentChart.destroy()
    currentChart = null
  }
  isChartInitialized = false
  userHasInteracted = false
  lastDataLength = 0
  currentViewRange = { min: 0, max: 0 }
  lastProcessedData = null
})

// Reactive data source
Template.appHome.helpers({
  chartData() {
    return homechart.findOne()
  },
  isChartDataReady() {
    return this.subscriptionsReady()
  },
  nodeError() {
    const nE = Session.get('nodeError')
    if (!nE) {
      return false
    }
    return nE
  },
})
