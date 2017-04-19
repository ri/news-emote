import * as styles from './App.scss'
import {Headlines} from './Headlines'
import data from './data-us.json'
import Hammer from 'hammerjs'
import * as d3 from 'd3'

export class App {
  // constructor(options) {
  //   // this.props = {
  //   //   dom: null,
  //   //   rest: 'test rest',
  //   //   ...options // ES6: rest properties
  //   // }
  // }

  render(json, loc, filter) {
    document.title = `${loc} | Mood of daily news headlines`
    d3.select('.loading').remove()

    var headlines = new Headlines(json, '#feeds')

    headlines.filterBy(filter)

    d3.select('#last-update')
      .text(json.time)

    d3.selectAll('.location')
      .text(loc)

    var is_touch_device = 'ontouchstart' in document.documentElement;

    if(is_touch_device){
      var curr = 0
      var el = document.getElementById('swipe-wrapper')
      var hammer = new Hammer(el)

      d3.selectAll('.nav-dots li')
        .classed('current', (d, i) => i === curr)

      hammer.on('swipeleft', (ev) => {
        var currloc = curr * 100
        if (currloc < 400) {
          d3.select('#feeds')
            .transition()
            .style('transform', `translate(-${100 + currloc}%, 0)`)

          curr++

          d3.selectAll('.nav-dots li')
            .classed('current', (d, i) => i === curr)
        }
      })
      hammer.on('swiperight', (ev) => {
        var currloc = curr * 100
        if (currloc > 0) {
          d3.select('#feeds')
            .transition()
            .style('transform', `translate(-${currloc - 100}%, 0)`)

          curr--

          d3.selectAll('.nav-dots li')
            .classed('current', (d, i) => i === curr)
        }
      })
    }

    var modal = d3.select('#about-btn')
      .on('click', () => {
        d3.select('#about-modal')
          .classed('active', true)
        d3.select('.modal-bg')
          .classed('active', true)
      })

    d3.selectAll('.modal-bg, #about-modal .close')
      .on('click', () => {
        d3.select('#about-modal')
          .classed('active', false)
        d3.select('.modal-bg')
          .classed('active', false)
      })

    d3.select('#controls')
      .on('click', () => {
        var active = d3.select('#controls ul').classed('active')

        d3.select('#controls ul')
          .classed('active', !active)
      })
  }
}
