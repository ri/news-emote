import * as styles from './App.scss'
import {Headlines} from './Headlines'
import data from './data-us.json'

export class App {
  constructor(options) {
    this.props = {
      dom: null,
      rest: 'test rest',
      ...options // ES6: rest properties
    }
    console.log(this.props)
  }

  render(json) {
    var headlines = new Headlines(json, '#feeds')
  }
}
