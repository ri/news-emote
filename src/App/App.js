import * as styles from './App.scss'
import {Headlines} from './Headlines'
import data from './data-us.json'
import * as d3 from 'd3'

export class App {

  constructor(options) {
    this.props = {
      dom: null,
      rest: 'test rest',
      ...options // ES6: rest properties
    };
    console.log(this.props);

    var headlines = new Headlines(data, '#feeds')
    // this.props.dom.HTML =
  }

  render(json) {

    // d3.queue()
    //   .defer(d3.json, './data-au.json')
    //   .await((e, d) => new Headlines(e, d))
    // if (json) {
    //   const trs = json.items.map(item => {
    //     const row = [
    //       `<a href="${item.html_url}" target="_blank">${item.full_name}</a>`,
    //       item.score
    //     ];

    //     return `<tr>${row.map(r => `<td>${r}</td>`).join('')}</tr>`;
    //   }).join('');

    //   // table
    //   const table = document.createElement('table');
    //   table.classList.add(styles.table);

    //   const caption = '<caption>Popular ES6 projects at github.com</caption>';

    //   // thead
    //   const thead = `<thead><tr>${['name', 'correlation'].map(t => `<th>${t}</th>`).join('')}</tr></thead>`;

    //   // tbody
    //   const tbody = `<tbody>${trs}</tbody>`;

    //   table.innerHTML = `${caption}${thead}${tbody}`;

    //   this.props.dom.innerHTML = '';
    //   this.props.dom.appendChild(table);
    // }
  }

}
