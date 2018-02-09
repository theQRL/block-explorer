import './home.html'
import '../../components/status/status.js'

Template.appHome.onRendered(() => {
  const h = $('#statusSegment').height()
  const canvas = $('canvas')
  const newWidth = canvas.parent().width()
  const newHeight = canvas.parent().height()
  canvas.prop({
    width: newWidth,
    height: h,
  })
  $('#chart').parent().height(h)

 
  // Draw chart on homepage
  Meteor.call('getStats', { include_timeseries: true }, (err, res) => {
    if (err) {
      console.log(err)
    } else {
      console.log('stat')
      console.log(res)

      let chartLineData = {
        labels: [],
        datasets: [],
      }

      // Build Difficulty and hash power datasets and Block # labels
      let labels = []
      let hashPower = {
        label: 'Hash Power',
        borderColor: '#DC255D',
        backgroundColor: '#DC255D',
        fill: false,
        data: [],
        yAxisID: "y-axis-2",
        pointRadius: 0,
        borderWidth: 2,
      }
      let difficulty = {
        label: 'Difficulty',
        borderColor: '#4A90E2',
        backgroundColor: '#4A90E2',
        fill: false,
        data: [],
        yAxisID: "y-axis-2",
        pointRadius: 0,
        borderWidth: 2,
      }
      let movingAverage = {
        label: 'Block Time Average',
        borderColor: '#0A0724',
        backgroundColor: '#0A0724',
        fill: false,
        data: [],
        yAxisID: "y-axis-1",
        pointRadius: 0,
        borderWidth: 2,
      }
      let blockTime = {
        label: 'Block Time',
        borderColor: '#1EE9CB',
        backgroundColor: '#1EE9CB',
        fill: false,
        showLine: false,
        data: [],
        yAxisID: "y-axis-1",
        pointRadius: 2,
        borderWidth: 2,
      }


      _.each(res.block_timeseries, (entry) => {
        labels.push(entry.number)
        hashPower.data.push(entry.hash_power)
        difficulty.data.push(entry.difficulty)
        movingAverage.data.push(entry.time_movavg)
        blockTime.data.push(entry.time_last)
      })

      chartLineData.labels = labels
      chartLineData.datasets.push(hashPower)
      chartLineData.datasets.push(difficulty)
      chartLineData.datasets.push(movingAverage)
      chartLineData.datasets.push(blockTime)

      const ctx = document.getElementById('myChart').getContext('2d')

      let myChart = new Chart(ctx, {
        type: 'line',
        data: chartLineData,
        options: {
          responsive: true,
          hoverMode: 'index',
          stacked: false,
          scales: {
            yAxes: [
              {
                type: "linear",
                display: true,
                position: "left",
                id: "y-axis-1",
                ticks: {
                  beginAtZero: true,
                  max: 150
                }
              },{
                type: "linear",
                display: true,
                position: "right",
                id: "y-axis-2",
                gridLines: {
                  drawOnChartArea: false,
                },
              }
            ],
          }
        }
      }) /* eslint no-undef:0, no-unused-vars:0 */
    }
  })
})
