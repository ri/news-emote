import * as d3 from 'd3'
import queryString from 'query-string'

export class Headlines {
  constructor(data) {
    this.data = data['news-data']
    this.data.forEach((d) => {
      d.counts = []
      d.counts[0] = { pos: 0, neg: 0, neu: 0, total: 0 }
    })

    this.noNeutralFilter = (d) => !(d.sentiment.compound > -0.25 && d.sentiment.compound < 0.25)
    this.posFilter = (d) => d.sentiment.compound >= 0.25
    this.negFilter = (d) => d.sentiment.compound <= -0.25
    this.noFilter = (d) => true
    this.currentFilter = 'noFilter'
    this.currentIndex = 0

    // data["news-data"].forEach((d) => {
    //   var mean = d3.mean(d.sentiments, (h) => h.sentiment.compound)
    //   var extent = d3.extent(d.sentiments, (h) => h.sentiment.compound)
    //   var numNeg = d.sentiments.filter((h) => h.sentiment.compound <= -0.25)
    //   var numNeu = d.sentiments.filter((h) => h.sentiment.compound > -0.25 && h.sentiment.compound < 0.25)
    //   var numPos = d.sentiments.filter((h) => h.sentiment.compound >= 0.25)
    //   // console.log(d.name, mean, extent)
    //   var histogram = d3.histogram()
    //     .value((d) => d.sentiment.compound)
    //     .domain([-1, 1])
    //     .thresholds([-1, -0.6, -0.2, 0.2, 0.6, 1])
    //   // console.log(histogram(d.sentiments))
    //   // d3.select("#feeds").append("div").style("background-color", cScale(mean))

    // })
    this.cScale = d3.scalePow(2).domain([-1, -0.5, 0, 0.5, 1]).range(['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641'])
    this.contain = d3.select('#feeds')

    this.draw()
  }

  draw() {
    var self = this

    this.newsFeeds = this.contain.selectAll('div.news-feed')
      .data(this.data)
      .enter()
      .append('div')
      .attr('class', 'news-feed')

    this.lines = this.newsFeeds.append('svg')
      .attr('class', 'sentiment-lines')
      .style('width', '100%')
      .style('height', '5')

    this.newsFeeds.append('div')
      .attr('class', 'title')
      .text((d) => d.name)

    this.lines.append('rect')
      .datum((d) => d.counts)
      .attr('class', 'pos-line')
      .attr('height', 5)
      .attr('width', `${100 / 3}%`)
      // .style("width", "calc(100%  /3);")

    this.lines.append('rect')
      .datum((d) => d.counts)
      .attr('class', 'neg-line')
      .attr('height', 5)
      .attr('x', `${100 / 3}%`)
      .attr('width', `${100 / 3}%`)

    this.lines.append('rect')
      .datum((d) => d.counts)
      .attr('class', 'neu-line')
      .attr('height', 5)
      .attr('x', `${100 / 3 * 2}%`)
      .attr('width', `${100 / 3}%`)

    this.newsFeeds.append('div')
      .attr('class', 'headlines')
      .each(function(d, i) { self.createHeadlines(d, this, i) })

    d3.select('#show-all').on('click', () => this.filterBy('noFilter'))
    d3.select('#hide-neutral').on('click', () => this.filterBy('noNeutralFilter', 'mixed'))
    d3.select('#all-bad').on('click', () => this.filterBy('negFilter', 'bad'))
    d3.select('#all-good').on('click', () => this.filterBy('posFilter', 'good'))
  }

  filterBy(filter, name) {
    this.currentFilter = filter
    this.contain.selectAll('.headline')
      .style('display', (d) => this[filter](d) ? null : 'none')

    d3.selectAll('#controls li a')
      .classed('active', function() {
        return d3.select(this).attr('data-filter') === filter
      })

    // update query string

    var parsed = queryString.parse(location.search)

    if (name) {
      parsed.filter = name
    } else {
      delete parsed.filter
    }
    var url = `${location.protocol}//${location.host}${location.pathname}` + '?' + queryString.stringify(parsed)
    window.history.pushState('', '', url)
  }

  genTag(entries, tag, text) {
    var tagged = text
    if (entries.length > 0) {
      entries.forEach(function(w) {
        tagged = text.replace(w.word, `<span class="${tag}">${w.word}</span>`)
      })
    }
    return tagged
  }

  emText(d) {
    var text = d.headline
    text = this.genTag(d.v_neg, 'v-neg', text)
    text = this.genTag(d.s_neg, 's-neg', text)
    text = this.genTag(d.s_pos, 's-pos', text)
    text = this.genTag(d.v_pos, 'v-pos', text)
    return text
  }

  sentimentCat(d) {
    return this.posFilter(d) ? 'pos' : this.negFilter(d) ? 'neg' : 'neu'
  }

  renderHeadline(curr, data, el) {
    if (curr < data.sentiments.length) {
      var d = data.sentiments[curr]

      // Update values for count graph
      var prevCounts = data.counts[curr]
      var counts = Object.assign({}, prevCounts)
      counts[this.sentimentCat(d)]++
      counts.total++
      data.counts.push(counts)

      d3.select(el).insert('div', ':first-child')
        .datum(d)
        .attr('class', 'headline')
        .html((d) => this.emText(d))
        .style('background-color', (d) => this.cScale(d.sentiment.compound))
        .style('margin-top', function() { return `-${d3.select(this).node().offsetHeight}px` })
        .style('display', (d) => this[this.currentFilter](d) ? null : 'none')
        .transition()
        .delay(200)
        .style('margin-top', '0px')

      var lines = d3.select(el.parentNode)

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

      var next = data.sentiments[curr + 1]
      var duration = this[this.currentFilter](next) ? 2400 : 0

      setTimeout(() => { this.renderHeadline(curr + 1, data, el) }, duration)
    } else {
      d3.select(el).insert('div', ':first-child')
          .attr('class', 'headlines-end')
          .text('End of feed')
    }
  }

  createHeadlines(data, el, index) {
    console.log(data)

    setTimeout(() => {
      var curr = 0
      this.renderHeadline(curr, data, el)
    }, index * 400)
  }
}
