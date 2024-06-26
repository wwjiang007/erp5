/*globals window, RSVP, rJS*/
/*jslint indent: 2, nomen: true, maxlen: 80*/

(function (window, RSVP, rJS) {
  "use strict";

  rJS(window)
    .declareAcquiredMethod("getUrlParameter", "getUrlParameter")
    .declareAcquiredMethod("updateHeader", "updateHeader")
    .declareAcquiredMethod("jio_allDocs", "jio_allDocs")
    .allowPublicAcquisition('updateHeader', function () {
      return;
    })
    .allowPublicAcquisition("jio_allDocs", function (param_list) {
      var gadget = this;
      return gadget.jio_allDocs(param_list[0])
        .push(function (result) {
          var i, value, news, len = result.data.total_rows;
          for (i = 0; i < len; i += 1) {
            if (result.data.rows[i].value.hasOwnProperty("dummy")) {
              value = result.data.rows[i].id;
              result.data.rows[i].value['listbox_uid:list'] = {
                "key": "",
                "value": ""
              };
              result.data.rows[i].value.dummy = {
                field_gadget_param: {
                  css_class: "",
                  hidden: 0,
                  default: {
                    jio_key: value,
                    display_header: i === 0
                  },
                  editable: true,
                  key: 'financial_in_listbox',
                  url: "gadget_erp5_eci_financial_widget.html",
                  type: "GadgetField"
                }
              };
            }
          }
          return result;
        });
    })
    .allowPublicAcquisition('getUrlParameter', function (argument_list) {
      return this.getUrlParameter(argument_list)
        .push(function (result) {
          if ((result === undefined) &&
              (argument_list[0] === 'field_listbox_sort_list:json')) {
            return [['title', 'ascending']];
          }
          return result;
        });
    })

    .declareMethod("render", function () {
      var gadget = this,
        kpi_data;
      return new RSVP.Queue()
        .push(function () {
          return RSVP.all([
            gadget.updateHeader({page_title: "Financial Data"}),
            gadget.getUrlParameter("extended_search")
          ]);
        })
        .push(function () {
          return RSVP.all([
            gadget.getDeclaredGadget("dygraph"),
            gadget.getDeclaredGadget("form_list"),
            gadget.jio_allDocs({
              query: 'portal_type: "kpi"',
              select_list: ['data']
            })
          ]);
        })
        .push(function (response_list) {
          var column_list = [
            ['title', 'Title'],
            ['dummy', 'Situation']
          ];

          return RSVP.all([
            response_list[0].render({
              data: response_list[2].data.rows[0].value.data
            }),
            response_list[1].render({
              erp5_document: {
                "_embedded": {
                  "_view": {
                    "listbox": {
                      "column_list": column_list,
                      "show_anchor": 0,
                      "default_params": {},
                      "editable": true,
                      "key": "field_listbox",
                      "lines": 20,
                      "css_class": "financial_listbox",
                      "list_method": "portal_catalog",
                      "query": 'urn:jio:allDocs?query=' + 'portal_type:' +
                               '"publisher"',
                      "portal_type": [],
                      "search_column_list": [],
                      "sort_column_list": [],
                      "sort_on": ["title", "ascending"],
                      "title": "Documents",
                      "type": "ListBox"
                    }
                  }
                },
                "_links": {"type": { name: ""}}
              },
              form_definition: {
                group_list: [
                  [
                    "bottom",
                    [["listbox"]]
                  ],
                  [
                    "hidden",
                    ["listbox_modification_date"]
                  ]
                ]
              }
            })
          ]);
        });
    });
}(window, RSVP, rJS));