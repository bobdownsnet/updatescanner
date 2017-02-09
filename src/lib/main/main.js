import * as view from 'main/main_view';
import {paramEnum, actionEnum} from 'main/main_url';
import {Sidebar} from 'main/sidebar';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {diff} from 'diff/diff';

/**
 * Class representing the main Update Scanner content page.
 */
export class Main {
  /**
   * @property {Sidebar} sidebar - Object representing the sidebar element.
   * @property {PageStore} pageStore - Object used for saving and loading data
   * from storage.
   * @property {Page} currentPage - Currently selected page.
   * @property {view.ViewTypes} viewType - Currently selected view type.
   */
  constructor() {
    this.sidebar = new Sidebar('#tree');
    this.pageStore = undefined;
    this.currentPage = undefined;
    this.viewType = view.ViewTypes.DIFF;
  }

  /**
   * Initialises the main page's sidebar and content iframe.
   */
  async init() {
    this.pageStore = await PageStore.load();

    view.bindMenu();
    view.bindViewDropdownChange(this._handleViewDropdownChange.bind(this));

    this.sidebar.load(this.pageStore.pageMap, PageStore.ROOT_ID);
    this.sidebar.registerSelectHandler((evt, data) =>
                                       this._handleSelect(evt, data));

    this._handleUrlParams(window.location.search);
  }

  /**
   * Parse and handle URL query parameters.
   *
   * @param {string} searchString - Query portion of the URL, starting with the
   * '?' character.
   */
  _handleUrlParams(searchString) {
    const params = new URLSearchParams(searchString);
    switch (params.get(paramEnum.ACTION)) {
      case actionEnum.NEW_PAGE:
        break;

      case actionEnum.SHOW_DIFF:
      {
        this.currentPage = this.pageStore.getPage(params.get(paramEnum.ID));
        this._refreshView();
        break;
      }
    }
  }

  /**
   * Called whenever a single item in the sidebar is selected.
   *
   * @param {Page|PageFolder} item - Selected Page or PageFolder object.
   */
  _handleSelect(item) {
    if (item instanceof Page) {
      this.currentPage = item;
      this.viewType = view.ViewTypes.DIFF;
      this._refreshView();
    }
  }

  /**
   * Called whenever the view dropdown selection changes.
   *
   * @param {view.ViewTypes} viewType - New value of the dropdown.
   */
  _handleViewDropdownChange(viewType) {
    this.viewType = viewType;
    this._refreshView();
  }

  /**
   * Refreshes the view, reloading any necessary HTML from storage.
   */
  async _refreshView() {
    switch (this.viewType) {
      case view.ViewTypes.OLD:
      {
        const html = await loadHtml(this.currentPage,
          PageStore.htmlTypes.OLD) || '';
        view.viewOld(this.currentPage, html);
        break;
      }

      case view.ViewTypes.NEW:
      {
        const html = await loadHtml(this.currentPage,
          PageStore.htmlTypes.NEW) || '';
        view.viewNew(this.currentPage, html);
        break;
      }

      case view.ViewTypes.DIFF:
      default:
      {
        const html = await loadDiff(this.currentPage);
        view.viewDiff(this.currentPage, html);
      }
    }
  }
}

/**
 * Load the HTMLs of the specified page, perform a diff and return the
 * highlighted HTML.
 *
 * @param {Page} page - Page object to load.
 *
 * @returns {Promise} A promise that fulfils with the highlighted HTML string.
 */
async function loadDiff(page) {
  const oldHtml = await loadHtml(page, PageStore.htmlTypes.OLD);
  const newHtml = await loadHtml(page, PageStore.htmlTypes.NEW);
  return diff(page, oldHtml, newHtml);
}

/**
 * Loads the specified Page HTML from the PageStore.
 *
 * @param {Page} page - Page to load.
 * @param {string} htmlType - PageStore.htmlTypes string identifying the HTML
 * type.
 * @returns {Promise} A Promise to be fulfilled with the requested HTML, or
 * undefined if the HTML does not exist in storage.
 */
async function loadHtml(page, htmlType) {
  const html = await PageStore.loadHtml(page.id, htmlType);

  if (html === undefined) {
    console.log(`Could not load '${page.title}' ${htmlType} HTML from storage`);
  }
  return html;
}
