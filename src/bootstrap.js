// global css
import './theme/theme.scss'

// classes you want to use immediately
import {App} from './App'
import reqwest from 'reqwest'
import queryString from 'query-string'
// import './vendor/scrollsnap-polyfill.bundled'
/**
 * entrance code for SPA
 */
function main() {
  document.title = 'Loading...'

  // Query string format: ?loc=us|au&filter=bad|good|mixed
  var dom = document.querySelector('.content')
  var hash = queryString.parse(location.search)
  var loc = 'au'
  var filter = null
  var lang = navigator.language || navigator.userLanguage

  if (hash.loc === 'us' || (!hash.loc && lang.toLowerCase() === 'en-us')) {
    loc = 'us'
  } else if (hash.loc === 'uk') {
    loc = 'uk'
  }

  if (hash.filter === 'neg' | hash.filter === 'pos' | hash.filter === 'mixed') {
    filter = hash.filter
  }

  const app = new App({
    dom: dom
  })

  reqwest({
    url: `https://s3.amazonaws.com/data.newsemote/${loc}/latest.json`,
    type: 'json',
    crossOrigin: true,
    success: (resp) => app.render(resp, loc, filter)
  })

  // we can make requests to multiple domains, check out proxy/rules.js

  // send request to github.com
  // http.get('https://s3.amazonaws.com/data.newsemote/us/latest.json').then((res) => {
  //   const data = JSON.parse(res)
  //   app.render(data)
  //   document.title = 'App Started'
  // })

  // // send request to npmjs.org
  // http.get('/node-1').then((json) => console.log('From npmjs.org: ', json))

  // console.log([1, 2, 3, 4].includes(1)) // ES7: Array.prototype.includes
}

document.addEventListener('DOMContentLoaded', main)
