/*global window, rJS, RSVP, domsugar, ensureArray, jIO */
/*jslint nomen: true, indent: 2, maxerr: 3 */
(function (window, rJS, RSVP, domsugar, ensureArray, jIO) {
  "use strict";

  function generateSection(title, icon, view_list) {
    var i,
      dom_list = [];

    for (i = 0; i < view_list.length; i += 1) {
      dom_list.push(domsugar('li', [domsugar('a', {
        href: view_list[i].link,
        text: view_list[i].title
      })]));
    }

    return domsugar(null, [
      domsugar('section', {class: 'ui-content-header-plain'}, [
        domsugar('h3', [
          domsugar('span', {class: 'ui-icon ui-icon-' + icon, html: '&nbsp;'}),
          title
        ])
      ]),
      domsugar('ul', {class: 'document-listview'}, dom_list)
    ]);

  }

  rJS(window)
    /////////////////////////////////////////////////////////////////
    // Acquired methods
    /////////////////////////////////////////////////////////////////
    .declareAcquiredMethod("getUrlFor", "getUrlFor")
    .declareAcquiredMethod("getUrlForList", "getUrlForList")
    .declareAcquiredMethod("getTranslationList", "getTranslationList")
    .declareAcquiredMethod("updateHeader", "updateHeader")

    /////////////////////////////////////////////////////////////////
    // declared methods
    /////////////////////////////////////////////////////////////////

    /** Render only transforms its arguments and passes them to mutex-protected onStateChange

    options:
      jio_key: {string} currently viewed document (e.g. foo/1)
      page: {string} selected page (always "tab" for page_tab)
      view: {string} always "view"
      selection, history, selection_index
    */
    .declareMethod("render", function (options) {
      var gadget = this,
        action_json_url,
        group_list;
      action_json_url = rJS.getAbsoluteURL(
        "api/jIOWebSection_getAPIJSONHyperSchema",
        gadget.__path
      )
      // Get the whole view as attachment because actions can change based on
      // what view we are at. If no view available than fallback to "links".
      return new RSVP.Queue()
        .push(function () {
          return jIO.util.ajax({
            type: "GET",
            url: action_json_url,
          });
        })
        .push(function (evt) {
          return JSON.parse(evt.target.response);
        })
        .push(function (api_action_list) {
          var get_action_array = [],
              put_action_array = [],
              post_action_array = [],
              allDocs_action_array = [],
              jio_type;
          for (let i = 0; i < api_action_list.links.length; i++) {
            switch (api_action_list.links[i].jio_type) {
              case 'get':
                get_action_array.push(api_action_list.links[i]);
                break;
              case 'put':
                put_action_array.push(api_action_list.links[i]);
                break;
              case 'allDocs':
                allDocs_action_array.push(api_action_list.links[i]);
                break;
              case 'post':
                post_action_array.push(api_action_list.links[i]);
                break;
              default:
                throw "Unexpected jio type"
            }
          }

          var i,
            j,
            url_for_kw_list = [];

          group_list = [
            // Action list, editable, icon
            ensureArray(post_action_array), undefined, 'plus',
            ensureArray(allDocs_action_array), undefined, 'search',
            ensureArray(put_action_array), true, 'pencil',
            ensureArray(get_action_array), undefined, 'eye'];

          for (i = 0; i < group_list.length; i += 3) {
            for (j = 0; j < group_list[i].length; j += 1) {
              url_for_kw_list.push({command: 'display_with_history_and_cancel', options: {
                page: "json_form_schema_api",
                api_url: api_action_list.base + group_list[i][j].href,
                schema_url: group_list[i][j].targetSchema
              }});
            }
          }

          return RSVP.hash({
            url_list: gadget.getUrlForList(url_for_kw_list),
            translation_list: gadget.getTranslationList(['Create', 'Search', 'Update', 'View']),
            page_title: "API Action List"
          });
        })

        .push(function (result_dict) {
          var i,
            j,
            k = 0,
            dom_list = [],
            link_list;

          for (i = 0; i < group_list.length; i += 3) {
            link_list = [];
            for (j = 0; j < group_list[i].length; j += 1) {
              link_list.push({
                title: group_list[i][j].title,
                link: result_dict.url_list[k]
              });
              k += 1;
            }
            dom_list.push(
              generateSection(result_dict.translation_list[i / 3], group_list[i + 2], link_list)
            );

          }

          domsugar(gadget.element, dom_list);

          return gadget.updateHeader({
            page_title: result_dict.page_title
          });
        });
    })

    .declareMethod("triggerSubmit", function () {
      return;
    });

}(window, rJS, RSVP, domsugar, ensureArray, jIO));
