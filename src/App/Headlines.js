import * as d3 from 'd3'
import queryString from 'query-string'

export class Headlines {
  constructor(data) {
    this.data = data['news-data']
    this.data.forEach((d) => {
      d.counts = []
      d.counts[0] = { pos: 0, neg: 0, neu: 0, total: 0 }
    })

    this.mixedFilter = (d) => !(d.sentiment.compound > -0.25 && d.sentiment.compound < 0.25)
    this.posFilter = (d) => d.sentiment.compound >= 0.25
    this.negFilter = (d) => d.sentiment.compound <= -0.25
    this.noFilter = (d) => true
    this.currentFilter = 'noFilter'
    this.currentIndex = 0
    this.colourRange = ['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641']
    this.cScale = d3.scalePow(2).domain([-1, -0.5, 0, 0.5, 1]).range(this.colourRange)
    this.contain = d3.select('#feeds')

    this.draw()
  }

  draw() {
    var self = this

    var key = d3.select('#colour-key')
      .append('svg')
      .attr('width', '100%')
      .attr('height', 40)

    var gradient = key.append('defs')
      .append('linearGradient')
        .attr('id', 'gradient')

    gradient.selectAll('stop')
      .data(this.colourRange)
      .enter()
      .append('stop')
      .attr('offset', (d, i) => `${i * 100 / (this.colourRange.length - 1)}%`)
      .attr('stop-color', (d) => d)
      .attr('stop-opacity', 1)

    key.append('rect')
      .attr('width', '100%')
      .attr('height', 10)
      .style('fill', 'url(#gradient)')
      .attr('stroke', '#999')

    key.append('text')
      .attr('y', 25)
      .text('Negative')

    key.append('text')
      .attr('y', 25)
      .attr('x', '50%')
      .attr('text-anchor', 'middle')
      .text('Neutral')

    key.append('text')
      .attr('y', 25)
      .attr('x', '100%')
      .attr('text-anchor', 'end')
      .text('Positive')

    this.newsFeeds = this.contain.selectAll('div.news-feed')
      .data(this.data)
      .enter()
      .append('div')
      .attr('class', 'news-feed')

    this.lines = this.newsFeeds.append('svg')
      .attr('class', 'sentiment-lines')
      .style('width', '100%')
      .style('height', '8')

    this.newsFeeds.append('div')
      .attr('class', 'title')
      .text((d) => d.name)

    this.lines.append('rect')
      .datum((d) => d.counts)
      .attr('class', 'pos-line')
      .attr('height', 8)
      .attr('width', `${100 / 3}%`)
      // .style("width", "calc(100%  /3);")

    this.lines.append('rect')
      .datum((d) => d.counts)
      .attr('class', 'neg-line')
      .attr('height', 8)
      .attr('x', `${100 / 3}%`)
      .attr('width', `${100 / 3}%`)

    this.lines.append('rect')
      .datum((d) => d.counts)
      .attr('class', 'neu-line')
      .attr('height', 8)
      .attr('x', `${100 / 3 * 2}%`)
      .attr('width', `${100 / 3}%`)

    this.newsFeeds.append('div')
      .attr('class', 'headlines')
      .each(function(d, i) { self.createHeadlines(d, this, i) })

    d3.select('.nav-dots').selectAll('li')
      .data([...Array(this.data.length).keys()])
      .enter()
      .append('li')
      .attr('class', (d, i) => `nav-${i}`)

    d3.select('#show-all').on('click', () => this.filterBy(null))
    d3.select('#hide-neutral').on('click', () => this.filterBy('mixed'))
    d3.select('#all-bad').on('click', () => this.filterBy('neg'))
    d3.select('#all-good').on('click', () => this.filterBy('pos'))
  }

  filterBy(filter) {
    this.currentFilter = filter ? `${filter}Filter` : 'noFilter'
    this.contain.selectAll('.headline')
      .style('display', (d) => this[this.currentFilter](d) ? null : 'none')

    var btn = filter ? this.currentFilter : 'noFilter'

    d3.selectAll('#controls li a')
      .classed('active', function() {
        return d3.select(this).attr('data-filter') === btn
      })

    // update query string

    var parsed = queryString.parse(location.search)

    if (filter) {
      parsed.filter = filter
    } else {
      delete parsed.filter
    }
    var url = `${location.protocol}//${location.host}${location.pathname}` + '?' + queryString.stringify(parsed)
    window.history.pushState('', '', url)
  }

  genTag(entries, tag, text) {
    var tagged = text
    if (entries.length > 0) {
      var words = text.split(' ')
      entries.forEach(function(w) {
        words.forEach((item, i) => { if (item.replace(/[.,/#?!$%^&*;:{}=\-_`'‘’~()]/g, '') === w.word) words[i] = `<span class="${tag}">${w.word}</span>` })
      })
      tagged = words.join(' ')
    }
    return tagged
  }

  emText(d) {
    var text = d.headline
    var text1 = this.genTag(d.v_neg, 'v-neg', text)
    var text2 = this.genTag(d.s_neg, 's-neg', text1)
    var text3 = this.genTag(d.s_pos, 's-pos', text2)
    var text4 = this.genTag(d.v_pos, 'v-pos', text3)
    return text4
  }

  sentimentCat(d) {
    return this.posFilter(d) ? 'pos' : this.negFilter(d) ? 'neg' : 'neu'
  }

  renderHeadline(curr, data, el) {
    if (curr < data.sentiments.length) {
      var d = data.sentiments[curr]

      // var next = data.sentiments[curr + 1]
      // if(next) {
      //   var duration = this[this.currentFilter](next) ? 2800 : 0
      // }

      var delay1 = this[this.currentFilter](d) ? 200 : 0
      var delay2 = this[this.currentFilter](d) ? 2800 : 0

      // Update values for count graph
      var prevCounts = data.counts[curr]
      var counts = Object.assign({}, prevCounts)
      var cat = this.sentimentCat(d)
      counts[cat]++
      counts.total++
      data.counts.push(counts)
      var lines = d3.select(el.parentNode)

      d3.select(el).insert('div', ':first-child')
        .datum(d)
        .attr('class', `headline ${cat}`)
        .html((d) => this.emText(d))
        .style('background-color', (d) => this.cScale(d.sentiment.compound))
        .style('margin-top', function() { return `-${d3.select(this).node().offsetHeight}px` })
        .style('display', (d) => this[this.currentFilter](d) ? null : 'none')
        .transition()
        .duration(delay1)
        // .delay(delay1)
        .style('margin-top', '0px')
        .on('end', () => {
          setTimeout(() => { this.renderHeadline(curr + 1, data, el) }, delay2)
        })

      lines.select('.sentiment-lines .pos-line')
        .transition()
        .attr('width', `${counts.pos / counts.total * 100}%`)

      lines.select('.sentiment-lines .neg-line')
        .transition()
        .attr('x', `${counts.pos / counts.total * 100}%`)
        .attr('width', `${counts.neg / counts.total * 100}%`)

      lines.select('.sentiment-lines .neu-line')
        .transition()
        .attr('x', `${(counts.pos + counts.neg) / counts.total * 100}%`)
        .attr('width', `${counts.neu / counts.total * 100}%`)

      // setTimeout(() => { this.renderHeadline(curr + 1, data, el) }, duration)
    } else {
      d3.select(el).insert('div', ':first-child')
          .attr('class', 'headlines-end')
          .text('End of feed')
    }
  }

  createHeadlines(data, el, index) {
    setTimeout(() => {
      var curr = 0
      this.renderHeadline(curr, data, el)
    }, index * 500)
  }
}
