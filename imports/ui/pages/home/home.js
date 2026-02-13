import { homechart } from '/imports/api/index.js'

import './home.html'
import '../../components/status/status.js'

const MAX_VISUAL_POINTS = 72

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

let currentChart = null
let isChartInitialized = false
let isChartInitializing = false
let currentViewRange = { min: 0, max: 0 }
let lastProcessedData = null

function toFiniteNumber(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 0
  }
  return numericValue
}

function movingAverage(values, windowSize = 3) {
  if (!Array.isArray(values) || values.length === 0) {
    return []
  }

  return values.map((value, index) => {
    const startIndex = Math.max(0, index - windowSize + 1)
    const slice = values.slice(startIndex, index + 1)
    const total = slice.reduce((sum, current) => sum + toFiniteNumber(current), 0)
    return total / slice.length
  })
}

function downsampleIndices(length, maxPoints = MAX_VISUAL_POINTS) {
  if (length <= maxPoints) {
    return Array.from({ length }, (_, index) => index)
  }

  const stride = (length - 1) / (maxPoints - 1)

  return Array.from({ length: maxPoints }, (_, stepIndex) => {
    const sampledIndex = Math.round(stepIndex * stride)
    return Math.min(length - 1, sampledIndex)
  })
}

function findDatasetByMatchers(datasets, matchers) {
  if (!Array.isArray(datasets) || datasets.length === 0) {
    return null
  }

  return (
    datasets.find((dataset) => {
      const label = (dataset.label || '').toLowerCase()
      return matchers.some((matcherParts) => matcherParts.every((part) => label.includes(part)))
    }) || null
  )
}

function formatCompactNumber(value) {
  const numericValue = toFiniteNumber(value)

  if (Math.abs(numericValue) < 1000) {
    return numericValue.toFixed(0)
  }

  return compactFormatter.format(numericValue)
}

function formatHashPower(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return '--'
  }

  const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s']
  if (numericValue === 0) {
    return `0 ${units[0]}`
  }

  const unitIndex = Math.min(Math.floor(Math.log10(numericValue) / 3), units.length - 1)
  const scaledValue = numericValue / (10 ** (unitIndex * 3))
  let maximumFractionDigits = 2
  if (scaledValue >= 100) {
    maximumFractionDigits = 0
  } else if (scaledValue >= 10) {
    maximumFractionDigits = 1
  }

  return `${scaledValue.toLocaleString('en-US', { maximumFractionDigits })} ${units[unitIndex]}`
}

function formatDifficulty(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return '--'
  }
  return formatCompactNumber(numericValue)
}

function formatBlockTime(value) {
  return `${toFiniteNumber(value).toFixed(2)} s`
}

function updateChartMetrics(latestMetrics) {
  const hashStat = document.getElementById('chartStatHash')
  const difficultyStat = document.getElementById('chartStatDifficulty')
  const blockTimeStat = document.getElementById('chartStatBlockTime')

  if (hashStat) {
    hashStat.textContent = formatHashPower(latestMetrics.hashPower)
  }

  if (difficultyStat) {
    difficultyStat.textContent = formatDifficulty(latestMetrics.difficulty)
  }

  if (blockTimeStat) {
    blockTimeStat.textContent = formatBlockTime(latestMetrics.blockTime)
  }
}

function buildVisualChartData(rawData) {
  if (!rawData || !Array.isArray(rawData.labels) || !Array.isArray(rawData.datasets)) {
    return null
  }

  if (rawData.labels.length === 0) {
    return null
  }

  const hashPowerDataset = findDatasetByMatchers(rawData.datasets, [['hash', 'power']]) || rawData.datasets[0]
  const difficultyDataset = findDatasetByMatchers(rawData.datasets, [['difficulty']])
  const blockTimeDataset = findDatasetByMatchers(rawData.datasets, [['block', 'time', 'average'], ['block', 'time']])
    || rawData.datasets[rawData.datasets.length - 1]

  if (!hashPowerDataset || !blockTimeDataset) {
    return null
  }

  const sampledIndices = downsampleIndices(rawData.labels.length)
  const sampledLabels = sampledIndices.map((index) => toFiniteNumber(rawData.labels[index]))

  const hashPowerRaw = sampledIndices.map((index) => toFiniteNumber(hashPowerDataset.data[index]))
  const difficultyRaw = difficultyDataset
    ? sampledIndices.map((index) => toFiniteNumber(difficultyDataset.data[index]))
    : []
  const blockTimeRaw = sampledIndices.map((index) => toFiniteNumber(blockTimeDataset.data[index]))

  const hashPowerSmoothed = movingAverage(hashPowerRaw, 4)
  const difficultySmoothed = difficultyRaw.length > 0 ? movingAverage(difficultyRaw, 4) : []
  const blockTimeSmoothed = movingAverage(blockTimeRaw, 3)

  const hashSeriesData = sampledLabels.map((blockNumber, index) => ({
    x: blockNumber,
    y: hashPowerSmoothed[index],
  }))

  const blockTimeSeriesData = sampledLabels.map((blockNumber, index) => ({
    x: blockNumber,
    y: blockTimeSmoothed[index],
  }))

  const latestRawLabel = rawData.labels[rawData.labels.length - 1]
  const minBlock = sampledLabels.length > 0 ? Math.min(...sampledLabels) : 0
  const maxBlock = sampledLabels.length > 0 ? Math.max(...sampledLabels) : 0

  return {
    minBlock,
    maxBlock,
    latestBlock: toFiniteNumber(latestRawLabel),
    rawLength: rawData.labels.length,
    latestMetrics: {
      hashPower: hashPowerSmoothed[hashPowerSmoothed.length - 1] || 0,
      difficulty: difficultySmoothed.length > 0 ? difficultySmoothed[difficultySmoothed.length - 1] : null,
      blockTime: blockTimeSmoothed[blockTimeSmoothed.length - 1] || 0,
    },
    series: [
      {
        name: 'Hash Power',
        data: hashSeriesData,
      },
      {
        name: 'Avg Block Time',
        data: blockTimeSeriesData,
      },
    ],
  }
}

// Initialize the chart with initial data
async function initializeChart(dataToUse) {
  const isDark = LocalStore.get('theme') !== 'light'
  const chartContainer = document.getElementById('chart-container')

  if (!chartContainer) {
    console.error('Chart container not found!')
    return
  }

  const visualData = buildVisualChartData(dataToUse)

  if (!visualData) {
    return
  }

  updateChartMetrics(visualData.latestMetrics)

  try {
    if (currentChart) {
      currentChart.destroy()
      currentChart = null
    }

    chartContainer.innerHTML = ''

    currentViewRange = {
      min: visualData.minBlock,
      max: visualData.maxBlock,
    }

    const options = {
      chart: {
        type: 'area',
        height: 352,
        background: 'transparent',
        foreColor: isDark ? '#DCE3E9' : '#334155',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        selection: {
          enabled: false,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 650,
          animateGradually: {
            enabled: true,
            delay: 90,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 320,
          },
        },
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
        dropShadow: {
          enabled: true,
          top: 8,
          left: 0,
          blur: 12,
          color: '#67B8FF',
          opacity: 0.2,
        },
      },
      series: visualData.series,
      colors: ['#67B8FF', '#FFB347'],
      stroke: {
        curve: 'smooth',
        lineCap: 'round',
        width: [3.5, 2.5],
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: isDark ? 'dark' : 'light',
          type: 'vertical',
          shadeIntensity: 0.35,
          gradientToColors: ['#2F73F8', '#FF8A45'],
          opacityFrom: 0.35,
          opacityTo: 0.02,
          stops: [0, 70, 100],
        },
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: {
          size: 5,
          sizeOffset: 2,
        },
      },
      dataLabels: {
        enabled: false,
      },
      grid: {
        show: true,
        borderColor: isDark ? 'rgba(149, 167, 184, 0.24)' : 'rgba(71, 85, 105, 0.18)',
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 8,
          right: 8,
          left: 8,
          bottom: 0,
        },
      },
      xaxis: {
        type: 'numeric',
        min: currentViewRange.min,
        max: currentViewRange.max,
        tickAmount: 7,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: isDark ? '#C8D2DB' : '#475569',
            fontSize: '11px',
            fontWeight: 500,
            fontFamily: 'Alte DIN 1451 Mittelschrift, sans-serif',
          },
          formatter(value) {
            return Math.round(value).toLocaleString()
          },
          rotate: 0,
          trim: false,
        },
      },
      yaxis: [
        {
          seriesName: 'Hash Power',
          forceNiceScale: true,
          min: 0,
          title: {
            text: 'Hash Power',
            style: {
              color: isDark ? '#DCE3E9' : '#334155',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'Alte DIN 1451 Mittelschrift, sans-serif',
            },
          },
          labels: {
            style: {
              colors: isDark ? '#C8D2DB' : '#475569',
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: 'Alte DIN 1451 Mittelschrift, sans-serif',
            },
            formatter(value) {
              return formatHashPower(value)
            },
          },
        },
        {
          seriesName: 'Avg Block Time',
          opposite: true,
          min: 0,
          forceNiceScale: true,
          title: {
            text: 'Avg Block Time',
            style: {
              color: isDark ? '#DCE3E9' : '#334155',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'Alte DIN 1451 Mittelschrift, sans-serif',
            },
          },
          labels: {
            style: {
              colors: isDark ? '#C8D2DB' : '#475569',
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: 'Alte DIN 1451 Mittelschrift, sans-serif',
            },
            formatter(value) {
              return formatBlockTime(value)
            },
          },
        },
      ],
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        shared: true,
        intersect: false,
        style: {
          fontSize: '12px',
          fontFamily: 'Alte DIN 1451 Mittelschrift, sans-serif',
        },
        x: {
          formatter(value) {
            return `Block ${Math.round(value).toLocaleString()}`
          },
        },
        y: {
          formatter(value, { seriesIndex }) {
            if (seriesIndex === 0) {
              return formatHashPower(value)
            }
            return formatBlockTime(value)
          },
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        offsetY: -2,
        fontSize: '12px',
        fontFamily: 'Alte DIN 1451 Mittelschrift, sans-serif',
        labels: {
          colors: isDark ? '#DCE3E9' : '#334155',
        },
        markers: {
          width: 10,
          height: 10,
          radius: 999,
        },
        itemMargin: {
          horizontal: 14,
          vertical: 6,
        },
      },
    }

    currentChart = new ApexCharts(chartContainer, options)
    await currentChart.render()

    isChartInitialized = true
    lastProcessedData = {
      latestBlock: visualData.latestBlock,
      rawLength: visualData.rawLength,
    }
  } catch (error) {
    console.error('Error initializing ApexCharts:', error)
    const errorText = `Error loading chart: ${error.message || 'Unknown error'}`
    const errorElement = document.createElement('div')
    errorElement.className = 'flex items-center justify-center h-full text-red-400'
    errorElement.textContent = errorText
    chartContainer.replaceChildren(errorElement)
    isChartInitialized = false
    Session.set('nodeError', true)
  }
}

// Update chart with new data
async function updateChart(newData) {
  if (!currentChart || !isChartInitialized) {
    return
  }

  const visualData = buildVisualChartData(newData)

  if (!visualData) {
    return
  }

  const hasFreshData = !lastProcessedData
    || visualData.latestBlock !== lastProcessedData.latestBlock
    || visualData.rawLength !== lastProcessedData.rawLength

  if (!hasFreshData) {
    return
  }

  updateChartMetrics(visualData.latestMetrics)

  try {
    currentViewRange = {
      min: visualData.minBlock,
      max: visualData.maxBlock,
    }

    await currentChart.updateOptions(
      {
        series: visualData.series,
        xaxis: {
          min: currentViewRange.min,
          max: currentViewRange.max,
        },
      },
      false,
      true,
    )

    lastProcessedData = {
      latestBlock: visualData.latestBlock,
      rawLength: visualData.rawLength,
    }
  } catch (error) {
    // Swallow transient chart update errors to keep the page responsive.
  }
}

async function renderChart() {
  const chartLineData = homechart.findOne()

  if (!chartLineData) {
    return
  }

  const dataToUse = chartLineData

  if (dataToUse && dataToUse.labels && dataToUse.datasets) {
    const chartLoading = document.getElementById('chartLoading')
    if (chartLoading) {
      chartLoading.style.display = 'none'
    }

    if (isChartInitialized) {
      await updateChart(dataToUse)
      return
    }

    if (isChartInitializing) {
      return
    }

    isChartInitializing = true
    try {
      await initializeChart(dataToUse)
    } catch (error) {
      console.error('Error rendering chart:', error)
    } finally {
      isChartInitializing = false
    }
  } else {
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
  this.subscribe('homechart')
})

// Initialize chart when template is rendered
Template.appHome.onRendered(function () {
  this.autorun(() => {
    renderChart()
  })
})

// Clean up when template is destroyed
Template.appHome.onDestroyed(() => {
  if (currentChart) {
    currentChart.destroy()
    currentChart = null
  }

  isChartInitialized = false
  isChartInitializing = false
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
