class Headlines {

  constructor(e, data) {
    this.data = data["news-data"]
    this.data.forEach((d) => {
      d.counts = []
      d.counts[0] = { pos: 0, neg: 0, neu: 0, total: 0 }
    })

    this.noNeutralFilter = (d) => !(d.sentiment.compound > -0.25 && d.sentiment.compound < 0.25)
    this.posFilter = (d) => d.sentiment.compound >= 0.25
    this.negFilter = (d) => d.sentiment.compound <= -0.25
    this.noFilter = (d) => true
    this.currentFilter = this.noFilter

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
    this.cScale = d3.scalePow(2).domain([-1, -0.5, 0, 0.5, 1]).range(['#d7191c','#fdae61','#ffffbf','#a6d96a','#1a9641'])
    this.lineY = d3.scaleLinear().range([100, 0])
    this.lineX = d3.scaleLinear().domain([0, 10]).range([0, 100])
    this.contain = d3.select("#feeds")
    this.line = d3.line()
      .x((d,i) => this.lineX(i))
      .y((d) => this.lineY(d.pos/d.total ? d.pos/d.total : 0))

    this.draw()
  }

  draw() {
    var self = this

    this.newsFeeds = this.contain.selectAll("div.news-feed")
      .data(this.data)
      .enter()
      .append("div")
      .attr("class", "news-feed")

    this.newsFeeds.append("div")
      .attr("class", "title")
      .text((d) => d.name)

    this.lines = this.newsFeeds.append("svg")
      .attr("class", "sentiment-lines")
      .attr("width", "100%")
      .attr("height", 100)

    this.posLine = this.lines.append("path")
      .datum((d) => d.counts)
      .attr("stroke", "black")
      .attr("fill", "none")
      .attr("class", "pos-line")
      .attr("d", this.line)


    this.newsFeeds.append("div")
      .attr("class", "headlines")
      .each(function(d,i) { self.createHeadlines(d, this, i)})

    d3.select("#show-all").on("click", () => this.filterBy(this.noFilter))
    d3.select("#hide-neutral").on("click", () => this.filterBy(this.noNeutralFilter))
    d3.select("#all-bad").on("click", () => this.filterBy(this.negFilter))
    d3.select("#all-good").on("click", () => this.filterBy(this.posFilter))

  }

  filterBy(filter) {
    this.currentFilter = filter
    this.contain.selectAll(".headline")
      .style("display", (d) => filter(d) ? null : "none")
  }

  genTag(entries, tag, text) {
    var tagged = text
    if(entries.length >0) {
      entries.forEach((w) => tagged = text.replace(w.word, `<span class="${tag}">${w.word}</span>`))
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
    return this.posFilter(d) ? "pos" : this.negFilter(d) ? "neg" : "neu"
  }

  createHeadlines(data, el, index) {
    console.log(data)
    var headlines = data.sentiments

    d3.timeout(() => {
      var curr = 0

      var t = d3.interval(() => {
        if (curr < headlines.length) {
          var d = data.sentiments[curr]

          // Update values for count graph
          var prevCounts = data.counts[curr]
          var counts = Object.assign({}, prevCounts)
          counts[this.sentimentCat(d)]++
          counts.total++
          data.counts.push(counts)

          d3.select(el).insert("div", ":first-child")
            .datum(d)
            .attr("class", "headline")
            .html((d) => this.emText(d))
            .style("background-color", (d) => this.cScale(d.sentiment.compound))
            .style("margin-top", function() { return `-${d3.select(this).node().offsetHeight}px`})
            .style("display", (d) => this.currentFilter(d) ? null : "none")
            .transition()
            .delay(200)
            .style("margin-top", "0px")

          var lines = d3.select(el.parentNode)
          lines.select(".sentiment-lines .pos-line")
            .datum((d) => data.counts)
            .attr("d", this.line)

          curr++
          // if (!this.currentFilter(d)) { t.flush()}
        } else { t.stop() }
      }, 2000)
    }, index * 400)


      // .style("background-color", (d) => cScale(d.sentiment.compound))
  }
}

d3.queue()
  .defer(d3.json, 'data/data-us.json')
  .await((e, d) => new Headlines(e, d))
